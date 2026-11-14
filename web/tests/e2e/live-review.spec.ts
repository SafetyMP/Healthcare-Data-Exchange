import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator, reverse = false) {
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press(reverse ? "Shift+Tab" : "Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  await expect(target).toBeFocused();
}

async function expectAccessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
}

async function expectDocumentFits(page: Page) {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  // An internal table may scroll; the document and its controls must not.
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
}

test.describe("Published experience review regressions", () => {
  test("search finds the identifier displayed beside a patient", async ({ page }) => {
    await page.goto("./patients/");
    await page.getByRole("textbox", { name: "Search synthetic patients" }).fill("EU-001-TEST");
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toBeVisible();
    await expect(page.locator("button[aria-pressed]")).toHaveCount(1);
    await expect(page.getByText("No matching patients.", { exact: true })).toHaveCount(0);
  });

  test("activity distinguishes requester identities for the same patient and purpose", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001&purpose=treatment&requester=eu-home");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.getByLabel("Requesting team").selectOption("us-home");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Activity", exact: true }).click();
    const rows = page.locator(".activity-list li");
    await expect(rows).toHaveCount(2);
    const allowed = rows.filter({ hasText: "EU home care team" });
    await expect(allowed).toHaveCount(1);
    await expect(allowed).toContainText("Anna Mueller");
    await expect(allowed).toContainText("treatment");
    await expect(allowed).toContainText("Access allowed");
    const denied = rows.filter({ hasText: "US home care team" });
    await expect(denied).toHaveCount(1);
    await expect(denied).toContainText("Anna Mueller");
    await expect(denied).toContainText("treatment");
    await expect(denied).toContainText("Access blocked");
  });

  test("history honors an explicit cross-region requester over the automatic regional default", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("patient", "patient-us-001");
      url.searchParams.set("purpose", "treatment");
      url.searchParams.set("requester", "eu-home");
      window.history.pushState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    });
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-home");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change requesting team", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await expect(page.getByRole("heading", { name: /^Access (allowed|blocked)$/ })).toHaveCount(0);
    await page.goForward();
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-home");
  });

  test("regional denial keeps the requesting team through consent and sidebar navigation", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001&purpose=treatment&requester=us-home");
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Change requesting team", exact: true }).click();
    await expect(page.getByLabel("Requesting team")).toBeFocused();
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await page.getByRole("link", { name: "View consent", exact: true }).click();
    await expect(page.getByLabel("Patient", { exact: true })).toHaveValue("patient-eu-001");
    await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("treatment");
    await page.getByRole("radio", { name: /^Grant consent/ }).check();
    await page.getByRole("button", { name: "Save consent", exact: true }).click();
    await page.getByRole("link", { name: "Check patient access", exact: true }).click();
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await expect(page.getByLabel("Purpose of access")).toHaveValue("treatment");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);

    const nav = page.getByRole("navigation", { name: "Primary", exact: true });
    await nav.getByRole("link", { name: "Consent management", exact: true }).click();
    await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("treatment");
    await nav.getByRole("link", { name: /^Patient access/ }).click();
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("button", { name: "Change requesting team", exact: true })).toBeVisible();
    await expectAccessible(page);
  });

  test("an allowed record leads directly to revoke consent and recheck the same request", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001&purpose=treatment&requester=eu-home");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole("link", { name: "Manage consent", exact: true }).click();
    await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("treatment");
    await page.getByRole("radio", { name: /^Revoke consent/ }).check();
    await page.getByRole("button", { name: "Save consent", exact: true }).click();
    await page.getByRole("link", { name: "Check patient access", exact: true }).click();
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-home");
    await expect(page.getByLabel("Purpose of access")).toHaveValue("treatment");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review consent", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change requesting team", exact: true })).toHaveCount(0);
    await expect(page.locator("dd")).toHaveCount(0);
  });

  test("same-patient purpose history and reload never retain an earlier decision", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001&purpose=treatment&requester=eu-visiting");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("purpose", "research");
      window.history.pushState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    });
    await expect(page.getByLabel("Purpose of access")).toHaveValue("research");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByLabel("Purpose of access")).toHaveValue("treatment");
    await expect(page.getByRole("heading", { name: /^Access (allowed|blocked)$/ })).toHaveCount(0);
    await page.goForward();
    await expect(page.getByLabel("Purpose of access")).toHaveValue("research");
    await expect(page.getByRole("heading", { name: /^Access (allowed|blocked)$/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel("Purpose of access")).toHaveValue("research");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await expect(page.getByRole("heading", { name: /^Access (allowed|blocked)$/ })).toHaveCount(0);
  });

  test("mobile keyboard menu supports Escape, same-route focus and active route", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    const menuButton = page.getByRole("button", { name: "Open navigation", exact: true });
    await tabTo(page, menuButton);
    await page.keyboard.press("Enter");
    let menu = page.getByRole("navigation", { name: "Mobile", exact: true });
    const overview = menu.getByRole("link", { name: "Overview", exact: true });
    await expect(overview).toHaveAttribute("aria-current", "page");
    await expect(menu.getByRole("link", { name: "Documentation (opens in a new tab)", exact: true })).toBeVisible();
    await tabTo(page, overview);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    await page.keyboard.press("Enter");
    await tabTo(page, overview);
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    await expect(menu).toHaveCount(0);
    await tabTo(page, menuButton, true);
    await page.keyboard.press("Enter");
    menu = page.getByRole("navigation", { name: "Mobile", exact: true });
    await tabTo(page, menu.getByRole("link", { name: "Patient access", exact: true }));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Patient access", exact: true })).toBeVisible();
    await expect(page.locator("#main-content")).toBeFocused();
    await expect(menu).toHaveCount(0);
    await tabTo(page, menuButton, true);
    await page.keyboard.press("Enter");
    await expect(menu.getByRole("link", { name: "Patient access", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(menu.getByRole("link", { name: "Overview", exact: true })).not.toHaveAttribute("aria-current", "page");
  });

  test("short desktop sidebar keeps its last links keyboard reachable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    await page.goto("./");
    const documentation = page.locator(".desktop-sidebar").getByRole("link", { name: "Documentation", exact: true });
    await tabTo(page, documentation);
    await expect(documentation).toBeFocused();
    await expect(documentation).toBeInViewport({ ratio: 1 });
    expect(await page.locator(".desktop-sidebar").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const oversight = page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "AI oversight", exact: true });
    await tabTo(page, oversight, true);
    await expect(oversight).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "AI oversight", exact: true })).toBeVisible();
  });

  for (const width of [390, 768, 1024, 1280]) {
    test(`overview and access controls fit ${width}px with readable supporting text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("./");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectDocumentFits(page);
      for (const selector of [".intro-copy > p", ".scenario-card > p"]) {
        expect(await page.locator(selector).evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
      }
      expect(await page.locator(".patient-name-link small").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(12);
      await page.goto("./patients/");
      await expectDocumentFits(page);
      await expect(page.getByRole("button", { name: "Check access", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Check access", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
      await expectDocumentFits(page);
    });
  }
});
