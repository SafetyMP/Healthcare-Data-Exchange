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
  test("a first-time reviewer follows the treatment evidence and compares two different empty packets", async ({ page }) => {
    await page.goto("./#research-request/treatment/granted/plan-hold");
    await expect(page.getByRole("heading", { name: "Two teams checking one intake record" })).toBeVisible();
    const intake = page.getByRole("region", { name: "Access request intake" });
    const help = intake.locator("details").filter({ has: page.getByText("Walk me through this request", { exact: true }) });
    await help.locator("summary").click();
    await expect(help).toContainText("requesting team is in the US");
    await help.getByRole("button", { name: "Next clue" }).click();
    await expect(help).toContainText("Granted means she agreed to this use");
    await help.getByRole("button", { name: "Next clue" }).click();
    await expect(help).toContainText("The record ID points to Anna’s entry");
    await help.getByRole("button", { name: "Explore packet choices" }).click();
    await expect(intake.getByRole("button", { name: "Prepare requested fields", exact: true })).toBeFocused();
    await expect(intake.getByRole("button", { name: "Hold for steward review" })).toHaveAttribute("aria-pressed", "true");
    await intake.getByRole("button", { name: "Compare requested fields" }).click();
    await expect(intake.getByRole("status")).toContainText("Steward paused the request");
    await expect(intake.getByRole("status")).toContainText("Region check stopped the read (0 fields)");
    await expect(page).toHaveURL(/treatment\/granted\/plan-requested$/);
    await intake.getByRole("button", { name: "Replay Anna’s withdrawal" }).click();
    await expect(intake.getByRole("status")).toContainText("Before the change · Region check stopped the read.");
    await expect(intake.getByRole("status")).toContainText("Current result · Consent check stopped the read (0 fields)");
    await intake.getByRole("radio", { name: "Research request", exact: true }).check();
    await expect(intake.getByRole("status")).toHaveCount(0);
    await expect(intake.getByRole("region", { name: "Coordinator’s handoff" })).toHaveCount(0);
  });

  test("each desk request carries its team, consent and steward decision into the guide", async ({ page }) => {
    for (const [label, purpose, team, status] of [
      ["Research request", "research", "eu-visiting", 403],
      ["US treatment", "treatment", "us-home", 403],
      ["US secondary use", "derivative", "us-clinician", 200],
    ] as const) {
      await page.goto("./#research-request");
      const intake = page.getByRole("region", { name: "Access request intake" });
      await intake.getByRole("radio", { name: label, exact: true }).check();
      const plan = intake.getByRole("button", { name: "Prepare requested fields", exact: true });
      await expect(plan).toHaveAttribute("aria-pressed", "false");
      await expect(intake.getByText(/\d+ fields prepared/)).toHaveCount(0);
      await expect(intake.getByRole("heading", { name: "Anna Mueller" })).toBeVisible();
      await expect(intake.getByRole("button", { name: /Replay Anna’s (grant|withdrawal)/ })).toHaveCount(0);
      await plan.click();
      await expect(plan).toHaveAttribute("aria-pressed", "true");
      await intake.getByRole("link", { name: "Inspect this request’s field evidence" }).click();
      await expect(page).toHaveURL(new RegExp("#technical/" + purpose + "/(granted|withheld)/fields/selected/plan-requested$"));
      await expect(page.getByRole("heading", { name: "Trace the " + purpose + " request" })).toBeVisible();
      await expect(page.getByText(team, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Selected consent/ })).toContainText("Browser " + status);
      await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
      await expect(intake.getByRole("radio", { name: label, exact: true })).toBeChecked();
      await expect(plan).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("a consent event changes the research packet while the original request and plan stay fixed", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", request => { if (new URL(request.url()).pathname.split("/").includes("api")) calls.push(request.url()); });
    await page.goto("./");
    const intake = page.getByRole("region", { name: "Access request intake" });
    const prepare = intake.getByRole("button", { name: "Prepare requested fields", exact: true });
    await prepare.click();
    await expect(intake.getByText("0 fields prepared", { exact: true })).toBeVisible();
    await intake.getByRole("button", { name: "Replay Anna’s grant" }).click();
    const handoff = intake.getByRole("region", { name: "Coordinator’s handoff" });
    await expect(handoff).toContainText("3 fields prepared");
    await expect(handoff).toContainText("review the birth date against the study criterion");
    await intake.getByRole("button", { name: "Prepare identifiers only", exact: true }).click();
    await expect(handoff).toContainText("2 fields prepared");
    await expect(handoff).toContainText("the age check stays open");
    await prepare.click();
    await intake.getByRole("link", { name: "Inspect this request’s field evidence" }).click();
    const stage = page.getByRole("button", { name: "Stage field preview" });
    await stage.click();
    const packet = JSON.parse(await page.getByLabel("Staged JSON").innerText());
    expect(Object.keys(packet).sort()).toEqual(["birthDate", "id", "resourceType"]);
    expect(packet.id).toBe("patient-eu-001");
    await page.getByRole("link", { name: /Opposite consent/ }).click();
    await expect(stage).toBeDisabled();
    await expect(page.getByLabel("Staged JSON")).toHaveCount(0);
    await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
    await intake.getByRole("button", { name: "Replay Anna’s withdrawal" }).click();
    await expect(handoff).toContainText("0 fields prepared");
    await expect(intake.getByRole("status")).toContainText("Granted consent prepared 3 fields. Withheld consent prepares 0.");
    await expect(intake.getByRole("link", { name: "Inspect this request’s field evidence" })).toHaveAttribute("href", /research\/withheld\/fields\/selected\/plan-requested$/);
    await intake.getByRole("button", { name: "Replay Anna’s grant" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Replay Anna’s withdrawal" })).toBeVisible();
    await page.getByText("Session settings and reset").click();
    await page.getByRole("button", { name: "Reset tab demo" }).click();
    await expect(prepare).toHaveAttribute("aria-pressed", "false");
    await prepare.click();
    await expect(intake.getByRole("button", { name: "Replay Anna’s grant" })).toBeVisible();
    expect(calls).toEqual([]);
  });

  test("steward can narrow a cross-region packet or hold it and inspect the distinct receiver evidence", async ({ page }) => {
    await page.goto("./");
    const intake = page.getByRole("region", { name: "Access request intake" });
    await intake.getByRole("radio", { name: "US secondary use", exact: true }).check();
    const evidence = intake.getByRole("link", { name: "Inspect this request’s field evidence" });
    await intake.getByRole("button", { name: "Prepare requested fields", exact: true }).click();
    await evidence.click();
    const stage = page.getByRole("button", { name: "Stage field preview" });
    await expect(stage).toBeDisabled();
    await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
    await intake.getByRole("button", { name: "Prepare identifiers only", exact: true }).click();
    await expect(intake.getByText("2 fields prepared", { exact: true })).toBeVisible();
    await evidence.click();
    await stage.click();
    expect(JSON.parse(await page.getByLabel("Staged JSON").innerText())).toEqual({ id: "patient-eu-001", resourceType: "Patient" });
    await page.getByRole("link", { name: /Receiving gateway/ }).click();
    await expect(page).toHaveURL(/derivative\/granted\/receiver\/selected\/plan-identifiers$/);
    await expect(page.getByText(/No authenticated read/)).toBeVisible();
    await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
    await intake.getByRole("button", { name: "Hold for steward review", exact: true }).click();
    await expect(intake.getByText("0 fields prepared", { exact: true })).toBeVisible();
    await evidence.click();
    await expect(page).toHaveURL(/derivative\/granted\/fields\/selected\/plan-hold$/);
    await expect(stage).toBeDisabled();
    await expect(page.getByLabel("Staged JSON")).toHaveCount(0);
    await page.getByRole("link", { name: /Opposite consent/ }).click();
    await expect(stage).toBeDisabled();
  });

  test("selected technical trial supports direct entry, field minimization and a return to unchanged patient consent", async ({ page }) => {
    await page.goto("./#technical/derivative/granted/fields/selected");
    const stage = page.getByRole("button", { name: "Stage field preview" });
    await expect(stage).toBeDisabled();
    await page.getByRole("checkbox", { name: /name/ }).uncheck();
    await page.getByRole("checkbox", { name: /^id/ }).uncheck();
    await page.getByRole("checkbox", { name: /^resourceType/ }).uncheck();
    await expect(page.getByText("Select at least one authorized field to stage a preview.")).toBeVisible();
    await expect(stage).toBeDisabled();
    await page.getByRole("checkbox", { name: /^id/ }).check();
    await page.getByRole("checkbox", { name: /^resourceType/ }).check();
    await stage.click();
    expect(JSON.parse(await page.getByLabel("Staged JSON").innerText())).toEqual({ id: "patient-eu-001", resourceType: "Patient" });
    await page.getByRole("link", { name: /Opposite consent/ }).click();
    await expect(stage).toBeDisabled();
    await expect(page.getByLabel("Staged JSON")).toHaveCount(0);
    await page.getByRole("link", { name: /Receiving gateway/ }).click();
    await expect(page.getByText(/No authenticated read/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Permalink to this stage and trial" })).toHaveAttribute("href", "#technical/derivative/granted/receiver/opposite");
    await page.reload();
    await expect(page.getByRole("link", { name: /Opposite consent/ })).toHaveAttribute("aria-current","true");
    await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
    await expect(page.getByRole("radio", { name: "US secondary use" })).toBeChecked();
    await expect(page.locator("#research-request dd").last()).toHaveText("Granted");
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Trace the derivative request" })).toBeVisible();
  });

  test("a shared mirror trial preserves its origin and asks before replaying a different patient preference", async ({ page }) => {
    await page.goto("./#technical/research/granted/receiver/opposite/mirror");
    await expect(page.getByRole("link", { name: "Return to the policy mirror case" })).toHaveAttribute("href", /healthcare-policy#follow-a-research-access-request$/);
    await page.getByRole("link", { name: /Published policy/ }).first().click();
    await expect(page).toHaveURL(/publication\/opposite\/mirror$/);
    await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
    await expect(page.locator("#research-request dd").last()).toHaveText("Withheld");
    await page.getByRole("button", { name: "Replay Anna’s shared grant" }).click();
    await expect(page.locator("#research-request dd").last()).toHaveText("Granted");
    await page.getByRole("link", { name: "Pilot costs" }).click();
    await expect(page).toHaveURL(/pilot-costs\/research\/mirror$/);
    await page.getByRole("link", { name: "Inspect this request’s field evidence" }).click();
    await expect(page).toHaveURL(/research\/granted\/fields\/selected\/mirror$/);
  });

  test("publication evidence compares recorded digests without claiming recipient activation", async ({ page }) => {
    await page.goto("./#policy-provenance");
    await page.getByRole("button", { name: "Compare digest" }).click();
    await expect(page.getByText(/Matches the published bundle digest/)).toBeVisible();
    await page.getByRole("button", { name: "Load working digest" }).click();
    await page.getByRole("button", { name: "Compare digest" }).click();
    await expect(page.getByText(/Matches the canonical working tree only/)).toBeVisible();
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

  test("mobile case and technical reference support keyboard return to the same packet plan", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    const plan = page.getByRole("button", { name: "Prepare identifiers only", exact: true });
    await plan.focus();
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: "Replay Anna’s grant" }).click();
    const evidence = page.getByRole("link", { name: "Inspect this request’s field evidence" });
    await expect(evidence).toHaveAttribute("href", "#technical/research/granted/fields/selected/plan-identifiers");
    await evidence.press("Enter");
    await expect(page.getByRole("heading", { name: "Trace the research request" })).toBeFocused();
    await expect(page.getByRole("link", { name: /Selected consent/ })).toContainText("Browser 200");
    await expect(page.getByRole("link", { name: /Opposite consent/ })).toContainText("Browser 403");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole("link", { name: "← Return to the selected privacy case" }).click();
    await expect(page.getByRole("region", { name: "Access request intake" })).toBeFocused();
    await expect(plan).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Run a shadow pilot" }).click();
    await expect(page.getByText(/Your assumptions cover first-year cost/)).toBeVisible();
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
