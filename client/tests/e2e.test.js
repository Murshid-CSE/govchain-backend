import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../../src/app');

let server;
let baseUrl;
let citizenToken;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Frontend-Backend End-to-End Integration Tests', () => {
  // ----------------------------------------------------
  // Test 1: Public map/list loads from real backend
  // ----------------------------------------------------
  it('E2E-1: should load public issues for map and list view from real backend', async () => {
    const res = await fetch(`${baseUrl}/issues?page=1&limit=10`);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.issues), 'Issues data must be an array');
  });

  // ----------------------------------------------------
  // Test 2: Citizen sign up, login, and submit report
  // ----------------------------------------------------
  it('E2E-2: should authenticate citizen and submit a verified civic report with GPS coordinates', async () => {
    const email = `e2e.citizen.${Date.now()}@govchain.local`;

    // 1. Sign up
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'SecurePassword123!',
        name: 'Arun Mozhi',
        phone: '+91-9444012345',
      }),
    });
    const regBody = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    assert.ok(regBody.data.token);
    citizenToken = regBody.data.token;

    // 2. Submit report
    const reportRes = await fetch(`${baseUrl}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'Dangerous electrical cable dangling near school gate',
        description: 'Low-hanging live wire hanging from pole outside Government Higher Secondary School. Severe safety hazard in rainy weather.',
        category: 'street_lights',
        priority: 'critical',
        locationText: 'School Road, Ward 11',
        latitude: 13.0850,
        longitude: 80.2750,
        ward: 'Ward 11',
        isPublic: true,
      }),
    });
    const reportBody = await reportRes.json();
    assert.strictEqual(reportRes.status, 201);
    assert.strictEqual(reportBody.success, true);
    assert.ok(reportBody.data.issue.trackingId.startsWith('ISS-'));
    assert.strictEqual(reportBody.data.issue.priority, 'critical');

    // 3. Track report by tracking ID
    const trackRes = await fetch(`${baseUrl}/issues/track/${reportBody.data.issue.trackingId}`);
    const trackBody = await trackRes.json();
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackBody.data.issue.title, 'Dangerous electrical cable dangling near school gate');
  });

  // ----------------------------------------------------
  // Test 3: Invalid submissions show clear field errors
  // ----------------------------------------------------
  it('E2E-3: should reject invalid issue submission and return structured validation errors', async () => {
    const res = await fetch(`${baseUrl}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'bad', // < 5 chars
        description: 'too short', // < 10 chars
        category: 'not_a_category',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.errors.length >= 2, 'Should return field-level validation errors');
  });

  // ----------------------------------------------------
  // Test 4: Protected staff actions rejected for citizens
  // ----------------------------------------------------
  it('E2E-4: should reject staff actions when attempted by citizen role (RBAC)', async () => {
    // Attempt official task creation
    const taskRes = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Task',
      }),
    });
    assert.strictEqual(taskRes.status, 403, 'Citizen must be forbidden from creating departmental tasks');

    // Attempt tender publishing
    const tenderRes = await fetch(`${baseUrl}/tenders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Tender',
      }),
    });
    assert.strictEqual(tenderRes.status, 403, 'Citizen must be forbidden from creating public tenders');
  });

  // ----------------------------------------------------
  // Test 5: AI chat intake endpoint returns synthesized draft
  // ----------------------------------------------------
  it('E2E-5: should process AI civic chat intake into editable structured draft', async () => {
    const res = await fetch(`${baseUrl}/chat/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'There is a huge crater pothole on Sardar Patel Road causing bikes to crash',
          },
        ],
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.draftReport.suggestedCategory, 'road_damage');
    assert.ok(body.data.draftReport.priorityExplanation);
    assert.ok(body.data.draftReport.disclaimer.includes('AI'));
  });

  // ----------------------------------------------------
  // Test 6: API outage simulation
  // ----------------------------------------------------
  it('E2E-6: should handle non-existent endpoint or simulated outage gracefully', async () => {
    const res = await fetch(`${baseUrl}/non-existent-route`);
    const body = await res.json();
    assert.strictEqual(res.status, 404);
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('not found'));
  });

  // ----------------------------------------------------
  // Test 7: Public audit chain verification
  // ----------------------------------------------------
  it('E2E-7: should verify cryptographic audit trail validity over live records', async () => {
    const res = await fetch(`${baseUrl}/audit/verify`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.valid, 'boolean');
    assert.strictEqual(body.data.valid, true);
  });

  // ----------------------------------------------------
  // Test 8: Public tenders, budgets, and polls endpoints
  // ----------------------------------------------------
  it('E2E-8: should serve public tenders, budgets, and polls without requiring authentication', async () => {
    const [tendersRes, budgetsRes, pollsRes] = await Promise.all([
      fetch(`${baseUrl}/tenders`),
      fetch(`${baseUrl}/budgets`),
      fetch(`${baseUrl}/polls`),
    ]);

    assert.strictEqual(tendersRes.status, 200);
    assert.strictEqual(budgetsRes.status, 200);
    assert.strictEqual(pollsRes.status, 200);

    const tendersBody = await tendersRes.json();
    const budgetsBody = await budgetsRes.json();
    const pollsBody = await pollsRes.json();

    assert.strictEqual(tendersBody.success, true);
    assert.strictEqual(budgetsBody.success, true);
    assert.strictEqual(pollsBody.success, true);
  });
});
