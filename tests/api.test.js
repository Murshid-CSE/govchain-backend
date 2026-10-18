const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

before((_, done) => {
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

after((_, done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('API Integration Tests', () => {
  it('GET / should return 200 with platform welcome info and module directory', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.modules.length > 0);
  });

  it('GET /api/v1/health should return 200 with service liveness metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
    assert.ok(typeof body.data.uptime === 'number');
  });

  it('GET /api/v1/audit/verify should return 200 with hash-chain integrity verification', async () => {
    const res = await fetch(`${baseUrl}/api/v1/audit/verify`);
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.valid, 'boolean');
  });

  it('POST /api/v1/chat/intake should return 200 with draft synthesis and explainable priority', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Road crater cluster on Guindy flyover causing motorcycle skidding risks',
          },
        ],
      }),
    });
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.draftReport.suggestedCategory, 'road_damage');
    assert.ok(body.data.draftReport.priorityExplanation.length > 0);
  });

  it('POST /api/v1/auth/register should return 400 when invalid email is provided', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email-format',
        password: 'short',
        name: 'A',
      }),
    });
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.errors.length > 0);
  });

  it('POST /api/v1/auth/login should return 400 when required fields are missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.errors.length > 0);
  });

  it('Non-existent route should return 404 with standardized JSON envelope', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-endpoint`);
    const body = await res.json();

    assert.strictEqual(res.status, 404);
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('not found'));
  });
});
