const express = require("express");
const { chromium } = require("playwright");

const EMAIL = "rishiraj.pal.work@gmail.com";
const PASSWORD = "Rishi@276";

async function runOnce() {
  const browser = await chromium.launch({
    headless: false,
    args: ["--ignore-certificate-errors"]
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Opening login page...");
    await page.goto("https://www.naukri.com/nlogin/login", {
      timeout: 60000,
      ignoreHTTPSErrors: true
    });

    await page.fill("#usernameField", EMAIL);
    await page.fill("#passwordField", PASSWORD);

    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click("button[type='submit']")
    ]);

    console.log("Login submitted, waiting for dashboard...");
    await page.waitForSelector("div#header", { timeout: 20000 }).catch(() => {
      console.log("Dashboard header not found, maybe opened in new tab.");
    });

    let profilePage = page;
    const pages = context.pages();
    if (pages.length > 1) {
      profilePage = pages[pages.length - 1];
      console.log("Found new tab for dashboard, switching...");
    }

    console.log("Navigating to Profile page...");
    await profilePage.goto("https://www.naukri.com/mnjuser/profile", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
      ignoreHTTPSErrors: true
    });

    await profilePage.waitForURL(/mnjuser\/profile/i, { timeout: 30000 });

    console.log("Redirecting to modalOpen URL...");
    await profilePage.goto("https://www.naukri.com/mnjuser/profile?action=modalOpen", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
      ignoreHTTPSErrors: true
    });

    await profilePage.waitForURL(/modalOpen/i, { timeout: 30000 });

    console.log("Locating Edit icon...");
    const editIcon = profilePage.locator("em.icon.edit");

    let clicked = false;

    try {
      await editIcon.first().waitFor({ state: "visible", timeout: 7000 });
      await editIcon.first().scrollIntoViewIfNeeded();
      await editIcon.first().click({ timeout: 5000 });
      clicked = true;
      console.log("Clicked edit icon.");
    } catch {}

    if (!clicked) {
      console.log("Force-clicking edit icon...");
      try {
        await editIcon.first().click({ timeout: 5000, force: true });
        clicked = true;
      } catch (e) {
        console.log("Failed to click edit icon:", e);
        throw e;
      }
    }

    console.log("Clicking Save...");
    const saveBtn = profilePage.locator("#saveBasicDetailsBtn");

    await saveBtn.waitFor({ state: "visible", timeout: 15000 });
    await saveBtn.scrollIntoViewIfNeeded();

    try {
      await saveBtn.click({ timeout: 8000 });
    } catch {
      await saveBtn.click({ timeout: 8000, force: true });
    }

    console.log("✅ Profile updated successfully!");
  } catch (error) {
    console.error("❌ ERROR:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Concurrency lock
let isRunning = false;
async function safeRunOnce() {
  if (isRunning) {
    console.log("Run skipped: already in progress.");
    return;
  }
  isRunning = true;
  try {
    await runOnce();
  } finally {
    isRunning = false;
  }
}

// ----------------------------------------------
//  NEW LOGIC: DISABLE SERVER FOR TASK SCHEDULER
// ----------------------------------------------
if (process.env.DISABLE_SERVER === "true") {
  console.log("Server disabled. Running automation once (Task Scheduler mode)...");
  safeRunOnce().then(() => {
    console.log("Automation finished.");
    process.exit(0);
  });
} else {
  // Start Express server normally
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get("/", (_req, res) => res.send("OK"));

  app.get("/run-automation", async (_req, res) => {
    try {
      await safeRunOnce();
      res.send("Automation run triggered.");
    } catch (e) {
      res.status(500).send("Failed");
    }
  });

  app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);

    if (process.env.RUN_ON_START !== "false") {
      console.log("Startup automation run initiating...");
      await safeRunOnce();
    }
  });
}
