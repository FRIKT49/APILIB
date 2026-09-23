import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  const pageErrors = [];
  const consoleMessages = [];

  // 1. Tablet Viewport (768 x 1024)
  const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  tabletPage.on("pageerror", (err) => pageErrors.push(`[Tablet] ${err.message}`));
  tabletPage.on("console", (msg) => consoleMessages.push(`[Tablet ${msg.type()}] ${msg.text()}`));
  await tabletPage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await tabletPage.waitForTimeout(1500);
  await tabletPage.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: "pipeline_tablet.png" });
  console.log("Saved pipeline_tablet.png");

  // 2. Mobile Viewport (390 x 844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobilePage.on("pageerror", (err) => pageErrors.push(`[Mobile] ${err.message}`));
  mobilePage.on("console", (msg) => consoleMessages.push(`[Mobile ${msg.type()}] ${msg.text()}`));
  await mobilePage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: "pipeline_mobile.png" });
  console.log("Saved pipeline_mobile.png");

  console.log("Console Messages Count:", consoleMessages.length);
  console.log("Page Errors Count:", pageErrors.length);

  await browser.close();
  process.exit(pageErrors.length > 0 ? 1 : 0);
})();
