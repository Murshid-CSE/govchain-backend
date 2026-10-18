const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateTrackingId } = require('../src/utils/trackingId');

describe('Tracking ID Generator', () => {
  it('should generate formatted sequential IDs for issues', () => {
    const year = new Date().getFullYear();
    const id = generateTrackingId('ISS', 42);
    assert.strictEqual(id, `ISS-${year}-00042`);
  });

  it('should generate formatted sequential IDs for grievances', () => {
    const year = new Date().getFullYear();
    const id = generateTrackingId('GRV', 1);
    assert.strictEqual(id, `GRV-${year}-00001`);
  });

  it('should pad 5 digits correctly', () => {
    const year = new Date().getFullYear();
    const id = generateTrackingId('TND', 9999);
    assert.strictEqual(id, `TND-${year}-09999`);
  });
});
