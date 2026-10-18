const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Use isolated test database on port 5433
const TEST_DB_URL = 'postgresql://postgres@localhost:5433/govchain_test?schema=public';
process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long_for_tests';

const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL } },
});

const app = require('../src/app');

let server;
let baseUrl;
let citizenToken;
let officialToken;
let adminToken;
let testDeptId;
let createdIssueId;
let createdIssueTrackingId;

before(async () => {
  // 1. Clean test database in reverse relation order
  await testPrisma.auditEvent.deleteMany({});
  await testPrisma.pollVote.deleteMany({});
  await testPrisma.pollOption.deleteMany({});
  await testPrisma.poll.deleteMany({});
  await testPrisma.budgetExpenditure.deleteMany({});
  await testPrisma.budgetAllocation.deleteMany({});
  await testPrisma.tenderBid.deleteMany({});
  await testPrisma.tenderDocument.deleteMany({});
  await testPrisma.tender.deleteMany({});
  await testPrisma.taskEvent.deleteMany({});
  await testPrisma.task.deleteMany({});
  await testPrisma.grievanceResponse.deleteMany({});
  await testPrisma.grievance.deleteMany({});
  await testPrisma.issueComment.deleteMany({});
  await testPrisma.issueSupport.deleteMany({});
  await testPrisma.issueFollow.deleteMany({});
  await testPrisma.issueDuplicate.deleteMany({});
  await testPrisma.issueAttachment.deleteMany({});
  await testPrisma.moderationDecision.deleteMany({});
  await testPrisma.issue.deleteMany({});
  await testPrisma.user.deleteMany({});
  await testPrisma.department.deleteMany({});

  // 2. Seed baseline department
  const dept = await testPrisma.department.create({
    data: {
      name: 'Test Roads & Infrastructure Dept',
      slug: 'test-roads-infrastructure',
      description: 'Department for testing infrastructure tasks',
      contactEmail: 'roads-test@govchain.local',
    },
  });
  testDeptId = dept.id;

  // 3. Seed baseline users with hashed passwords
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('TestPass@123', salt);

  const adminUser = await testPrisma.user.create({
    data: {
      email: 'admin.test@govchain.local',
      passwordHash,
      name: 'Test Admin',
      role: 'admin',
      isVerified: true,
    },
  });

  const officialUser = await testPrisma.user.create({
    data: {
      email: 'official.test@govchain.local',
      passwordHash,
      name: 'Test Official',
      role: 'official',
      departmentId: testDeptId,
      isVerified: true,
    },
  });

  adminToken = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  officialToken = jwt.sign(
    { id: officialUser.id, email: officialUser.email, role: 'official', departmentId: testDeptId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 4. Start HTTP test server
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await testPrisma.$disconnect();
});

describe('Live PostgreSQL Database Integration Tests', () => {
  // ----------------------------------------------------
  // 1. Database Connectivity & Health
  // ----------------------------------------------------
  it('1.1 should verify real PostgreSQL connection and readiness check', async () => {
    const rawResult = await testPrisma.$queryRaw`SELECT 1 as result`;
    assert.strictEqual(Number(rawResult[0].result), 1);

    const res = await fetch(`${baseUrl}/api/v1/health`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
  });

  // ----------------------------------------------------
  // 2. Authentication, Registration & Role Restrictions
  // ----------------------------------------------------
  it('2.1 should register a new citizen user in PostgreSQL', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'resident.citizentest@govchain.local',
        password: 'ValidPassword123!',
        name: 'Priya Sharma',
        phone: '+91-9876543210',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.email, 'resident.citizentest@govchain.local');
    assert.strictEqual(body.data.user.role, 'citizen');
    assert.ok(body.data.token, 'Registration should return an authentication token');
    citizenToken = body.data.token;
  });

  it('2.2 should prevent duplicate user registration', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'resident.citizentest@govchain.local',
        password: 'AnotherPassword123!',
        name: 'Duplicate Attempt',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(body.success, false);
  });

  it('2.3 should login citizen and verify JWT profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'resident.citizentest@govchain.local',
        password: 'ValidPassword123!',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);

    // Verify /me endpoint with Bearer token
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const meBody = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meBody.data.user.email, 'resident.citizentest@govchain.local');
  });

  it('2.4 should enforce role-based access control (citizen cannot create departments)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Dept Creation',
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  // ----------------------------------------------------
  // 3. Departments Module Operations
  // ----------------------------------------------------
  it('3.1 should allow admin to create a new department', async () => {
    const res = await fetch(`${baseUrl}/api/v1/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Public Health & Sanitation Board',
        description: 'Sanitation and vector control board',
        contactEmail: 'sanitation@govchain.local',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.department.slug, 'public-health-sanitation-board');
  });

  it('3.2 should list active departments with counts', async () => {
    const res = await fetch(`${baseUrl}/api/v1/departments`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.departments.length >= 2);
  });

  // ----------------------------------------------------
  // 4. Issues Module: Creation, Location & Support
  // ----------------------------------------------------
  it('4.1 should create an issue with location coordinates and tracking ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'Broken stormwater drain causing sewage overflow',
        description: 'Severe wastewater overflow onto the main road near junction 4. Unhygienic and dangerous for pedestrians.',
        category: 'drainage',
        priority: 'high',
        locationText: 'Main Market Road, Ward 12',
        latitude: 13.0827,
        longitude: 80.2707,
        ward: 'Ward 12',
        isPublic: true,
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.issue.trackingId.startsWith('ISS-'));
    assert.strictEqual(body.data.issue.category, 'drainage');
    createdIssueId = body.data.issue.id;
    createdIssueTrackingId = body.data.issue.trackingId;
  });

  it('4.2 should track the created issue by public tracking ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/issues/track/${createdIssueTrackingId}`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.issue.id, createdIssueId);
  });

  it('4.3 should allow citizens to support an issue with atomic count increments', async () => {
    const res = await fetch(`${baseUrl}/api/v1/issues/${createdIssueId}/support`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);

    // Verify DB count directly
    const issueInDb = await testPrisma.issue.findUnique({
      where: { id: createdIssueId },
    });
    assert.strictEqual(issueInDb.supportCount, 1);
  });

  it('4.4 should handle duplicate support submissions gracefully', async () => {
    const res = await fetch(`${baseUrl}/api/v1/issues/${createdIssueId}/support`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const body = await res.json();
    // Second support by same user should be rejected or handled as conflict
    assert.ok(res.status === 400 || res.status === 409);
  });

  it('4.5 should add comments to an issue', async () => {
    const res = await fetch(`${baseUrl}/api/v1/issues/${createdIssueId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        content: 'Issue still persists today morning, stagnant water has risen.',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.comment.content, 'Issue still persists today morning, stagnant water has risen.');
  });

  // ----------------------------------------------------
  // 5. Grievances Module & SLA Calculations
  // ----------------------------------------------------
  it('5.1 should file a citizen grievance with calculated SLA deadline', async () => {
    const res = await fetch(`${baseUrl}/api/v1/grievances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        departmentId: testDeptId,
        category: 'sanitation',
        subject: 'Garbage dump uncollected for over 5 days',
        description: 'Municipal waste bin overflowing in residential street causing health hazards.',
        priority: 'high',
        location: 'Cross street 2, Block B',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.grievance.trackingId.startsWith('GRV-'));
    assert.ok(body.data.grievance.slaDeadline, 'Grievance should have calculated SLA deadline');
  });

  // ----------------------------------------------------
  // 6. Tasks, Tenders, Budgets & Polls
  // ----------------------------------------------------
  it('6.1 should create a departmental task linked to the issue', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officialToken}`,
      },
      body: JSON.stringify({
        title: 'Dispatch drain desilting suction truck',
        description: 'Clear the blockage on Main Market Road stormwater drain',
        departmentId: testDeptId,
        issueId: createdIssueId,
        dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.task.title, 'Dispatch drain desilting suction truck');
  });

  it('6.2 should create a public civic poll with options and record a vote', async () => {
    const startsAt = new Date();
    const endsAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const createRes = await fetch(`${baseUrl}/api/v1/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Community Preference: Ward 12 Park vs EV Charging Hub',
        description: 'Should the vacant municipal plot be developed into a green community park or a public EV fast-charging hub?',
        options: ['Green Community Park with Walking Track', 'Public EV Fast-Charging Hub'],
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });
    const createBody = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    const pollId = createBody.data.poll.id;
    const optionId = createBody.data.poll.options[0].id;

    // Activate the poll
    await fetch(`${baseUrl}/api/v1/polls/${pollId}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Cast a vote
    const voteRes = await fetch(`${baseUrl}/api/v1/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({ optionId }),
    });
    const voteBody = await voteRes.json();
    assert.strictEqual(voteRes.status, 200);
    assert.strictEqual(voteBody.success, true);
  });

  it('6.3 should verify public budget transparency endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/v1/budgets`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
  });

  // ----------------------------------------------------
  // 7. Audit Chain Ledger Integrity Verification
  // ----------------------------------------------------
  it('7.1 should verify cryptographic audit trail validity over live database records', async () => {
    const res = await fetch(`${baseUrl}/api/v1/audit/verify`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.valid, true);
    assert.ok(body.data.totalEvents >= 1);
  });

  // ----------------------------------------------------
  // 8. Database Transaction Behavior & Rollback
  // ----------------------------------------------------
  it('8.1 should rollback database state when a transaction fails mid-way', async () => {
    const initialUsersCount = await testPrisma.user.count();

    try {
      await testPrisma.$transaction(async (tx) => {
        // Step 1: Create a temporary user inside transaction
        await tx.user.create({
          data: {
            email: 'rollback.test@govchain.local',
            passwordHash: 'dummy',
            name: 'Rollback Subject',
            role: 'citizen',
          },
        });

        // Step 2: Intentional failure to trigger rollback
        throw new Error('INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
      });
    } catch (err) {
      assert.strictEqual(err.message, 'INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
    }

    // Verify rollback: user count must remain unchanged
    const finalUsersCount = await testPrisma.user.count();
    assert.strictEqual(finalUsersCount, initialUsersCount);

    const leakedUser = await testPrisma.user.findUnique({
      where: { email: 'rollback.test@govchain.local' },
    });
    assert.strictEqual(leakedUser, null, 'Rolled-back record must not exist in PostgreSQL');
  });
});
