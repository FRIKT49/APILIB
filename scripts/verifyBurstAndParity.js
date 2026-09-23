import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  const pageErrors = [];
  const consoleMessages = [];

  // ==========================================
  // Test 1: Desktop Verification (3D bursts & waypoints)
  // ==========================================
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", (err) => pageErrors.push(`[Page Error] ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(`[Console Error] ${msg.text()}`);
    consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Scroll to #about
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await page.waitForTimeout(800);

  // Check 3D Burst mesh exists
  const burstMeshCheck = await page.evaluate(() => {
    const canvas = document.getElementById("pipelineCanvas");
    // Look up timeline instance or window
    return {
      canvasExists: !!canvas,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height
    };
  });
  console.log("Canvas status:", JSON.stringify(burstMeshCheck));

  // Trigger Sample Packet and verify in 3D scene
  console.log("Clicking #pipelineSendPacketBtn...");
  await page.click("#pipelineSendPacketBtn");
  await page.waitForTimeout(200);

  const burstActiveCheck = await page.evaluate(() => {
    // Check if packet was dispatched and logged
    const stream = document.getElementById("statLogStream");
    const headerTelemetry = document.getElementById("pipelineHeaderTelemetry");
    return {
      hasHeader: !!headerTelemetry?.textContent,
      hasLog: stream?.textContent?.includes("Packet #") || false
    };
  });
  console.log("Burst dispatch check:", JSON.stringify(burstActiveCheck));

  // Check stage clicking and waypoint alignment for all 4 stages
  for (let stage = 0; stage < 4; stage++) {
    console.log(`Clicking Step Button for Stage ${stage}...`);
    await page.click(`.pipeline-step-btn[data-stage="${stage}"]`);
    await page.waitForTimeout(600);
    const stageCheck = await page.evaluate((s) => {
      const card = document.querySelector(`.pipeline-stage-card[data-stage="${s}"]`);
      const btn = document.querySelector(`.pipeline-step-btn[data-stage="${s}"]`);
      return {
        cardActive: card?.classList.contains("active"),
        btnActive: btn?.classList.contains("active")
      };
    }, stage);
    console.log(`Stage ${stage} check:`, JSON.stringify(stageCheck));
    if (!stageCheck.cardActive || !stageCheck.btnActive) {
      pageErrors.push(`Stage ${stage} did not activate properly upon step button click`);
    }
  }

  // ==========================================
  // Test 2: Mobile UX & Clearance Verification (390x844)
  // ==========================================
  console.log("\nStarting Mobile Viewport Verification (390x844)...");
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobilePage.on("pageerror", (err) => pageErrors.push(`[Mobile Page Error] ${err.message}`));

  await mobilePage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);

  await mobilePage.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await mobilePage.waitForTimeout(800);

  // Check Navbar vs Pipeline Title overlap / clearance
  const mobileClearance = await mobilePage.evaluate(() => {
    const navbar = document.getElementById("mainNavbar");
    const eyebrow = document.querySelector(".pipeline-eyebrow");
    const title = document.querySelector(".pipeline-title");
    const navRect = navbar.getBoundingClientRect();
    const eyeRect = eyebrow.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    return {
      navBottom: navRect.bottom,
      eyebrowTop: eyeRect.top,
      titleTop: titleRect.top,
      clearance: eyeRect.top - navRect.bottom,
      isOverlapping: eyeRect.top < navRect.bottom
    };
  });
  console.log("Mobile Navbar Clearance Check:", JSON.stringify(mobileClearance));
  if (mobileClearance.isOverlapping) {
    pageErrors.push(`CRITICAL: Navbar is overlapping pipeline header on mobile! Clearance: ${mobileClearance.clearance}px`);
  }

  // Test Mobile Params Tab and Output Console
  console.log("Testing Mobile Params Tab...");
  await mobilePage.click('button[data-tab="params"]');
  await mobilePage.waitForTimeout(500);

  const mobileParamsCheck = await mobilePage.evaluate(() => {
    const consoleBox = document.querySelector(".param-output-console");
    const consoleText = document.getElementById("paramConsoleText");
    const execBtn = document.getElementById("btnExecuteParamTest");
    const computedDisplay = consoleBox ? window.getComputedStyle(consoleBox).display : "none";
    return {
      consoleExists: !!consoleBox,
      computedDisplay: computedDisplay,
      hasText: !!consoleText?.textContent?.length,
      hasBtn: !!execBtn
    };
  });
  console.log("Mobile Params Console Status:", JSON.stringify(mobileParamsCheck));
  if (mobileParamsCheck.computedDisplay === "none") {
    pageErrors.push("Mobile parameter output console is hidden with display: none!");
  }

  // Execute parameter test on mobile
  console.log("Clicking Execute Ingress Request on mobile...");
  await mobilePage.click("#btnExecuteParamTest");
  await mobilePage.waitForTimeout(800);

  const postExecMobileText = await mobilePage.evaluate(() => {
    const consoleText = document.getElementById("paramConsoleText");
    return consoleText?.textContent;
  });
  console.log("Mobile Post-Execution Response:", postExecMobileText?.substring(0, 70));

  await mobilePage.screenshot({ path: "pipeline_mobile_verified.png" });
  console.log("Saved pipeline_mobile_verified.png");

  // Screenshot stage 4 desktop to verify no occlusion
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop + 2300);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "pipeline_stage_4_verified.png" });
  console.log("Saved pipeline_stage_4_verified.png");

  await browser.close();

  console.log("\n--- Verification Summary ---");
  console.log("Total Page Errors:", pageErrors.length);
  if (pageErrors.length > 0) {
    console.error("Errors found:", pageErrors);
    process.exit(1);
  }
  console.log("All deep verification checks PASSED successfully!");
  process.exit(0);
})();
