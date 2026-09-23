import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await page.waitForTimeout(1000);
  await page.click('button[data-tab="params"]');
  await page.waitForTimeout(500);
  await page.click("#btnExecuteParamTest");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "pipeline_interactive_params.png" });
  console.log("Saved pipeline_interactive_params.png");
  await browser.close();
})();
