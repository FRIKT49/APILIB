import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (msg) => consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`));
  page.on("pageerror", (err) => pageErrors.push(err.message));

  console.log("Navigating to http://localhost:3000/?theme=light...");
  await page.goto("http://localhost:3000/?theme=light", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Scroll to #about
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "pipeline_light_stage_1.png" });
  console.log("Saved pipeline_light_stage_1.png");

  // Scrub into Stage 2
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop + 800);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "pipeline_light_stage_2.png" });
  console.log("Saved pipeline_light_stage_2.png");

  console.log("Console Messages Count:", consoleMessages.length);
  console.log("Page Errors Count:", pageErrors.length);

  await browser.close();
  process.exit(pageErrors.length > 0 ? 1 : 0);
})();
