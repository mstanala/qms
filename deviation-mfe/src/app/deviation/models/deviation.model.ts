export interface Deviation {
  id: string;
  deviationNumber: string;
  title: string;
  description: string;
  type: DeviationType;
  category: DeviationCategory;
  classification: DeviationClassification;
  status: DeviationStatus;
  sourceArea: string;

  // Dates
  occurredDate: Date;
  reportedDate: Date;
  detectedDate: Date;
  targetClosureDate: Date;
  actualClosureDate?: Date;

  // People
  reportedById: string;
  reportedByName: string;
  assignedToId: string;
  assignedToName: string;
  reviewerId?: string;
  reviewerName?: string;
  approvedById?: string;
  approvedByName?: string;

  // Location
  plantSite: string;
  department: string;
  area: string;
  equipment?: string;

  // Product impact
  product?: string;
  batchNumber?: string;
  batchSize?: string;
  affectedBatches: string[];
  gmpImpact: boolean;
  patientSafetyImpact: boolean;
  regulatoryImpact: boolean;

  // Investigation
  investigation?: DeviationInvestigation;
  impactAssessment?: ImpactAssessment;
  disposition?: DeviationDisposition;

  // CAPA link
  capaRequired: boolean;
  capaReference?: string;

  // Audit trail
  auditTrail: DeviationAuditEntry[];

  // Workflow
  currentWorkflowStep: string;
  workflowHistory: DeviationWorkflowStep[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Attachments
  attachments: DeviationAttachment[];
}

export enum DeviationType {
  PLANNED = 'PLANNED',
  UNPLANNED = 'UNPLANNED',
}

export enum DeviationCategory {
  PROCESS = 'PROCESS',
  EQUIPMENT = 'EQUIPMENT',
  MATERIAL = 'MATERIAL',
  DOCUMENTATION = 'DOCUMENTATION',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  PERSONNEL = 'PERSONNEL',
  UTILITY = 'UTILITY',
  LABORATORY = 'LABORATORY',
  PACKAGING = 'PACKAGING',
  CLEANING = 'CLEANING',
}

export enum DeviationClassification {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
}

export enum DeviationStatus {
  REPORTED = 'REPORTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CLASSIFIED = 'CLASSIFIED',
  INVESTIGATION = 'INVESTIGATION',
  IMPACT_ASSESSMENT = 'IMPACT_ASSESSMENT',
  DISPOSITION = 'DISPOSITION',
  CAPA_INITIATED = 'CAPA_INITIATED',
  PENDING_CLOSURE = 'PENDING_CLOSURE',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export interface DeviationInvestigation {
  investigatorId: string;
  investigatorName: string;
  startDate: Date;
  completedDate?: Date;
  probableCause: string;
  rootCause: string;
  immediateActions: string[];
  findings: string;
  conclusion: string;
  method: string;
}

export interface ImpactAssessment {
  productQualityImpact: ImpactLevel;
  patientSafetyImpact: ImpactLevel;
  regulatoryImpact: ImpactLevel;
  businessImpact: ImpactLevel;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedProducts: string[];
  affectedBatches: string[];
  batchDisposition: string;
  justification: string;
  assessedBy: string;
  assessedDate: Date;
}

export enum ImpactLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface DeviationDisposition {
  decision: DispositionDecision;
  justification: string;
  conditions?: string;
  approvedBy: string;
  approvedDate: Date;
  qaReviewComments: string;
}

export enum DispositionDecision {
  RELEASE = 'RELEASE',
  RELEASE_WITH_CONDITIONS = 'RELEASE_WITH_CONDITIONS',
  REPROCESS = 'REPROCESS',
  REWORK = 'REWORK',
  REJECT = 'REJECT',
  QUARANTINE = 'QUARANTINE',
  USE_AS_IS = 'USE_AS_IS',
}

export interface DeviationAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  comments?: string;
  electronicSignature?: string;
}

export interface DeviationWorkflowStep {
  stepName: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  comments?: string;
}

export interface DeviationAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: Date;
  description?: string;
}

export interface DeviationListFilter {
  status?: DeviationStatus[];
  classification?: DeviationClassification[];
  category?: DeviationCategory[];
  type?: DeviationType;
  department?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface DeviationDashboardMetrics {
  totalOpen: number;
  totalOverdue: number;
  totalReportedThisMonth: number;
  totalClosedThisMonth: number;
  avgClosureTimeDays: number;
  criticalOpen: number;
  capaConversionRate: number;
  byStatus: { status: DeviationStatus; count: number }[];
  byClassification: { classification: DeviationClassification; count: number }[];
  byCategory: { category: DeviationCategory; count: number }[];
  byDepartment: { department: string; count: number }[];
  trendData: { month: string; reported: number; closed: number }[];
}
