const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { chromium } = require('playwright');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';

describe('GovChain Real Browser End-to-End Suite (Chromium)', () => {
  let browser;

  before(async () => {
    // 1. Verify backend health
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      const data = await res.json();
      assert.strictEqual(data.success, true, 'Backend API must be running and healthy');
    } catch (err) {
      throw new Error(`Backend is not reachable at ${BACKEND_URL}: ${err.message}`);
    }

    // 2. Verify frontend web server
    try {
      const res = await fetch(FRONTEND_URL);
      assert.strictEqual(res.status, 200, 'Frontend server must return 200 OK');
    } catch (err) {
      throw new Error(`Frontend is not reachable at ${FRONTEND_URL}: ${err.message}`);
    }

    // 3. Launch browser using native Chrome or Edge channel
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (chromeErr) {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }
  });

  after(async () => {
    if (browser) {
      await browser.close();
    }
  });

  // -------------------------------------------------------------
  // Journey 1: Public Visitor (Desktop & Mobile Viewports)
  // -------------------------------------------------------------
  test('1.1 Public Landing Page should render live platform statistics without console errors', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('tile.openstreetmap')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle' });

    // Verify Title and Hero
    const title = await page.title();
    assert.ok(title.includes('GovChain'), 'Page title should contain GovChain');

    const heroHeading = await page.locator('h1').textContent();
    assert.ok(heroHeading.length > 0, 'Hero heading should be present');

    // Wait for live stats to load
    await page.waitForSelector('.civic-card-3d', { timeout: 10000 });
    const statCards = await page.locator('.civic-card-3d').count();
    assert.ok(statCards >= 3, 'Should render live metric cards from database');

    assert.strictEqual(consoleErrors.length, 0, `No console errors expected on home page, got: ${consoleErrors.join(', ')}`);
    await context.close();
  });

  test('1.2 Mobile Viewport (375px) should render mobile menu without horizontal overflow', async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle' });

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(scrollWidth <= 376, `Scroll width (${scrollWidth}px) should not exceed 375px viewport`);

    // Verify mobile hamburger button is visible
    const hamburgerBtn = page.locator('button[aria-label="Toggle mobile menu"]');
    await hamburgerBtn.waitFor({ state: 'visible', timeout: 5000 });
    await hamburgerBtn.click();

    // Verify mobile drawer navigation links appear
    const mobileNavLink = page.locator('.md\\:hidden a[href="/issues"]');
    await mobileNavLink.waitFor({ state: 'visible', timeout: 5000 });

    await context.close();
  });

  test('1.3 Civic Map and Public Issues explorer should render OpenStreetMap attribution and filter controls', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/issues`, { waitUntil: 'networkidle' });

    // Verify Map container is rendered
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.waitFor({ state: 'visible', timeout: 10000 });

    // Verify OpenStreetMap attribution is visible
    const osmAttribution = page.locator('.leaflet-control-attribution');
    await osmAttribution.waitFor({ state: 'visible' });
    const attrText = await osmAttribution.textContent();
    assert.ok(attrText.includes('OpenStreetMap'), 'Map must display OpenStreetMap attribution');

    // Verify Category Filter exists
    const filterSelect = page.locator('select');
    await filterSelect.first().waitFor({ state: 'visible' });

    // Verify public issue cards are displayed
    await page.waitForSelector('a[href^="/issues/"]', { timeout: 10000 });
    const issueCards = await page.locator('a[href^="/issues/"]').count();
    assert.ok(issueCards >= 1, 'Should list at least 1 verified public issue');

    await context.close();
  });

  test('1.4 Public Transparency portal should display audit verification, tenders, budgets, and polls', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/transparency`, { waitUntil: 'networkidle' });

    // Verify Audit Verification automatically loads with intact state
    await page.getByText(/Chain Status:\s*Verified Intact/i).waitFor({ state: 'visible', timeout: 10000 });

    // Click Re-verify button to test live on-demand hash verification
    const reverifyBtn = page.locator('button:has-text("Re-verify")');
    await reverifyBtn.waitFor({ state: 'visible', timeout: 5000 });
    await reverifyBtn.click();
    await page.getByText(/Verified Intact/i).waitFor({ state: 'visible', timeout: 5000 });

    // Switch to Budgets tab
    const budgetsTab = page.locator('button:has-text("Budgets")');
    await budgetsTab.click();
    await page.waitForSelector('text=₹', { timeout: 5000 });

    // Switch to Tenders tab
    const tendersTab = page.locator('button:has-text("Tenders")');
    await tendersTab.click();
    await page.waitForSelector('text=Award', { timeout: 5000 });

    // Switch to Polls tab
    const pollsTab = page.locator('button:has-text("Polls")');
    await pollsTab.click();
    const pollHeading = page.locator('h3');
    await pollHeading.first().waitFor({ state: 'visible', timeout: 5000 });

    await context.close();
  });

  test('1.5 Unknown routes should display accessible 404 page', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/nonexistent-route-xyz-404`, { waitUntil: 'networkidle' });

    const heading = page.locator('h1, h2');
    const text = await heading.first().textContent();
    assert.ok(text.includes('404') || text.includes('Not Found') || text.includes('Page Not Found'), 'Should render 404 error');

    await context.close();
  });

  // -------------------------------------------------------------
  // Journey 2: Citizen Authentication, Session, and Reporting
  // -------------------------------------------------------------
  test('2.1 Citizen registration and login session management should store JWT in localStorage', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const uniqueTimestamp = Date.now();
    const testCitizenEmail = `citizen_${uniqueTimestamp}@example.com`;

    // 1. Visit Register page
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle' });

    // Fill registration form
    await page.fill('input[type="text"]', 'E2E Test Citizen');
    await page.fill('input[type="email"]', testCitizenEmail);
    await page.fill('input[type="password"]', 'GovChainPass@2026');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 8000 });

    // Verify token is in localStorage
    const token = await page.evaluate(() => localStorage.getItem('govchain_token'));
    assert.ok(token && token.length > 20, 'JWT token must be persisted in localStorage');

    // 2. Test Session Restoration across page reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('span:text-is("citizen")').first().waitFor({ state: 'visible', timeout: 5000 });

    // 3. Test Logout
    const logoutBtn = page.locator('button[aria-label*="Sign Out"], button[aria-label*="Logout"], button[aria-label*="வெளியேறு"]').first();
    await logoutBtn.click();

    // Verify token is removed
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('govchain_token'));
    assert.strictEqual(tokenAfterLogout, null, 'Token must be cleared from localStorage upon logout');

    await context.close();
  });

  test('2.2 Step-by-Step Issue Reporting Form with Review Modal and Tracking ID', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Login with seeded citizen
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'citizen@govchain.local');
    await page.fill('input[type="password"]', 'GovChain@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 8000 });

    // 2. Go to Report page
    await page.goto(`${FRONTEND_URL}/report`, { waitUntil: 'networkidle' });

    // Fill Title
    const titleInput = page.locator('input[placeholder*="Anna Salai"]').first();
    await titleInput.fill('E2E Hazardous Crater on Anna Salai');

    // Select Category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('road_damage');

    // Fill Description
    const descInput = page.locator('textarea').first();
    await descInput.fill('Deep road crater causing traffic disruption and severe hazard to two-wheelers during night.');

    // Click "Review & Confirm Report"
    const reviewBtn = page.locator('button:has-text("Review & Confirm Report")').first();
    await reviewBtn.click();

    // Review Modal should appear
    await page.getByText('Confirm Report Submission').waitFor({ state: 'visible', timeout: 5000 });
    const confirmBtn = page.locator('button:has-text("Confirm & Submit")').first();
    await confirmBtn.click();

    // Verify submission succeeds and renders success screen with tracking ID
    await page.getByText(/ISS-2026-/).first().waitFor({ state: 'visible', timeout: 10000 });
    const content = await page.content();
    assert.ok(content.includes('ISS-2026-'), 'Submitted report must generate sequential tracking reference');

    await context.close();
  });

  // -------------------------------------------------------------
  // Journey 3: Guided Issue Triage (AI Chat Intake)
  // -------------------------------------------------------------
  test('3.1 Guided Issue Triage should classify text, assign priority, and require confirmation', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/chat`, { waitUntil: 'networkidle' });

    // Verify accurate disclosure copy
    await page.getByText('Rule-Based Heuristic Engine').waitFor({ state: 'visible', timeout: 5000 });

    // Enter message into plain language input
    const chatInput = page.locator('input[placeholder*="civic issue"]').first();
    await chatInput.fill('Dangerous open live electric wire sparking near hospital entrance after storm');

    const sendBtn = page.locator('button[type="submit"]:has-text("Send")').first();
    await sendBtn.click();

    // Wait for assistant response with critical priority
    await page.getByText(/critical/i).first().waitFor({ state: 'visible', timeout: 10000 });

    // Verify editable draft proposal card appears
    await page.getByText('Generated Draft Proposal').waitFor({ state: 'visible', timeout: 8000 });

    // Verify confirmation requirement before submission
    const confirmBtn = page.locator('button:has-text("Confirm & Log as Verified Issue")');
    await confirmBtn.waitFor({ state: 'visible' });

    await context.close();
  });

  // -------------------------------------------------------------
  // Journey 4: Official Dashboard & State Transitions
  // -------------------------------------------------------------
  test('4.1 Official login should display task queue and allow verified task status transitions', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Log in as Official
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'official@govchain.local');
    await page.fill('input[type="password"]', 'GovChain@2026');
    await page.click('button[type="submit"]');

    // 2. Navigate to Dashboard
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 8000 });

    // Verify official task queue heading
    await page.waitForSelector('text=Official Task Queue', { timeout: 5000 });

    // Verify task work orders are rendered with status dropdowns
    await page.waitForSelector('select', { timeout: 8000 });
    const statusSelect = page.locator('select').first();
    const initialStatus = await statusSelect.inputValue();

    // Transition status
    const targetStatus = initialStatus === 'in_progress' ? 'completed' : 'in_progress';
    await statusSelect.selectOption(targetStatus);

    // Reload page to verify persistence
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('select', { timeout: 8000 });
    const reloadedStatus = await page.locator('select').first().inputValue();
    assert.strictEqual(reloadedStatus, targetStatus, 'Task status transition must persist across reload');

    await context.close();
  });

  // -------------------------------------------------------------
  // Journey 5: Bilingual Localization (English ⇄ Tamil)
  // -------------------------------------------------------------
  test('5.1 Language toggle should update navigation and core text across English and Tamil', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle' });

    // 1. Toggle to Tamil
    const langToggleBtn = page.locator('button:has-text("தமிழ்"), button:has-text("TA")').first();
    await langToggleBtn.waitFor({ state: 'visible', timeout: 5000 });
    await langToggleBtn.click();

    // Verify Tamil text appears in navigation
    await page.waitForSelector('text=முகப்பு', { timeout: 5000 });
    const navText = await page.content();
    assert.ok(navText.includes('முகப்பு'), 'Navigation must translate to Tamil');
    assert.ok(navText.includes('புகார் பதிவு செய்க'), 'Action buttons must translate to Tamil');

    // Verify persistence in localStorage
    const savedLang = await page.evaluate(() => localStorage.getItem('govchain_lang'));
    assert.strictEqual(savedLang, 'ta', 'Tamil language choice must persist in localStorage');

    // 2. Toggle back to English
    const enToggleBtn = page.locator('button:has-text("English"), button:has-text("EN")').first();
    await enToggleBtn.click();
    await page.waitForSelector('text=Home', { timeout: 5000 });

    await context.close();
  });
});
