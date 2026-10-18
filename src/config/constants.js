// ============================================
// Application Constants
// ============================================

const ROLES = {
  CITIZEN: 'citizen',
  MODERATOR: 'moderator',
  OFFICIAL: 'official',
  ADMIN: 'admin',
};

// SLA durations in hours based on grievance priority
const SLA_HOURS = {
  critical: 24,
  high: 72,
  medium: 168, // 7 days
  low: 336,    // 14 days
};

const ISSUE_CATEGORIES = [
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

const ISSUE_STATUSES = [
  'draft',
  'submitted',
  'under_moderation',
  'published',
  'verified',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
  'reopened',
  'closed',
];

const TENDER_STATUSES = [
  'draft',
  'published',
  'bidding',
  'evaluation',
  'awarded',
  'completed',
  'cancelled',
];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

const UPLOAD = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
  MAX_FILES_PER_ISSUE: 5,
};

module.exports = {
  ROLES,
  SLA_HOURS,
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  TENDER_STATUSES,
  PAGINATION,
  UPLOAD,
};
