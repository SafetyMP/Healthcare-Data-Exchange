import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function saveResearchConsent(page: Page, granted: boolean) {
  await page.goto("./consent/?patient=patient-eu-001&purpose=research");
  await page.getByLabel("Patient", { exact: true }).selectOption("patient-eu-001");
  await page.getByLabel("Purpose", { exact: true }).selectOption("research");
  await page.getByRole("radio", { name: granted ? /^Grant consent/ : /^Revoke consent/ }).check();
  await page.getByRole("button", { name: "Save consent", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Consent updated", exact: true })).toBeVisible();
}

async function checkResearch(page: Page, allowed: boolean) {
  await page.getByRole("link", { name: "Check patient access", exact: true }).click();
  await expect(page.getByLabel("Purpose of access")).toHaveValue("research");
  await page.getByRole("button", { name: "Check access", exact: true }).click();
  await expect(page.getByRole("heading", { name: allowed ? "Access allowed" : "Access blocked", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: allowed ? "Access blocked" : "Access allowed", exact: true })).toHaveCount(0);
}

test.describe("Static synthetic demo", () => {
  test("consent revoke, grant, retry and reload work without API traffic", async ({ page }) => {
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.split("/").includes("api")) apiRequests.push(request.url());
    });
    await saveResearchConsent(page, false);
    await checkResearch(page, false);
    await saveResearchConsent(page, true);
    await checkResearch(page, true);
    await page.reload();
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await saveResearchConsent(page, false);
    await checkResearch(page, false);
    expect(apiRequests).toEqual([]);
    await page.goto("./activity/");
    await expect(page.getByRole("heading", { name: "Simulated decision history", exact: true })).toBeVisible();
    await expect(page.locator(".activity-list").getByText("Access allowed", { exact: true }).first()).toBeVisible();
    await expect(page.locator(".activity-list li")).not.toHaveCount(0);
  });

  test("changing request context clears the previous allowed record", async ({ page }) => {
    await page.goto("./patients/");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.getByLabel("Requesting team").selectOption("us-home");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await expect(page.locator("dd")).toHaveCount(0);
  });

  test("cross-region derivative only succeeds with the permitted requester", async ({ page }) => {
    await page.goto("./patients/");
    await page.getByLabel("Purpose of access").selectOption("derivative");
    await page.getByLabel("Requesting team").selectOption("us-home");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
    await page.getByLabel("Requesting team").selectOption("us-clinician");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await expect(page.getByText("Limited cross-region derivative: identifying clinical fields are withheld.")).toBeVisible();
    await expect(page.locator("dt").filter({ hasText: /^Name$/ })).toHaveCount(0);
    await expect(page.locator("dt").filter({ hasText: /^Date of birth$/ })).toHaveCount(0);
  });

  test("reset clears consent changes and stale patient results", async ({ page }) => {
    await saveResearchConsent(page, true);
    await checkResearch(page, true);
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access blocked", exact: true })).toBeVisible();
  });

  test("patient search has a recoverable empty state", async ({ page }) => {
    await page.goto("./patients/");
    await page.getByRole("textbox", { name: "Search synthetic patients" }).fill("no-such-patient");
    await expect(page.getByText("No matching patients.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.getByRole("textbox", { name: "Search synthetic patients" })).toHaveValue("");
    await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1);
  });

  test("selected patient follows primary navigation, explicit links and reset", async ({ page }) => {
    await page.goto("./patients/");
    await page.getByRole("button", { name: "Maria Johnson · US", exact: true }).click();
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await page.getByRole("navigation", { name: "Primary", exact: true })
      .getByRole("link", { name: "Consent management", exact: true }).click();
    await expect(page.getByLabel("Patient", { exact: true })).toHaveValue("patient-us-001");
    await page.getByRole("navigation", { name: "Primary", exact: true })
      .getByRole("link", { name: /^Patient access/ }).click();
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");

    await page.goto("./patients/?patient=patient-eu-001");
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await page.getByRole("button", { name: "Maria Johnson · US", exact: true }).click();
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("changing an explicitly linked patient survives reload", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001");
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Maria Johnson · US", exact: true }).click();
    await expect(page).toHaveURL(/patient=patient-us-001/);
    await page.reload();
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
  });

  test("browser history changes patient context without retaining an allowed record", async ({ page }) => {
    await page.goto("./patients/?patient=patient-eu-001");
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("patient", "patient-us-001");
      window.history.pushState(window.history.state, "", url);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    });
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await expect(page.locator("dd")).toHaveCount(0);
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("button", { name: "Anna Mueller · EU", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
    await expect(page.locator("dd")).toHaveCount(0);
    await page.goForward();
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toHaveCount(0);
  });

  test("identity examples carry patient context and unknown identifiers fail clearly", async ({ page }) => {
    await page.goto("./identity/");
    await page.getByRole("button", { name: "US example", exact: true }).click();
    await page.getByRole("button", { name: "Find matching record", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Maria Johnson", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Check patient access", exact: true }).click();
    await expect(page.getByRole("button", { name: "Maria Johnson · US", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Requesting team")).toHaveValue("us-home");
    await page.goto("./identity/");
    await page.getByLabel("Registered identifier", { exact: true }).fill("urn:unknown:no-record");
    await page.getByRole("button", { name: "Find matching record", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching record", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Check patient access", exact: true })).toHaveCount(0);
  });

  test("AI example remains pending human review", async ({ page }) => {
    await page.goto("./ai-triage/");
    await page.getByRole("button", { name: "Run oversight example", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Example created for review", exact: true })).toBeVisible();
    await expect(page.getByText("Human review required", { exact: true })).toBeVisible();
    await expect(page.getByText("Pending human oversight", { exact: true })).toBeVisible();
  });

  for (const [route, title] of [
    ["patients", "Patient access"], ["consent", "Consent management"],
    ["identity", "Identity matching"], ["ai-triage", "AI oversight"],
    ["activity", "Activity"],
  ]) {
    test(`${route} supports direct subpath reload and accessible controls`, async ({ page }) => {
      const response = await page.goto(`./${route}/`);
      expect(response?.status()).toBe(200);
      await page.reload();
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
    });
  }

  test("mobile patient workspace fits the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./patients/");
    await expect(page.getByRole("heading", { name: "Patient access", exact: true })).toBeVisible();
    const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width.content).toBeLessThanOrEqual(width.viewport);
    await page.getByRole("button", { name: "Check access", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Access allowed", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("navigation", { name: "Mobile", exact: true }).getByRole("link", { name: "Consent management", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Consent management", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Mobile", exact: true })).toHaveCount(0);
  });

  test("mobile overview fits and keyboard navigation reaches patient access", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "The right data. The right access.", level: 1 })).toBeVisible();
    const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width.content).toBeLessThanOrEqual(width.viewport);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    await page.getByRole("button", { name: "Open navigation", exact: true }).focus();
    await page.keyboard.press("Enter");
    const patientLink = page.getByRole("navigation", { name: "Mobile", exact: true })
      .getByRole("link", { name: "Patient access", exact: true });
    await patientLink.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Patient access", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Mobile", exact: true })).toHaveCount(0);
  });
});
