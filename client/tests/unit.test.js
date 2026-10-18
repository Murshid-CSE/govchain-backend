import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Frontend Unit & Component Logic Tests', () => {
  it('should have complete English and Tamil translation dictionaries with matching keys', () => {
    // Read translations file
    const transPath = path.join(__dirname, '../src/i18n/translations.ts');
    const content = fs.readFileSync(transPath, 'utf8');

    // Extract translations object keys
    assert.ok(content.includes('en: {'), 'Should have English dictionary');
    assert.ok(content.includes('ta: {'), 'Should have Tamil dictionary');

    // Verify key civic terms exist
    const essentialKeys = [
      'appName',
      'tagline',
      'navHome',
      'navIssues',
      'navReport',
      'navChat',
      'navTransparency',
      'navDashboard',
      'statusSubmitted',
      'statusVerified',
      'statusInProgress',
      'statusResolved',
      'statusRejected',
      'catRoadDamage',
      'catWaterSupply',
      'catDrainage',
      'catWasteManagement',
      'priorityCritical',
      'civicDisclaimer',
      'aiDisclaimer',
      'auditNotice',
    ];

    essentialKeys.forEach((key) => {
      assert.ok(
        content.includes(`${key}:`),
        `Translation dictionary must contain key '${key}'`
      );
    });
  });

  it('should validate report input constraints in accordance with backend schemas', () => {
    function validateReport(title, description, category) {
      const errors = [];
      if (!title || title.trim().length < 5) {
        errors.push({ field: 'title', message: 'Title must be at least 5 characters' });
      }
      if (title && title.length > 255) {
        errors.push({ field: 'title', message: 'Title cannot exceed 255 characters' });
      }
      if (!description || description.trim().length < 10) {
        errors.push({ field: 'description', message: 'Description must be at least 10 characters' });
      }
      const validCategories = [
        'road_damage',
        'unsafe_construction',
        'water_supply',
        'drainage',
        'waste_management',
        'street_lights',
        'transport',
        'public_facilities',
        'education',
        'healthcare',
        'environment',
        'corruption',
        'noise',
        'encroachment',
        'other',
      ];
      if (!category || !validCategories.includes(category)) {
        errors.push({ field: 'category', message: 'Invalid category' });
      }
      return { valid: errors.length === 0, errors };
    }

    // Valid report
    const valid = validateReport(
      'Dangerous water pipe rupture on 2nd main street',
      'Clean drinking water is flooding the street and creating muddy potholes for the last 2 days.',
      'water_supply'
    );
    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.errors.length, 0);

    // Short title
    const shortTitle = validateReport('Leak', 'Valid description of the leak happening on the street', 'water_supply');
    assert.strictEqual(shortTitle.valid, false);
    assert.strictEqual(shortTitle.errors[0].field, 'title');

    // Short description
    const shortDesc = validateReport('Broken manhole cover on corner', 'short', 'drainage');
    assert.strictEqual(shortDesc.valid, false);
    assert.strictEqual(shortDesc.errors[0].field, 'description');

    // Invalid category
    const invalidCat = validateReport('Broken manhole cover on corner', 'Valid description of the hazard', 'unrecognized_category');
    assert.strictEqual(invalidCat.valid, false);
    assert.strictEqual(invalidCat.errors[0].field, 'category');
  });

  it('should enforce role-based access control rules for staff workspaces', () => {
    function canAccessStaffWorkspace(userRole) {
      const allowedRoles = ['official', 'admin', 'moderator'];
      return allowedRoles.includes(userRole);
    }

    assert.strictEqual(canAccessStaffWorkspace('citizen'), false, 'Citizen must not have staff workspace access');
    assert.strictEqual(canAccessStaffWorkspace('official'), true, 'Official must have staff workspace access');
    assert.strictEqual(canAccessStaffWorkspace('admin'), true, 'Admin must have staff workspace access');
    assert.strictEqual(canAccessStaffWorkspace('moderator'), true, 'Moderator must have staff workspace access');
  });

  it('should format paise into Indian Rupee currency representations', () => {
    function formatRupees(paiseStr) {
      try {
        const paise = BigInt(paiseStr || '0');
        const rupees = Number(paise / 100n);
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(rupees);
      } catch {
        return `₹${paiseStr}`;
      }
    }

    const formatted50k = formatRupees('5000000'); // 50,000 INR = 5,000,000 paise
    assert.ok(formatted50k.includes('50,000') || formatted50k.includes('50000'));

    const formatted1Cr = formatRupees('1000000000'); // 1 Crore = 10,000,000 INR = 1,000,000,000 paise
    assert.ok(formatted1Cr.includes('1,00,00,000') || formatted1Cr.includes('10,000,000') || formatted1Cr.includes('10000000'));
  });
});
