import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      pageErrors.push(`[Console Error] ${msg.text()}`);
    }
    consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => pageErrors.push(`[Page Error] ${err.message}`));

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Check initial state
  const state0 = await page.evaluate(() => {
    const canvas = document.getElementById("pipelineCanvas");
    const stage0Card = document.querySelector('.pipeline-stage-card[data-stage="0"]');
    const scrubFill = document.getElementById("pipelineScrubFill");
    const codeSnippet = document.getElementById("pipelineInspectorCode");
    return {
      canvasExists: !!canvas,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height,
      stage0Active: stage0Card?.classList.contains("active"),
      scrubFillWidth: scrubFill?.style.width,
      hasCode: !!codeSnippet?.textContent?.length
    };
  });
  console.log("Initial state:", JSON.stringify(state0));

  // Scroll to #about
  console.log("Scrolling to #about...");
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop);
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: "pipeline_stage_1.png" });
  console.log("Saved pipeline_stage_1.png");

  // Scrub through the pipeline
  console.log("Scrubbing into Stage 2 (25% - 50%)...");
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop + 800);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "pipeline_stage_2.png" });
  console.log("Saved pipeline_stage_2.png");

  console.log("Scrubbing into Stage 3 (50% - 75%)...");
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop + 1550);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "pipeline_stage_3.png" });
  console.log("Saved pipeline_stage_3.png");

  console.log("Scrubbing into Stage 4 (75% - 100%)...");
  await page.evaluate(() => {
    const about = document.getElementById("about");
    const spacer = about.closest(".pin-spacer") || about;
    window.scrollTo(0, spacer.offsetTop + 2300);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "pipeline_stage_4.png" });
  console.log("Saved pipeline_stage_4.png");

  // Test interactive buttons: click tab 'Live Telemetry'
  console.log("Testing Inspector Tab: Live Telemetry...");
  await page.click('button[data-tab="telemetry"]');
  await page.waitForTimeout(500);

  // Test 'Dispatch Sample Packet' button
  console.log("Testing Dispatch Sample Packet button...");
  await page.click("#pipelineSendPacketBtn");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "pipeline_interactive_telemetry.png" });
  console.log("Saved pipeline_interactive_telemetry.png");

  // Test Inspector Tab: 'Test Parameters'
  console.log("Testing Inspector Tab: Test Parameters...");
  await page.click('button[data-tab="params"]');
  await page.waitForTimeout(500);

  const paramsRendered = await page.evaluate(() => {
    const paramsView = document.getElementById("pipelineInspectorParams");
    const execBtn = document.getElementById("btnExecuteParamTest");
    const consoleText = document.getElementById("paramConsoleText");
    return {
      visible: paramsView && window.getComputedStyle(paramsView).display !== "none",
      hasBtn: !!execBtn,
      initialOutput: consoleText?.textContent?.substring(0, 40)
    };
  });
  console.log("Params view check:", JSON.stringify(paramsRendered));

  // Click Execute Param Test
  console.log("Executing parameter test simulation...");
  await page.click("#btnExecuteParamTest");
  await page.waitForTimeout(700);

  const postExecState = await page.evaluate(() => {
    const consoleText = document.getElementById("paramConsoleText");
    return consoleText?.textContent;
  });
  console.log("Post-execution console output:", postExecState?.substring(0, 80));

  // Test Hover preview on stage cards
  console.log("Testing hover on Stage Card 0 (Ingress)...");
  await page.hover('.pipeline-stage-card[data-stage="0"]');
  await page.waitForTimeout(500);
  const hoverCheck = await page.evaluate(() => {
    const title = document.getElementById("pipelineTerminalStageTitle");
    return title?.innerHTML?.includes("PREVIEW");
  });
  console.log("Hover preview badge active:", hoverCheck);

  // Unhover
  await page.hover('.pipeline-title');
  await page.waitForTimeout(400);

  // Test clicking stage 1 step button in scrubber
  console.log("Testing Step Button 01 INGRESS click...");
  await page.click('.pipeline-step-btn[data-stage="0"]');
  await page.waitForTimeout(1200);

  // Check state after click
  const stateAfter = await page.evaluate(() => {
    const stage0 = document.querySelector('.pipeline-stage-card[data-stage="0"]');
    return {
      stage0Active: stage0?.classList.contains("active"),
      scrollY: window.scrollY
    };
  });
  console.log("State after clicking stage 0:", JSON.stringify(stateAfter));

  console.log("Console Messages Count:", consoleMessages.length);
  console.log("Page Errors Count:", pageErrors.length);
  if (pageErrors.length > 0) {
    console.error("Errors:", pageErrors);
  }

  await browser.close();
  const passed = pageErrors.length === 0;
  console.log("Overall Result:", passed ? "PASSED" : "FAILED");
  process.exit(passed ? 0 : 1);
})();
