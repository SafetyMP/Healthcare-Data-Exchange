import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CHEX web smoke @smoke", () => {
  test("dashboard renders with accessible landmarks", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Cloud Healthcare Exchange" })).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("patient lookup page is reachable", async ({ page }) => {
    await page.goto("/patients");
    await expect(page.getByRole("heading", { name: "Patient lookup" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fetch patient" })).toBeVisible();
  });
});
