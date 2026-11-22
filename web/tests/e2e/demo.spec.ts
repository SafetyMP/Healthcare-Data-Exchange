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
  test("disclosure manifest excludes prohibited fields before staging and invalidates a packet on withdrawal", async ({ page }) => {
    await page.goto("./#research-request");
    const stage = page.getByRole("button", { name: "Stage packet" });
    await expect(stage).toBeDisabled();
    await page.getByRole("button", { name: "Check policy" }).click();
    await expect(page.getByText("Remove fields marked Withhold")).toBeVisible();
    await expect(stage).toBeDisabled();
    await page.getByRole("checkbox", { name: /name/ }).uncheck();
    await page.getByRole("button", { name: "Hold request" }).click();
    await expect(stage).toBeDisabled();
    await page.getByRole("checkbox", { name: /resourceType/ }).uncheck();
    await page.getByRole("checkbox", { name: /resourceType/ }).check();
    await expect(stage).toBeDisabled();
    await page.getByRole("button", { name: "Recheck and reopen" }).click();
    await stage.click();
    expect(JSON.parse(await page.getByLabel("Staged JSON").innerText())).toEqual({ id: "patient-eu-001", resourceType: "Patient" });
    await page.getByText("Replay a patient consent event", { exact: true }).click();
    await page.getByRole("button", { name: "Replay patient withdrawal" }).click();
    await expect(page.getByLabel("Staged JSON")).toHaveCount(0);
    await expect(page.getByText(/Before: 200 · id, resourceType. After: 403 · no fields/)).toBeVisible();
    await expect(stage).toBeDisabled();
    await page.getByRole("button", { name: "Replay patient grant" }).click();
    await expect(stage).toBeEnabled();
    await page.getByRole("checkbox", { name: /name/ }).check();
    await expect(stage).toBeDisabled();
  });

  test("disclosure queue retains draft work and distinguishes consent from regional eligibility", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: /DX-105/ }).click();
    await page.getByRole("button", { name: "Check policy" }).click();
    await expect(page.getByText(/403 · consent_required/)).toBeVisible();
    await page.getByText("Replay a patient consent event", { exact: true }).click();
    await page.getByRole("button", { name: "Replay patient grant" }).click();
    await page.getByRole("button", { name: "Stage packet" }).click();
    expect(Object.keys(JSON.parse(await page.getByLabel("Staged JSON").innerText()))).toEqual(["id", "resourceType", "birthDate"]);
    await page.getByRole("button", { name: /DX-106/ }).click();
    await page.getByRole("button", { name: "Check policy" }).click();
    await expect(page.getByText(/403 · residency_denied/)).toBeVisible();
    await page.getByRole("button", { name: "Hold request" }).click();
    await expect(page.getByRole("button", { name: /DX-106/ })).toContainText("On hold");
    await page.getByRole("button", { name: /DX-105/ }).click();
    await expect(page.getByLabel("Staged JSON")).toContainText("birthDate");
    await page.getByText("Session and reset", { exact: true }).click();
    await page.getByRole("button", { name: "Reset tab demo" }).click();
    await expect(page.getByRole("button", { name: /DX-104/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /DX-105/ })).toContainText("Unreviewed");
    await page.getByRole("button", { name: /DX-105/ }).click();
    await page.getByRole("button", { name: "Check policy" }).click();
    await expect(page.getByText(/403 · consent_required/)).toBeVisible();
  });

  test("a staged disclosure packet is discarded on reload while patient decisions persist in the tab", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: /DX-105/ }).click();
    await page.getByRole("button", { name: "Check policy" }).click();
    await page.getByText("Replay a patient consent event", { exact: true }).click();
    await page.getByRole("button", { name: "Replay patient grant" }).click();
    await page.getByRole("button", { name: "Stage packet" }).click();
    await page.reload();
    await page.getByRole("button", { name: /DX-105/ }).click();
    await expect(page.getByLabel("Staged JSON")).toHaveCount(0);
    await page.getByRole("button", { name: "Check policy" }).click();
    await expect(page.getByText(/200 · In-region access/)).toBeVisible();
  });

  test("mirror digest comparison distinguishes a publication from the working policy", async ({ page }) => {
    await page.goto("./#policy-provenance");
    const guide = page.locator("#policy-provenance");
    if (!await guide.getByRole("button", { name: "Compare digest" }).isVisible()) await guide.locator("summary").click();
    const compare = guide.getByRole("button", { name: "Compare digest" });
    await compare.click();
    await expect(guide.getByRole("status")).toContainText("Matches the published bundle digest");
    await guide.getByRole("button", { name: "Load working digest" }).click();
    await expect(guide.getByRole("status")).toBeEmpty();
    await compare.click();
    await expect(guide.getByRole("status")).toContainText("working tree only");
    await guide.getByLabel("Candidate bundle digest").fill("0".repeat(64));
    await compare.click();
    await expect(guide.getByRole("status")).toContainText("Digest differs");
    await guide.getByLabel("Candidate bundle digest").fill("x");
    await compare.click();
    await expect(guide.getByRole("status")).toContainText("64-character");
  });

  test("pilot worksheet distinguishes staffing value, shortfall and incomplete inputs", async ({ page }) => {
    await page.goto("./#pilot-costs");
    await expect(page.getByText("$3,600 above cost", { exact: true })).toBeVisible();
    const comparison = page.getByRole("figure", { name: "Year-one cost and staff capacity comparison" });
    await expect(comparison).toContainText("$18,000");
    await expect(page.getByText(/Break-even requires 4 minutes/)).toBeVisible();
    const time = page.getByLabel("Minutes saved per request");
    await time.fill("4");
    await expect(page.getByText("$0 at break-even", { exact: true })).toBeVisible();
    await time.fill("0");
    await expect(comparison).toContainText("Staff capacity $0");
    await expect(page.getByText("$14,400 shortfall", { exact: true })).toBeVisible();
    await page.getByLabel("Eligible requests per month").fill("");
    await expect(page.getByText(/Enter a whole number/)).toBeVisible();
  });

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
    await expect(page.getByLabel("Purpose of access")).toHaveValue("treatment");
    await expect(page.getByLabel("Requesting team")).toHaveValue("eu-visiting");
    await page.getByLabel("Purpose of access").selectOption("research");
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
      window.history.pushState(null, "", url);
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

  test("mobile disclosure desk supports keyboard actions and an accessible technical reference", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Disclosure desk", level: 1 })).toBeVisible();
    const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width.content).toBeLessThanOrEqual(width.viewport);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
    const check = page.getByRole("button", { name: "Check policy" });
    await check.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Remove fields marked Withhold")).toBeVisible();
    await page.getByRole("checkbox", { name: /name/ }).uncheck();
    await page.getByRole("button", { name: "Stage packet" }).click();
    await expect(page.getByLabel("Staged JSON")).toContainText("patient-eu-001");
    await page.getByRole("link", { name: "Technical reference" }).click();
    await page.locator("#policy-provenance summary").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Published policy mirror" })).toBeVisible();
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  });
});

test("unrecognized purpose input cannot alter workflow links", async ({ page }) => {
  const injected = '<img src=x onerror=alert(1)>&patient=patient-us-001';
  await page.goto(`./patients/?purpose=${encodeURIComponent(injected)}`);
  await expect(page.getByLabel("Purpose of access")).toHaveValue("treatment");
  await page.getByLabel("Purpose of access").selectOption("research");
  await page.getByRole("button", { name: "Check access", exact: true }).click();
  const link = page.getByRole("link", { name: "Review consent", exact: true });
  const href = await link.getAttribute("href");
  expect(href).not.toBeNull();
  const destination = new URL(href ?? "", page.url());
  expect(destination.origin).toBe(new URL(page.url()).origin);
  expect(destination.pathname).toMatch(/\/consent\/?$/);
  expect([...destination.searchParams.keys()].sort()).toEqual(["patient", "purpose", "requester"]);
  expect(destination.searchParams.get("patient")).toBe("patient-eu-001");
  expect(destination.searchParams.get("purpose")).toBe("research");
  expect(destination.searchParams.get("requester")).toBe("eu-visiting");
  await link.click();
  await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("research");
  await expect(page.locator("img[onerror]")).toHaveCount(0);
});
