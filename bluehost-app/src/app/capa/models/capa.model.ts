export interface Capa {
  id: string;
  capaNumber: string;
  title: string;
  description: string;
  type: CapaType;
  status: CapaStatus;
  priority: CapaPriority;
  sourceType: CapaSourceType;
  sourceReference?: string;

  // Dates
  initiatedDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  dueDate: Date;

  // Assignments
  initiatorId: string;
  initiatorName: string;
  ownerId: string;
  ownerName: string;
  assignedDepartment: string;

  // Investigation
  rootCauseAnalysis?: RootCauseAnalysis;
  riskAssessment?: RiskAssessment;

  // Actions
  correctiveActions: CapaAction[];
  preventiveActions: CapaAction[];

  // Effectiveness
  effectivenessCheck?: EffectivenessCheck;

  // Audit Trail
  auditTrail: AuditEntry[];

  // Workflow
  currentWorkflowStep: string;
  workflowHistory: WorkflowStep[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  plantSite: string;
  department: string;
  product?: string;
  batchNumber?: string;
}

export enum CapaType {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
  BOTH = 'CORRECTIVE_AND_PREVENTIVE',
}

export enum CapaStatus {
  INITIATED = 'INITIATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INVESTIGATION = 'INVESTIGATION',
  ROOT_CAUSE_IDENTIFIED = 'ROOT_CAUSE_IDENTIFIED',
  ACTION_PLANNING = 'ACTION_PLANNING',
  ACTION_IN_PROGRESS = 'ACTION_IN_PROGRESS',
  EFFECTIVENESS_CHECK = 'EFFECTIVENESS_CHECK',
  PENDING_CLOSURE = 'PENDING_CLOSURE',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum CapaPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CapaSourceType {
  DEVIATION = 'DEVIATION',
  AUDIT_FINDING = 'AUDIT_FINDING',
  COMPLAINT = 'COMPLAINT',
  OOS_RESULT = 'OOS_RESULT',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  MANAGEMENT_REVIEW = 'MANAGEMENT_REVIEW',
  REGULATORY_OBSERVATION = 'REGULATORY_OBSERVATION',
  SELF_IDENTIFIED = 'SELF_IDENTIFIED',
}

export interface RootCauseAnalysis {
  method: RcaMethod;
  description: string;
  rootCauses: string[];
  contributingFactors: string[];
  fishboneDiagram?: string;
  fiveWhyAnalysis?: FiveWhyEntry[];
  completedDate?: Date;
  completedBy?: string;
}

export enum RcaMethod {
  FIVE_WHY = 'FIVE_WHY',
  FISHBONE = 'FISHBONE',
  FAULT_TREE = 'FAULT_TREE',
  PARETO = 'PARETO',
  FAILURE_MODE = 'FAILURE_MODE',
}

export interface FiveWhyEntry {
  level: number;
  question: string;
  answer: string;
}

export interface RiskAssessment {
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  justification: string;
}

export interface CapaAction {
  id: string;
  actionNumber: string;
  description: string;
  type: 'CORRECTIVE' | 'PREVENTIVE';
  status: ActionStatus;
  assignedTo: string;
  assignedToName: string;
  dueDate: Date;
  completedDate?: Date;
  evidence?: string;
  verifiedBy?: string;
  verifiedDate?: Date;
}

export enum ActionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  OVERDUE = 'OVERDUE',
}

export interface EffectivenessCheck {
  criteria: string;
  checkDate: Date;
  result: 'EFFECTIVE' | 'NOT_EFFECTIVE' | 'PARTIALLY_EFFECTIVE';
  evidence: string;
  verifiedBy: string;
  comments: string;
  requiresRecurrence: boolean;
  recurrenceMonths?: number;
}

export interface AuditEntry {
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

export interface WorkflowStep {
  stepName: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  comments?: string;
}

export interface CapaListFilter {
  status?: CapaStatus[];
  priority?: CapaPriority[];
  type?: CapaType;
  department?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface CapaDashboardMetrics {
  totalOpen: number;
  totalOverdue: number;
  totalClosedThisMonth: number;
  totalInitiatedThisMonth: number;
  avgClosureTimeDays: number;
  effectivenessRate: number;
  byStatus: { status: CapaStatus; count: number }[];
  byPriority: { priority: CapaPriority; count: number }[];
  byDepartment: { department: string; count: number }[];
  trendData: { month: string; initiated: number; closed: number }[];
}
