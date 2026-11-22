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
  test("research desk presets open the matching access decision", async ({ page }) => {
    for (const [label, purpose, requester, outcome] of [
      ["Research request", "research", "eu-visiting", "Access blocked"],
      ["Different region", "treatment", "us-home", "Access blocked"],
      ["Limited return", "derivative", "us-clinician", "Access allowed"],
    ]) {
      await page.goto("./#research-request");
      await page.getByRole("radio", { name: label, exact: true }).check();
      const intake = page.getByRole("region", { name: "Access request intake" });
      await expect(intake.getByRole("heading", { name: "Anna Mueller" })).toBeVisible();
      const expectedPurpose = purpose === "derivative" ? "Limited derivative" : purpose;
      await expect(intake.locator("dd").nth(1)).toHaveText(new RegExp(expectedPurpose, "i"));
      const expectedTeam = requester === "us-clinician" ? "US care team · limited cross-region access" : requester === "us-home" ? "US home care team" : "EU visiting care team";
      await expect(intake.locator("dd").nth(2)).toHaveText(expectedTeam);
      await expect(page.getByRole("button", { name: "Run access check" })).toBeDisabled();
      await intake.getByRole("radio", { name: "Limit fields", exact: true }).check();
      await page.getByRole("button", { name: "Run access check" }).click();
      await expect(intake.getByText(purpose === "derivative" ? "Prediction matched." : "Prediction differed.", {exact: true})).toBeVisible();
      const flow = intake.getByRole("figure", { name: "Synthetic access decision path" });
      await expect(flow.getByRole("listitem").last()).toContainText(purpose === "derivative" ? "id, resourceType" : "None");
      await page.getByRole("link", { name: "Open this access check" }).click();
      await expect(page.getByLabel("Purpose of access")).toHaveValue(purpose);
      await expect(page.getByLabel("Requesting team")).toHaveValue(requester);
      await page.getByRole("button", { name: "Check access", exact: true }).click();
      await expect(page.getByRole("heading", { name: outcome, exact: true })).toBeVisible();
    }
  });

  test("patient events replay the same request, preserve tab consent and restore baseline on reset", async ({ page }) => {
    await page.goto("./");
    const predict = page.getByRole("radio", { name: "Deny access", exact: true });
    const run = page.getByRole("button", { name: "Run access check" });
    await predict.check();
    await run.click();
    await page.getByRole("button", { name: "Replay Anna’s grant" }).click();
    await expect(page.getByRole("heading", { name: "Before the event · Deny access" })).toBeVisible();
    const allowed = page.getByRole("heading", { name: "After Anna’s grant · Allow access" }).locator("..");
    await expect(allowed).toContainText("Withheld None");
    await expect(allowed).toContainText("name, birthDate, gender");
    await page.reload();
    await expect(run).toBeDisabled();
    await expect(page.locator("#research-request dd").last()).toHaveText("Granted");
    await predict.check();
    await run.click();
    await page.getByRole("button", { name: "Replay Anna’s withdrawal" }).click();
    await expect(page.getByRole("heading", { name: "Before the event · Allow access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "After Anna’s withdrawal · Deny access" }).locator("..")).toContainText("Released None");
    await page.getByRole("button", { name: "Replay Anna’s grant" }).click();
    await page.getByText("Session settings and reset").click();
    await page.getByRole("button", { name: "Reset tab demo" }).click();
    await expect(run).toBeDisabled();
    await expect(page.locator("#research-request dd").last()).toHaveText("Withheld");

    await page.getByRole("radio", { name: "Different region" }).check();
    await predict.check();
    await run.click();
    await page.getByRole("button", { name: "Replay Anna’s withdrawal" }).click();
    await page.getByRole("button", { name: "Replay Anna’s grant" }).click();
    await expect(page.getByRole("heading", { name: "After Anna’s grant · Deny access" })).toBeVisible();
    await expect(page.getByText(/different regions/, {exact: false}).first()).toBeVisible();
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

  test("mobile overview fits and keyboard navigation reaches patient access", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Privacy desk intake", level: 1 })).toBeVisible();
    const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width.content).toBeLessThanOrEqual(width.viewport);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
    const patientLink = page.getByRole("link", { name: "Open technical workspace" });
    await patientLink.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Patient access", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Mobile", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Return to case" }).click();
    await expect(page.getByRole("heading", { name: "Privacy desk intake" })).toBeVisible();
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
