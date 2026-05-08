import { expect, test } from "@playwright/test";

test("loads the engine and renders an exportable strip", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /film color script/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /star/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/film-color-script-generator"
  );
  await expect(page.getByRole("link", { name: /paypal/i })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita"
  );
  await expect(page.locator("[data-ref='version']")).toContainText(/^v\d+\.\d+\.\d+/);
  await expect(page.locator("[data-ref='commit']")).not.toHaveText("dev");

  await page.evaluate(async () => {
    await window.__filmColorScriptSmoke?.loadEngine();
  });
  await expect(page.locator("#app")).toHaveAttribute("data-engine-state", "ready", {
    timeout: 70_000
  });

  await page.evaluate(() => {
    window.__filmColorScriptSmoke?.runDemo();
  });
  await expect(page.locator("#app")).toHaveAttribute("data-strip-state", "ready");
  await expect(page.locator("canvas.strip-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "PNG" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "JSON" })).toBeEnabled();
});
