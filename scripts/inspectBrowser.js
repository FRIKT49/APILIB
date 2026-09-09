import { chromium } from "file:///C:/Users/roman/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  page.on("console", (msg) => console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text()));
  page.on("pageerror", (err) => console.error("[PAGE ERROR]:", err.message));
  page.on("requestfailed", (req) => console.log(`[REQ FAILED]: ${req.url()} - ${req.failure()?.errorText}`));
  page.on("response", (res) => {
    if (res.status() >= 400) console.log(`[HTTP ${res.status()}]: ${res.url()}`);
  });

  const targetUrl = process.argv[2] || "http://localhost:3000";
  const outputPath = process.argv[3] || "C:/Users/roman/debug_screen.png";
  const mouseCoords = process.argv[4]; // e.g. "650,350"
  const scrollTo = process.argv[5]; // e.g. "bottom"

  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  if (scrollTo === "bottom") {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
  } else if (scrollTo && !isNaN(Number(scrollTo))) {
    await page.evaluate((y) => window.scrollTo(0, y), Number(scrollTo));
    await page.waitForTimeout(1000);
  }

  if (mouseCoords && mouseCoords.includes(",")) {
    const [mx, my] = mouseCoords.split(",").map(Number);
    if (!isNaN(mx) && !isNaN(my)) {
      console.log(`Moving mouse to (${mx}, ${my})...`);
      await page.mouse.move(mx, my, { steps: 20 });
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Screenshot saved to ${outputPath}`);

  await browser.close();
  process.exit(0);
})();
