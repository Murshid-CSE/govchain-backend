// ============================================
// GovChain Platform - Frontend Type Definitions
// ============================================

export type UserRole = 'citizen' | 'official' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  departmentId?: string;
  department?: Department;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export type IssueStatus =
  | 'draft'
  | 'submitted'
  | 'under_moderation'
  | 'published'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'reopened'
  | 'closed';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export type IssueCategory =
  | 'road_damage'
  | 'unsafe_construction'
  | 'water_supply'
  | 'drainage'
  | 'waste_management'
  | 'street_lights'
  | 'transport'
  | 'public_facilities'
  | 'education'
  | 'healthcare'
  | 'environment'
  | 'corruption'
  | 'noise'
  | 'encroachment'
  | 'other';

export interface IssueAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}

export interface IssueComment {
  id: string;
  content: string;
  isOfficial: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface Issue {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  locationText?: string;
  latitude?: number;
  longitude?: number;
  ward?: string;
  isPublic: boolean;
  supportCount: number;
  commentCount: number;
  citizen?: {
    id: string;
    name: string;
  };
  department?: Department;
  attachments?: IssueAttachment[];
  comments?: IssueComment[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
  headName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  _count?: {
    issues?: number;
    tasks?: number;
  };
}

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  departmentId?: string;
  department?: Department;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  issueId?: string;
  issue?: {
    id: string;
    trackingId: string;
    title: string;
  };
  createdAt: string;
}

export interface TenderBid {
  id: string;
  companyName: string;
  amountPaise: string;
  proposal: string;
  submittedAt: string;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  department?: Department;
  category: string;
  budgetAmountPaise: string;
  status: string;
  deadline: string;
  awardReason?: string;
  awardedBidId?: string;
  bids?: TenderBid[];
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  departmentId: string;
  department?: Department;
  fiscalYear: string;
  category: string;
  allocatedPaise: string;
  spentPaise: string;
  source?: string;
  expenditures?: {
    id: string;
    amountPaise: string;
    description: string;
    spentOn: string;
    vendor?: string;
  }[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  startsAt: string;
  endsAt: string;
  options: PollOption[];
  createdAt: string;
}

export interface GrievanceResponse {
  id: string;
  message: string;
  statusChange?: string;
  responder?: {
    name: string;
    role: string;
  };
  createdAt: string;
}

export interface Grievance {
  id: string;
  trackingId: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  location?: string;
  slaDeadline?: string;
  department?: Department;
  responses?: GrievanceResponse[];
  createdAt: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  brokenAt?: number | null;
  message: string;
  totalEvents: number;
  verifiedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: { field: string; message: string }[];
}

export interface ChatIntakeResponse {
  isAiFallback: boolean;
  draftReport: {
    title: string;
    description: string;
    suggestedCategory: IssueCategory;
    suggestedPriority: IssuePriority;
    priorityExplanation: string;
    evidenceChecklist: string[];
    disclaimer: string;
  };
  potentialDuplicates: {
    id: string;
    trackingId: string;
    title: string;
    status: IssueStatus;
    locationText?: string;
  }[];
  assistantReply: string;
}
