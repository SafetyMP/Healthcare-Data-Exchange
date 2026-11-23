import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function activateByKeyboard(page: Page, control: Locator) {
  await expect(control).toBeVisible();
  for (let n = 0; n < 50; n++) {
    if (await control.evaluate(element => element === document.activeElement)) {
      await page.keyboard.press("Enter");
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error("Operator control was not reachable with Tab");
}

const stages = [
  ["Canonical rule", "Which rule applies?", /authz\.rego/],
  ["Published mirror", "Which rules were published?", /canonical-pointer/],
  ["Consent update", "How does the update reach the evaluator?", /consent-service/],
  ["Gateway check", "What did the gateway observe?", /handlers\.go|demo\.sh/],
] as const;

const reports = {
  "File A": {
    "Confirm denial": /assurance goes beyond the file/i,
    "Request verification": /leave gateway enforcement unconfirmed/i,
    owner: /exchange operator owns the open check/i,
    unknown: /no return from the gateway/i,
  },
  "File B": {
    "Confirm denial": /denied the matching research read/i,
    "Request verification": /check is already in the file/i,
    owner: /privacy officer can give Anna the scoped answer/i,
    unknown: /which consent update the evaluator received/i,
  },
} as const;

for (const width of [1280, 390]) {
  test(`operator compares receiver evidence and traces each decision by keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const apiRequests: string[] = [];
    page.on("request", request => {
      if (/\/v1\/|\/api\/|\/policy-data|\/data\/config/.test(new URL(request.url()).pathname)) {
        apiRequests.push(request.url());
      }
    });
    await page.goto("./");
    await activateByKeyboard(page, page.getByRole("link", { name: "Exchange operator case", exact: true }));
    const heading = page.getByRole("heading", { name: "What can we tell Anna?", exact: true });
    const conclusion = page.getByRole("heading", { name: "Report to the privacy officer", exact: true });
    const hint = page.getByText("What should I look for?", { exact: true });
    await expect(heading).toBeVisible();
    await expect(conclusion).toHaveCount(0);
    await activateByKeyboard(page, hint);

    const fixedRecord = page.locator("dl").filter({ has: page.getByText("Request under review", { exact: true }) });
    const fixedEvidence = await fixedRecord.innerText();
    for (const file of ["File A", "File B"] as const) {
      const fileLink = page.getByRole("link", { name: file, exact: true });
      await activateByKeyboard(page, fileLink);
      await expect(fileLink).toBeFocused();
      await expect(conclusion).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Confirm denial", exact: true })).toBeDisabled();
      expect(await fixedRecord.innerText()).toBe(fixedEvidence);
      const receipt = page.getByText(`Inspect the receiver record · ${file}`, { exact: true });
      await activateByKeyboard(page, receipt);
      const evidence = receipt.locator("..");
      await expect(evidence).toContainText(file === "File A" ? /no matching gateway check/i : /consent_required/);
      await expect(conclusion).toHaveCount(0);
      for (const choice of ["Confirm denial", "Request verification"] as const) {
        const decision = page.getByRole("button", { name: choice, exact: true });
        await activateByKeyboard(page, decision);
        await expect(conclusion).toBeVisible();
        await expect(decision).toHaveAttribute("aria-pressed", "true");
        const result = reports[file];
        await expect(page.getByText(result[choice]).first()).toBeVisible();
        await expect(page.getByText(result.owner).first()).toBeVisible();
        await expect(page.getByText(result.unknown).first()).toBeVisible();
        await activateByKeyboard(page, page.getByRole("link", { name: "Trace this decision", exact: true }));
        await expect(page.getByRole("heading", { name: "Trace the withdrawal", exact: true })).toBeVisible();
        await expect(page.getByText(`patient-eu-001 · ${file}`, { exact: true })).toBeVisible();
        await expect(page.getByText(choice, { exact: true })).toBeVisible();
        const nav = page.getByRole("navigation", { name: "Technical stages" });
        for (const [stage, name, source] of stages) {
          const step = nav.getByRole("link", { name: stage, exact: true });
          await activateByKeyboard(page, step);
          await expect(step).toHaveAttribute("aria-current", "step");
          await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
          const hrefs = await page.getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("href") ?? ""));
          expect(hrefs.some(href => href.startsWith("https://github.com/SafetyMP/") && source.test(href))).toBe(true);
        }
        await expect(page.getByText(result[choice]).first()).toBeVisible();
        await expect(page.getByText(result.owner).first()).toBeVisible();
        const route = page.url();
        await page.reload();
        await expect(page).toHaveURL(route);
        await expect(nav.getByRole("link", { name: "Gateway check" })).toHaveAttribute("aria-current", "step");
        if (file === "File B" && choice === "Confirm denial") {
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        }
        await activateByKeyboard(page, page.getByRole("link", { name: "Return to the operator case", exact: true }));
        await expect(heading).toBeVisible();
        await expect(decision).toHaveAttribute("aria-pressed", "true");
        await expect(conclusion).toBeVisible();
      }
    }
    await activateByKeyboard(page, page.getByText("Would independent rule releases be worth operating?", { exact: true }));
    await expect(page.getByText("320 min/month", { exact: true })).toBeVisible();
    await expect(page.getByText("340 min/month", { exact: true })).toBeVisible();
    await activateByKeyboard(page, page.getByRole("button", { name: "6 gateways", exact: true }));
    await expect(page.getByText("960 min/month", { exact: true })).toBeVisible();
    await expect(page.getByText("500 min/month", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(apiRequests).toEqual([]);
  });
}
