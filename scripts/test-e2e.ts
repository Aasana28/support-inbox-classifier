import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { chromium, Browser, Page } from "playwright";

const SCREENSHOTS_DIR = path.join(process.cwd(), "docs", "screenshots");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function waitForServer(url: string, timeoutMs = 40000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function main() {
  console.log("Starting Next.js production server for E2E testing...");
  const server: ChildProcess = spawn("npx", ["next", "start", "-p", "3000"], {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, PORT: "3000" },
  });

  try {
    await waitForServer("http://localhost:3000");
    console.log("Server is ready at http://localhost:3000. Launching Playwright Chromium...");

    const browser: Browser = await chromium.launch({ headless: true });

    // --- TEST 1: DESKTOP VIEWPORT (1280x800) ---
    console.log("\n--- Testing Desktop View (1280x800) ---");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage: Page = await desktopContext.newPage();

    // 1. Inbox Tab
    console.log("Navigating to Inbox...");
    await desktopPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1000);

    // Click quick preset: email-001 (Billing)
    console.log("Testing email-001 (Billing)...");
    await desktopPage.click("text=1. Normal Billing (Invoice)");
    await desktopPage.waitForTimeout(500);

    // Click Process Email
    console.log("Clicking Process Email...");
    await desktopPage.click("button:has-text('Process Email')");
    // Wait for processing to complete (up to 30s)
    await desktopPage.waitForSelector("text=AI Classification & Triage", { timeout: 35000 });
    console.log("Pipeline completed for email-001!");
    await desktopPage.waitForTimeout(1000);

    // Expand "How this was produced"
    await desktopPage.click("text=How this was produced (Processing Trace)");
    await desktopPage.waitForTimeout(800);

    // Screenshot: Inbox with processed billing email & trace
    const inboxScreenshotPath = path.join(SCREENSHOTS_DIR, "inbox-desktop.png");
    await desktopPage.screenshot({ path: inboxScreenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${inboxScreenshotPath}`);

    // Click quick preset: email-002 (Angry refund demand)
    console.log("\nTesting email-002 (Escalated Refund Demand)...");
    await desktopPage.click("text=2. Angry / ₹1.8L Refund Demand");
    await desktopPage.waitForTimeout(500);
    await desktopPage.click("button:has-text('Process Email')");
    await desktopPage.waitForSelector("text=ESCALATED TO HUMAN REVIEW", { timeout: 35000 });
    console.log("Escalation banner verified for email-002!");
    await desktopPage.waitForTimeout(1000);

    const escalationScreenshotPath = path.join(SCREENSHOTS_DIR, "escalation-desktop.png");
    await desktopPage.screenshot({ path: escalationScreenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${escalationScreenshotPath}`);

    // 2. Guidance Library Tab
    console.log("\nNavigating to Guidance Library Tab...");
    await desktopPage.click("button:has-text('Guidance')");
    await desktopPage.waitForSelector("text=Approved Response Guidance Library", { timeout: 10000 });
    await desktopPage.waitForTimeout(1000);

    // Click a doc to preview
    await desktopPage.click("text=Service Refund and Chargeback Evaluation Policy");
    await desktopPage.waitForTimeout(800);

    const guidanceScreenshotPath = path.join(SCREENSHOTS_DIR, "guidance-desktop.png");
    await desktopPage.screenshot({ path: guidanceScreenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${guidanceScreenshotPath}`);

    // 3. Quality Checks Tab
    console.log("\nNavigating to Quality Checks Tab...");
    await desktopPage.click("button:has-text('Quality Checks')");
    await desktopPage.waitForSelector("text=Live Quality Checks & Verification Suite", { timeout: 10000 });
    await desktopPage.waitForTimeout(1000);

    // Run test #1 and test #2 individually to verify live runner in browser
    console.log("Executing live Quality Check in browser UI...");
    const runButtons = await desktopPage.$$("button:has-text('Run Test')");
    if (runButtons.length > 0) {
      await runButtons[0].click(); // Test 1 (Billing)
      await desktopPage.waitForSelector("text=Passed", { timeout: 35000 });
      console.log("Test 1 passed in browser UI!");
    }
    if (runButtons.length > 1) {
      await runButtons[1].click(); // Test 2 (Refund)
      await desktopPage.waitForTimeout(35000);
      console.log("Test 2 executed in browser UI!");
    }

    const qualityScreenshotPath = path.join(SCREENSHOTS_DIR, "quality-checks-desktop.png");
    await desktopPage.screenshot({ path: qualityScreenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${qualityScreenshotPath}`);

    // --- TEST 2: MOBILE VIEWPORT (390x844 iPhone 13/14) ---
    console.log("\n--- Testing Mobile View (390x844) ---");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage: Page = await mobileContext.newPage();

    // Inbox on Mobile
    await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);
    const mobileInboxScreenshotPath = path.join(SCREENSHOTS_DIR, "inbox-mobile-390px.png");
    await mobilePage.screenshot({ path: mobileInboxScreenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${mobileInboxScreenshotPath}`);

    // Quality Checks on Mobile
    await mobilePage.click("nav button:nth-child(3)");
    await mobilePage.waitForSelector("text=Live Quality Checks & Verification Suite", { timeout: 10000 });
    await mobilePage.waitForTimeout(1000);
    const mobileQualityScreenshotPath = path.join(SCREENSHOTS_DIR, "quality-mobile-390px.png");
    await mobilePage.screenshot({ path: mobileQualityScreenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${mobileQualityScreenshotPath}`);

    await browser.close();
    console.log("\nAll E2E browser tests and screenshot captures succeeded!");
  } finally {
    console.log("Terminating Next.js server...");
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("E2E test failed:", err);
  process.exit(1);
});
