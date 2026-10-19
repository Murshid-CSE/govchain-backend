const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { computeAuditHash, GENESIS_HASH } = require('../src/utils/hashChain');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_STAGING_SEED !== 'true') {
    console.error('⛔ Refusing to execute destructive demo seed in production without ALLOW_STAGING_SEED=true.');
    process.exit(1);
  }

  console.log('🌱 Starting GovChain database seed (DEMO/DEVELOPMENT DATA)...');

  // Clear existing demo data in reverse relation order
  await prisma.auditEvent.deleteMany({});
  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.budgetExpenditure.deleteMany({});
  await prisma.budgetAllocation.deleteMany({});
  await prisma.tenderBid.deleteMany({});
  await prisma.tenderDocument.deleteMany({});
  await prisma.tender.deleteMany({});
  await prisma.taskEvent.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.grievanceResponse.deleteMany({});
  await prisma.grievance.deleteMany({});
  await prisma.issueComment.deleteMany({});
  await prisma.issueSupport.deleteMany({});
  await prisma.issueFollow.deleteMany({});
  await prisma.issueDuplicate.deleteMany({});
  await prisma.issueAttachment.deleteMany({});
  await prisma.moderationDecision.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('✓ Cleared existing records');

  // 1. Departments
  const pwdDept = await prisma.department.create({
    data: {
      name: 'Public Works Department (PWD)',
      slug: 'public-works-department-pwd',
      description: 'Responsible for road construction, bridges, and public infrastructure maintenance.',
      headName: 'K. S. Ramanathan',
      contactEmail: 'pwd@govchain.local',
      contactPhone: '+91-44-25671234',
    },
  });

  const waterDept = await prisma.department.create({
    data: {
      name: 'Water Supply and Sewerage Board',
      slug: 'water-supply-and-sewerage-board',
      description: 'Municipal water distribution, pipeline maintenance, and sewage treatment systems.',
      headName: 'Dr. Anita Desai',
      contactEmail: 'water@govchain.local',
      contactPhone: '+91-44-25675678',
    },
  });

  const wasteDept = await prisma.department.create({
    data: {
      name: 'Municipal Solid Waste Management',
      slug: 'municipal-solid-waste-management',
      description: 'Garbage collection, waste segregation, disposal, and civic sanitization.',
      headName: 'M. Imran Khan',
      contactEmail: 'waste@govchain.local',
      contactPhone: '+91-44-25679900',
    },
  });

  console.log('✓ Created 3 core departments');

  // 2. Users (Admin, Official, Moderator, Citizen)
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('GovChain@2026', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@govchain.local',
      passwordHash: commonPasswordHash,
      name: 'System Administrator',
      role: 'admin',
      isVerified: true,
    },
  });

  const official = await prisma.user.create({
    data: {
      email: 'official@govchain.local',
      passwordHash: commonPasswordHash,
      name: 'Er. Rajesh Kumar',
      role: 'official',
      departmentId: pwdDept.id,
      isVerified: true,
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@govchain.local',
      passwordHash: commonPasswordHash,
      name: 'Civic Moderator Team',
      role: 'moderator',
      isVerified: true,
    },
  });

  const citizen = await prisma.user.create({
    data: {
      email: 'citizen@govchain.local',
      passwordHash: commonPasswordHash,
      name: 'Murshid (Resident)',
      role: 'citizen',
      isVerified: true,
      phone: '+91-9876543210',
    },
  });

  console.log('✓ Created 4 system roles (admin, official, moderator, citizen)');

  // 3. Initial Audit Genesis Event
  let prevHash = GENESIS_HASH;
  const genesisTimestamp = new Date();
  const genesisHash = computeAuditHash({
    timestamp: genesisTimestamp.toISOString(),
    action: 'SYSTEM_INITIALIZED',
    entityType: 'system',
    entityId: 'govchain-genesis',
    details: { version: '1.0.0', environment: 'development' },
    prevHash,
  });

  await prisma.auditEvent.create({
    data: {
      timestamp: genesisTimestamp,
      userId: admin.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'system',
      entityId: 'govchain-genesis',
      details: { version: '1.0.0', environment: 'development' },
      prevHash,
      hash: genesisHash,
    },
  });

  prevHash = genesisHash;

  // 4. Sample Issues
  const issue1 = await prisma.issue.create({
    data: {
      trackingId: 'ISS-2026-00001',
      title: 'Deep pothole cluster on Anna Salai Main Junction',
      description:
        'Hazardous series of 3 large craters on the left carriageway near the Metro entrance. Causing major bicycle and two-wheeler skidding risk especially at night.',
      category: 'road_damage',
      priority: 'high',
      status: 'assigned',
      locationText: 'Near Guindy Metro Station, Anna Salai',
      latitude: 13.0067,
      longitude: 80.2021,
      ward: 'Ward 171',
      citizenId: citizen.id,
      departmentId: pwdDept.id,
      supportCount: 42,
      commentCount: 2,
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      trackingId: 'ISS-2026-00002',
      title: 'Main drinking water pipeline fracture with street inundation',
      description:
        'Drinking water line ruptured 48 hours ago. Clean potable water is pouring onto the street while residential apartment taps have run dry.',
      category: 'water_supply',
      priority: 'critical',
      status: 'in_progress',
      locationText: 'Cross Street 4, Besant Nagar',
      latitude: 12.9998,
      longitude: 80.2678,
      ward: 'Ward 175',
      citizenId: citizen.id,
      departmentId: waterDept.id,
      supportCount: 88,
      commentCount: 1,
    },
  });

  console.log('✓ Seeded verified civic issues');

  // 5. Sample Task with Task Events
  const task1 = await prisma.task.create({
    data: {
      title: 'Emergency repair of Anna Salai road crater cluster',
      description: 'Fill craters with cold asphalt mix and level surface before Monday rush hour.',
      status: 'in_progress',
      issueId: issue1.id,
      departmentId: pwdDept.id,
      assigneeId: official.id,
      createdById: admin.id,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h from now
    },
  });

  await prisma.taskEvent.create({
    data: {
      taskId: task1.id,
      userId: official.id,
      action: 'WORK_COMMENCED',
      fromStatus: 'assigned',
      toStatus: 'in_progress',
      note: 'Road repair crew dispatched with asphalt equipment',
      isPublic: true,
    },
  });

  // 6. Sample Tender with Bids
  const tender1 = await prisma.tender.create({
    data: {
      title: 'Citywide Smart LED Street Lighting Upgrade - Zone 4',
      description:
        'Procurement and installation of 1,200 energy-efficient smart LED street luminaires with automated dimming sensors and central SCADA monitoring.',
      departmentId: pwdDept.id,
      category: 'Street Lighting & Electrical',
      budgetAmountPaise: BigInt(450000000), // ₹45,00,000 (45 Lakhs)
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdById: official.id,
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.tenderBid.create({
    data: {
      tenderId: tender1.id,
      bidderId: citizen.id,
      companyName: 'Lumina Tech Infrastructure Ltd',
      amountPaise: BigInt(418000000), // ₹41,80,000
      proposal: 'Full turnkey deployment in 45 days with 5-year comprehensive equipment warranty.',
    },
  });

  console.log('✓ Seeded public tenders and vendor bids');

  // 7. Budget Allocations and Expenditures
  const budget1 = await prisma.budgetAllocation.create({
    data: {
      departmentId: pwdDept.id,
      fiscalYear: '2026-2027',
      category: 'Road Re-surfacing & Junction Improvements',
      allocatedPaise: BigInt(1500000000), // ₹1.5 Crores
      spentPaise: BigInt(320000000),       // ₹32 Lakhs
      source: 'State Infrastructure Development Fund (SIDF)',
      createdById: admin.id,
    },
  });

  await prisma.budgetExpenditure.create({
    data: {
      allocationId: budget1.id,
      amountPaise: BigInt(12500000), // ₹1,25,000
      description: 'Bitumen and gravel supply for Guindy bypass patch works',
      vendor: 'Southern Aggregates Ltd',
      spentOn: new Date(),
      createdById: official.id,
    },
  });

  console.log('✓ Seeded department budgets and itemized expenditures');

  // 8. Sample Civic Poll
  const poll1 = await prisma.poll.create({
    data: {
      title: 'Priority public transport improvement for Ward 171',
      description:
        'Help prioritize city transport funding for this quarter. Select the intervention most urgently needed in your neighbourhood.',
      status: 'active',
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: official.id,
      options: {
        create: [
          { label: 'Protected cycle tracks on arterial corridors', votes: 124 },
          { label: 'Electric feeder mini-buses to Metro station', votes: 289 },
          { label: 'Wider shaded pedestrian footpaths with ramps', votes: 195 },
          { label: 'Modern bus shelters with digital arrival boards', votes: 83 },
        ],
      },
    },
  });

  console.log('✓ Seeded civic initiative polls');

  console.log('\n======================================================');
  console.log('  GOVCHAIN SEED COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log('  Admin user     : admin@govchain.local    (pwd: GovChain@2026)');
  console.log('  Official user  : official@govchain.local (pwd: GovChain@2026)');
  console.log('  Moderator user : moderator@govchain.local(pwd: GovChain@2026)');
  console.log('  Citizen user   : citizen@govchain.local  (pwd: GovChain@2026)');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
