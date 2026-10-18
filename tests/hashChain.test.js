const { describe, it } = require('node:test');
const assert = require('node:assert');
const { computeAuditHash, verifyChain, GENESIS_HASH } = require('../src/utils/hashChain');

describe('Cryptographic Hash Chain', () => {
  it('should compute deterministic SHA-256 hash for given payload', () => {
    const timestamp = '2026-10-18T12:00:00.000Z';
    const hash1 = computeAuditHash({
      timestamp,
      action: 'ISSUE_CREATED',
      entityType: 'issue',
      entityId: 'uuid-1',
      details: { title: 'Pothole on Main Road' },
      prevHash: GENESIS_HASH,
    });

    const hash2 = computeAuditHash({
      timestamp,
      action: 'ISSUE_CREATED',
      entityType: 'issue',
      entityId: 'uuid-1',
      details: { title: 'Pothole on Main Road' },
      prevHash: GENESIS_HASH,
    });

    assert.strictEqual(hash1, hash2);
    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 64);
  });

  it('should verify an intact 3-event chain successfully', () => {
    const t1 = new Date('2026-01-01T00:00:00.000Z');
    const h1 = computeAuditHash({
      timestamp: t1.toISOString(),
      action: 'TENDER_CREATED',
      entityType: 'tender',
      entityId: 't-1',
      details: { title: 'Bridge project' },
      prevHash: GENESIS_HASH,
    });

    const t2 = new Date('2026-01-02T00:00:00.000Z');
    const h2 = computeAuditHash({
      timestamp: t2.toISOString(),
      action: 'BID_SUBMITTED',
      entityType: 'tender',
      entityId: 't-1',
      details: { bidder: 'ABC Builders', amount: '5000000' },
      prevHash: h1,
    });

    const t3 = new Date('2026-01-03T00:00:00.000Z');
    const h3 = computeAuditHash({
      timestamp: t3.toISOString(),
      action: 'TENDER_AWARDED',
      entityType: 'tender',
      entityId: 't-1',
      details: { winner: 'ABC Builders' },
      prevHash: h2,
    });

    const chain = [
      { id: BigInt(1), timestamp: t1, action: 'TENDER_CREATED', entityType: 'tender', entityId: 't-1', details: { title: 'Bridge project' }, prevHash: GENESIS_HASH, hash: h1 },
      { id: BigInt(2), timestamp: t2, action: 'BID_SUBMITTED', entityType: 'tender', entityId: 't-1', details: { bidder: 'ABC Builders', amount: '5000000' }, prevHash: h1, hash: h2 },
      { id: BigInt(3), timestamp: t3, action: 'TENDER_AWARDED', entityType: 'tender', entityId: 't-1', details: { winner: 'ABC Builders' }, prevHash: h2, hash: h3 },
    ];

    const result = verifyChain(chain);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.brokenAt, null);
  });

  it('should detect tampering if an intermediate event payload is modified', () => {
    const t1 = new Date('2026-01-01T00:00:00.000Z');
    const h1 = computeAuditHash({
      timestamp: t1.toISOString(),
      action: 'BUDGET_ALLOCATED',
      entityType: 'budget',
      entityId: 'b-1',
      details: { amount: '1000000' },
      prevHash: GENESIS_HASH,
    });

    const t2 = new Date('2026-01-02T00:00:00.000Z');
    const h2 = computeAuditHash({
      timestamp: t2.toISOString(),
      action: 'BUDGET_SPENT',
      entityType: 'budget',
      entityId: 'b-1',
      details: { amount: '200000' },
      prevHash: h1,
    });

    // An attacker modifies the spent amount in record 2 without changing hash, or re-hashes without updating record 3
    const tamperedChain = [
      { id: BigInt(1), timestamp: t1, action: 'BUDGET_ALLOCATED', entityType: 'budget', entityId: 'b-1', details: { amount: '1000000' }, prevHash: GENESIS_HASH, hash: h1 },
      { id: BigInt(2), timestamp: t2, action: 'BUDGET_SPENT', entityType: 'budget', entityId: 'b-1', details: { amount: '99999999' }, prevHash: h1, hash: h2 },
    ];

    const result = verifyChain(tamperedChain);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.brokenAt, 2);
  });
});
