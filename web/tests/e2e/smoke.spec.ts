import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CHEX web smoke @smoke", () => {
  test("dashboard renders with accessible landmarks", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByRole("heading", { name: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "Disclosure desk" : "Gateway reference", level: 1 })).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
      await expect(page.getByRole("region", { name: "Guided walkthrough", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Start guided walkthrough", exact: true })).toHaveCount(0);
    }

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("patient lookup page is reachable", async ({ page }) => {
    await page.goto("./patients/");
    await expect(page.getByRole("heading", { name: "Patient access", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Check access", exact: true })).toBeVisible();
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
      await expect(page.getByRole("region", { name: "Guided walkthrough", exact: true })).toHaveCount(0);
    }
  });
});
