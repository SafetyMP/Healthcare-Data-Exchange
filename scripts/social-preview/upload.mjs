#!/usr/bin/env node
/**
 * Upload docs/assets/social-preview.png to GitHub Settings → Social preview.
 * Invoked via ./scripts/upload-social-preview.sh (installs Playwright locally).
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const imagePath = join(root, "docs/assets/social-preview.png");
const repo = "SafetyMP/Healthcare-Data-Exchange";
const baseUrl = "https://github.com";
const statePath = join(homedir(), ".cache", "chex", "github-social-preview-auth.json");

function parseArgs(argv) {
  return { login: argv.includes("--login") };
}

async function launch(headless) {
  const browser = await chromium.launch({ headless });
  const contextOptions = { viewport: { width: 1280, height: 720 } };
  if (existsSync(statePath)) contextOptions.storageState = statePath;
  const context = await browser.newContext(contextOptions);
  return { browser, context, page: await context.newPage() };
}

async function login() {
  mkdirSync(dirname(statePath), { recursive: true });
  const { browser, context, page } = await launch(false);
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  console.log("Sign in to GitHub in the browser window…");
  await page.waitForFunction(() => {
    const login = document.querySelector('meta[name="user-login"]')?.content?.trim();
    return Boolean(login);
  }, null, { timeout: 0, polling: 500 });
  await context.storageState({ path: statePath });
  await browser.close();
  console.log(`Saved session to ${statePath}`);
}

async function upload() {
  if (!existsSync(imagePath)) {
    throw new Error(`Missing ${imagePath}. Run ./scripts/render-social-preview.sh first.`);
  }
  if (!existsSync(statePath)) {
    throw new Error(`No session at ${statePath}. Run: ./scripts/upload-social-preview.sh --login`);
  }

  const { browser, context, page } = await launch(true);
  const settingsUrl = `${baseUrl}/${repo}/settings`;
  await page.goto(settingsUrl, { waitUntil: "domcontentloaded" });

  const username = await page.evaluate(() =>
    document.querySelector('meta[name="user-login"]')?.content?.trim() || ""
  );
  if (!username || page.url().includes("/login")) {
    await browser.close();
    throw new Error("Session expired. Re-run with --login.");
  }

  const socialHeading = page.locator("xpath=//h2[normalize-space()='Social preview']").first();
  await socialHeading.waitFor({ state: "attached", timeout: 60_000 });
  await socialHeading.scrollIntoViewIfNeeded().catch(() => {});

  const editButton = page.locator("#edit-social-preview-button");
  const socialEditButton = page.locator(
    "xpath=(//h2[normalize-space()='Social preview']/following::*[(self::button or self::summary) and normalize-space(.)='Edit'][1])"
  );
  if (await editButton.count()) await editButton.first().click({ force: true }).catch(() => {});
  else if (await socialEditButton.count()) await socialEditButton.first().click({ force: true }).catch(() => {});

  const fileInput = page.locator("input#repo-image-file-input");
  const uploadMenuItem = page.getByText(/upload an image/i).first();
  await Promise.any([
    fileInput.first().waitFor({ state: "attached", timeout: 30_000 }),
    uploadMenuItem.waitFor({ state: "visible", timeout: 30_000 }),
  ]);

  const uploadResponsePromise = page
    .waitForResponse((resp) => {
      const u = resp.url();
      return resp.ok() && (u.includes("/upload/repository-images/") || u.includes("/upload/policies/repository-images"));
    }, { timeout: 20_000 })
    .catch(() => null);

  if (await fileInput.count()) await fileInput.first().setInputFiles(imagePath);
  else {
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), uploadMenuItem.click({ force: true })]);
    await chooser.setFiles(imagePath);
  }

  const uploadResp = await uploadResponsePromise;
  const imageIdInput = page.locator("input.js-repository-image-id");
  await page.waitForFunction(() => {
    const input = document.querySelector("input.js-repository-image-id");
    return Boolean((input?.value || "").trim());
  }, { timeout: 20_000 });

  const newId = await imageIdInput.first().inputValue().catch(() => "");
  await context.storageState({ path: statePath });
  await browser.close();
  console.log(`Social preview uploaded (image id: ${newId.trim()})`);
  if (uploadResp) console.log(`Upload response: ${uploadResp.status()} ${uploadResp.url()}`);
}

const { login: doLogin } = parseArgs(process.argv.slice(2));
if (doLogin) await login();
else await upload();
