import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

function guide(page: Page) {
  return page.getByRole("region", { name: "Guided walkthrough", exact: true });
}

async function startWalkthrough(page: Page) {
  await page.goto("./");
  await expect(page.getByText("Nine checkpoints, using synthetic data. Starting or restarting resets this tab’s demo consent and activity.", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Start guided walkthrough", exact: true }).first().click();
  await expectStep(page, 1);
  await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Purpose of access")).toHaveValue("research");
  await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
}

async function expectStep(page: Page, step: number) {
  await expect(guide(page).getByText(`Step ${step} of 9`, { exact: true })).toBeVisible();
}

async function expectLocked(page: Page, step: number) {
  await expectStep(page, step);
  await expect(guide(page).getByRole("button", { name: "Next step", exact: true })).toBeDisabled();
  await expect(guide(page).getByText("Step complete", { exact: true })).toHaveCount(0);
}

async function nextStep(page: Page, current: number) {
  await expect(guide(page).getByText("Step complete", { exact: true })).toBeVisible();
  await guide(page).getByRole("button", { name: "Next step", exact: true }).click();
  await expectStep(page, current + 1);
}

async function checkAccess(page: Page, allowed: boolean) {
  await page.getByRole("button", { name: "Check access", exact: true }).click();
  await expect(page.getByRole("heading", { name: allowed ? "Access allowed" : "Access blocked", exact: true })).toBeVisible();
}

async function changeConsent(page: Page, granted: boolean) {
  await page.getByRole("radio", { name: granted ? /^Grant consent/ : /^Revoke consent/ }).check();
  await page.getByRole("button", { name: "Save consent", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Consent updated", exact: true })).toBeVisible();
}

async function returnToAccess(page: Page, purpose: string, requester: string) {
  await page.getByRole("link", { name: "Check patient access", exact: true }).click();
  await expect(page.getByLabel("Purpose of access")).toHaveValue(purpose);
  await expect(page.getByLabel("Requesting team")).toHaveValue(requester);
}

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 32; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  await expect(target).toBeFocused();
}

test.describe("Guided synthetic walkthrough", () => {
  test("all nine checkpoints require the real consent and access actions", async ({ page }) => {
    test.setTimeout(60_000);
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.split("/").includes("api")) apiRequests.push(request.url());
    });
    await startWalkthrough(page);
    await expectLocked(page, 1);
    await checkAccess(page, false);
    await nextStep(page, 1);

    // Granting alone is not proof of access: the same request must be checked.
    await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("research");
    await changeConsent(page, true);
    await expectLocked(page, 2);
    await returnToAccess(page, "research", "eu-visiting");
    await checkAccess(page, true);
    await nextStep(page, 2);

    await changeConsent(page, false);
    await expectLocked(page, 3);
    await returnToAccess(page, "research", "eu-visiting");
    await checkAccess(page, false);
    await nextStep(page, 3);

    await expect(page.getByLabel("Purpose of access")).toHaveValue("treatment");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await expectLocked(page, 4);
    await checkAccess(page, true);
    await nextStep(page, 4);

    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await expectLocked(page, 5);
    await checkAccess(page, false);
    await expect(page.getByRole("button", { name: "Change requesting team", exact: true })).toBeVisible();
    await nextStep(page, 5);

    // Consent does not change the requesting identity or override regional denial.
    await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("treatment");
    await changeConsent(page, true);
    await expectLocked(page, 6);
    await returnToAccess(page, "treatment", "us-home");
    await checkAccess(page, false);
    await expect(page.getByRole("button", { name: "Change requesting team", exact: true })).toBeVisible();
    await nextStep(page, 6);

    await expect(page.getByLabel("Purpose of access")).toHaveValue("derivative");
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await expectLocked(page, 7);
    await checkAccess(page, false);
    await nextStep(page, 7);

    await expect(page.getByLabel("Purpose of access")).toHaveValue("derivative");
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-clinician");
    await expectLocked(page, 8);
    await checkAccess(page, true);
    await expect(page.getByText("Limited cross-region derivative: identifying clinical fields are withheld.")).toBeVisible();
    await expect(page.locator("dt").filter({ hasText: /^Name$/ })).toHaveCount(0);
    await nextStep(page, 8);

    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    const history = page.locator(".activity-list");
    await expect(history.getByText("Consent granted", { exact: true }).first()).toBeVisible();
    await expect(history.getByText("Consent revoked", { exact: true })).toBeVisible();
    await expect(history.getByText("Limited access allowed", { exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: /^Patient access/ }).click();
    await expect(guide(page).getByRole("button", { name: "Finish walkthrough", exact: true })).toBeDisabled();
    await guide(page).getByRole("link", { name: "Return to this step", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    await guide(page).getByRole("button", { name: "Finish walkthrough", exact: true }).click();
    await expect(guide(page).getByRole("heading", { name: "Walkthrough complete", exact: true })).toBeVisible();
    expect(apiRequests).toEqual([]);
  });

  test("wrong patient, purpose, team and consent action cannot unlock a checkpoint", async ({ page }) => {
    await startWalkthrough(page);
    await page.getByRole("button", { name: "Jean Dupont · EU", exact: true }).click();
    await checkAccess(page, true);
    await expectLocked(page, 1);
    // Recovery is a same-route query navigation, so it must restore the form too.
    await guide(page).getByRole("link", { name: "Return to this step", exact: true }).click();
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Purpose of access")).toHaveValue("research");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await expectLocked(page, 1);
    await page.getByLabel("Purpose of access").selectOption("treatment");
    await checkAccess(page, true);
    await expectLocked(page, 1);
    await page.getByLabel("Purpose of access").selectOption("research");
    await page.getByLabel("Requesting team").selectOption("eu-home");
    await checkAccess(page, false);
    await expectLocked(page, 1);
    await page.getByLabel("Requesting team").selectOption("eu-visiting");
    await checkAccess(page, false);
    await nextStep(page, 1);
    await changeConsent(page, false);
    await returnToAccess(page, "research", "eu-visiting");
    await checkAccess(page, false);
    await expectLocked(page, 2);
  });

  test("pause, resume, reload, restart and reset preserve an honest progress state", async ({ page }) => {
    await startWalkthrough(page);
    await guide(page).getByRole("button", { name: "Pause walkthrough", exact: true }).click();
    await expect(guide(page).getByRole("heading", { name: "Walkthrough paused", exact: true })).toBeVisible();
    await checkAccess(page, false);
    await page.reload();
    await expect(guide(page).getByRole("heading", { name: "Walkthrough paused", exact: true })).toBeVisible();
    await guide(page).getByRole("button", { name: "Resume walkthrough", exact: true }).click();
    await expectLocked(page, 1);
    await checkAccess(page, false);
    await expect(guide(page).getByText("Step complete", { exact: true })).toBeVisible();
    await page.reload();
    await expectStep(page, 1);
    await nextStep(page, 1);
    await changeConsent(page, true);
    await guide(page).getByRole("button", { name: "Restart walkthrough", exact: true }).click();
    await expectLocked(page, 1);
    await checkAccess(page, false);
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await expect(guide(page).getByText(/^Step \d of 9$/)).toHaveCount(0);
    await expect(guide(page).getByRole("button", { name: "Start guided walkthrough", exact: true })).toBeVisible();
    await page.reload();
    await expect(guide(page).getByText(/^Step \d of 9$/)).toHaveCount(0);
    await expect(guide(page).getByRole("button", { name: "Start guided walkthrough", exact: true })).toBeVisible();
  });

  test("the mobile guide can start, pause and resume using the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    await tabTo(page, page.getByRole("button", { name: "Start guided walkthrough", exact: true }).first());
    await page.keyboard.press("Enter");
    await expectLocked(page, 1);
    let accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);
    const width = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width.document).toBeLessThanOrEqual(width.viewport);
    await tabTo(page, guide(page).getByRole("button", { name: "Pause walkthrough", exact: true }));
    await page.keyboard.press("Enter");
    await expect(guide(page).getByRole("heading", { name: "Walkthrough paused", exact: true })).toBeVisible();
    await tabTo(page, guide(page).getByRole("button", { name: "Resume walkthrough", exact: true }));
    await page.keyboard.press("Enter");
    await expectLocked(page, 1);
    await tabTo(page, page.getByRole("button", { name: "Check access", exact: true }));
    await page.keyboard.press("Enter");
    await expect(guide(page).getByText("Step complete", { exact: true })).toBeVisible();
    accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);
  });

  test("malformed saved progress recovers without crashing or claiming completion", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await startWalkthrough(page);
    for (const corrupted of ["{not-json", '{"version":1,"index":999,"progress":999,"paused":false,"finished":true}']) {
      await page.evaluate((value) => sessionStorage.setItem("chex-walkthrough-v1", value), corrupted);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Patient access", exact: true })).toBeVisible();
      await expect(guide(page).getByRole("button", { name: "Start guided walkthrough", exact: true })).toBeVisible();
      await expect(guide(page).getByRole("heading", { name: "Walkthrough complete", exact: true })).toHaveCount(0);
      await expect(guide(page).getByText(/^Step \d of 9$/)).toHaveCount(0);
    }
    await guide(page).getByRole("button", { name: "Start guided walkthrough", exact: true }).click();
    await expectLocked(page, 1);
    expect(errors).toEqual([]);
  });
});
