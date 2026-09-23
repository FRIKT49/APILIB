import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    if (msg.type() === "warning") consoleWarnings.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 1. Click 'Architecture' anchor in hero to test smooth anchor scroll
  console.log("Testing anchor click to #about...");
  await page.click('a[href="#about"]');
  await page.waitForTimeout(1500);

  const scrollAfterAnchor = await page.evaluate(() => window.scrollY);
  console.log("Scroll position after anchor click:", scrollAfterAnchor);

  // 2. Scrub through pipeline stages
  for (let s = 0; s < 4; s++) {
    console.log(`Testing stage ${s} selection...`);
    await page.click(`.pipeline-step-btn[data-stage="${s}"]`);
    await page.waitForTimeout(700);

    const activeCheck = await page.evaluate((idx) => {
      const card = document.querySelector(`.pipeline-stage-card[data-stage="${idx}"]`);
      const btn = document.querySelector(`.pipeline-step-btn[data-stage="${idx}"]`);
      return {
        cardActive: card?.classList.contains("active"),
        btnActive: btn?.classList.contains("active")
      };
    }, s);
    console.log(`Stage ${s} active check:`, JSON.stringify(activeCheck));
  }

  // 3. Test Tabs in Inspector (including new interactive parameter sandbox)
  for (const tab of ["schema", "client", "params", "telemetry"]) {
    console.log(`Testing inspector tab: ${tab}...`);
    await page.click(`.inspector-tab-btn[data-tab="${tab}"]`);
    await page.waitForTimeout(300);
    if (tab === "params") {
      const execBtn = await page.$("#btnExecuteParamTest");
      if (execBtn) {
        await execBtn.click();
        await page.waitForTimeout(400);
      }
    }
  }

  // 4. Test Speed Controls
  for (const speed of ["0.5", "1.0", "2.0", "0"]) {
    console.log(`Testing speed control: ${speed}x...`);
    await page.click(`.pipeline-speed-btn[data-speed="${speed}"]`);
    await page.waitForTimeout(200);
  }
  // Restore 1x
  await page.click('.pipeline-speed-btn[data-speed="1.0"]');

  // 5. Test Packet Burst Dispatch
  console.log("Testing dispatch sample packet...");
  await page.click("#pipelineSendPacketBtn");
  await page.waitForTimeout(500);

  // 6. Test scrolling past pipeline to client boilerplate & CTA
  console.log("Scrolling past pipeline to client boilerplate...");
  await page.evaluate(() => {
    const el = document.getElementById("clientImplementation");
    el?.scrollIntoView({ behavior: "instant" });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "pipeline_downstream_sections.png" });
  console.log("Saved pipeline_downstream_sections.png");

  // 7. Test code playground tabs in client boilerplate
  console.log("Testing code tabs in boilerplate...");
  await page.click('#codeTabs button[data-lang="py"]');
  await page.waitForTimeout(300);
  await page.click('#codeTabs button[data-lang="curl"]');
  await page.waitForTimeout(300);
  await page.click('#codeTabs button[data-lang="js"]');
  await page.waitForTimeout(300);

  console.log("Verification Summary:");
  console.log("Page Errors:", pageErrors.length, pageErrors);
  console.log("Console Errors:", consoleErrors.length, consoleErrors);
  console.log("Console Warnings:", consoleWarnings.length, consoleWarnings);

  await browser.close();
  const passed = pageErrors.length === 0 && consoleErrors.length === 0;
  console.log("Test Result:", passed ? "PASSED" : "FAILED");
  process.exit(passed ? 0 : 1);
})();
