import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangeControlService } from '../../services/change-control.service';
import { ChangeRequest, ChangeStatus } from '../../models/change-control.model';
import { ESignatureDialogComponent } from '../e-signature-dialog/e-signature-dialog.component';
import { CcImpactDialogComponent } from '../cc-impact-dialog/cc-impact-dialog.component';
import { CcTaskDialogComponent } from '../cc-task-dialog/cc-task-dialog.component';
import { CcApproverDialogComponent } from '../cc-approver-dialog/cc-approver-dialog.component';
import { CcEffectivenessDialogComponent } from '../cc-effectiveness-dialog/cc-effectiveness-dialog.component';

function getUserRoleCodes(): string[] {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (!raw) return [];
  try {
    const roles = JSON.parse(raw)?.user?.roles || [];
    return roles.map((r: any) => typeof r === 'string' ? r : r.code).filter(Boolean);
  } catch { return []; }
}

interface WorkflowAction {
  label: string;
  targetStatus: ChangeStatus;
  type: 'primary' | 'danger' | 'secondary';
  requiresESign?: boolean;
  requiresComment?: boolean;
  requiredRoles?: string[];
}

@Component({
  selector: 'cc-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="cc-detail" *ngIf="cr">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button type="button" (click)="backToList()" matTooltip="Back to register">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ cr.changeNumber }}</h1>
            <p class="subtitle">{{ cr.title }}</p>
          </div>
        </div>
        <div class="header-badges">
          <span class="type-badge">{{ formatType(cr.type) }}</span>
          <span class="classification-badge" [ngClass]="cr.classification.toLowerCase()">{{ cr.classification }}</span>
          <span class="priority-badge" [ngClass]="cr.priority.toLowerCase()">{{ cr.priority }}</span>
          <span class="status-pill" [ngClass]="getStatusClass(cr.status)">{{ formatStatus(cr.status) }}</span>
        </div>
      </div>

      <!-- Workflow Action Bar -->
      <div class="workflow-actions-bar" *ngIf="getAvailableActions().length">
        <button *ngFor="let action of getAvailableActions()"
                [ngClass]="{'wf-btn': true, 'wf-btn-primary': action.type === 'primary', 'wf-btn-danger': action.type === 'danger', 'wf-btn-secondary': action.type === 'secondary'}"
                (click)="executeWorkflowAction(action)"
                [disabled]="actionInProgress">
          {{ action.label }}
        </button>
      </div>

      <!-- Workflow Progress -->
      <mat-card class="workflow-card">
        <mat-card-header>
          <mat-card-title>Workflow Progress</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="workflow-stepper">
            <div class="workflow-step" *ngFor="let step of cr.workflowHistory; let last = last"
                 [ngClass]="step.status.toLowerCase()">
              <div class="step-indicator">
                <mat-icon *ngIf="step.status === 'COMPLETED'">check_circle</mat-icon>
                <mat-icon *ngIf="step.status === 'CURRENT'">radio_button_checked</mat-icon>
                <mat-icon *ngIf="step.status === 'PENDING'">radio_button_unchecked</mat-icon>
              </div>
              <div class="step-content">
                <span class="step-name">{{ step.stepName }}</span>
                <span class="step-date" *ngIf="step.completedAt">{{ step.completedAt | date:'dd-MMM' }}</span>
                <span class="step-assignee" *ngIf="step.assignedTo">{{ step.assignedTo }}</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabs -->
      <mat-tab-group class="detail-tabs" animationDuration="200ms">
        <!-- Overview -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="detail-grid">
              <mat-card class="info-card">
                <h3>General Information</h3>
                <div class="info-row"><span class="info-label">Change #</span><span class="info-value">{{ cr.changeNumber }}</span></div>
                <div class="info-row"><span class="info-label">Type</span><span class="info-value">{{ formatType(cr.type) }}</span></div>
                <div class="info-row"><span class="info-label">Category</span><span class="info-value">{{ formatStatus(cr.category) }}</span></div>
                <div class="info-row"><span class="info-label">Classification</span><span class="info-value">{{ cr.classification }}</span></div>
                <div class="info-row"><span class="info-label">Priority</span><span class="info-value">{{ cr.priority }}</span></div>
                <div class="info-row"><span class="info-label">Plant Site</span><span class="info-value">{{ cr.plantSite }}</span></div>
                <div class="info-row"><span class="info-label">Department</span><span class="info-value">{{ cr.department }}</span></div>
                <div class="info-row"><span class="info-label">Affected Areas</span><span class="info-value">{{ cr.affectedAreas.join(', ') }}</span></div>
              </mat-card>

              <mat-card class="info-card">
                <h3>People & Timeline</h3>
                <div class="info-row"><span class="info-label">Requested By</span><span class="info-value">{{ cr.requestedByName }}</span></div>
                <div class="info-row"><span class="info-label">Change Owner</span><span class="info-value">{{ cr.changeOwnerName }}</span></div>
                <div class="info-row" *ngIf="cr.qaReviewerName"><span class="info-label">QA Reviewer</span><span class="info-value">{{ cr.qaReviewerName }}</span></div>
                <div class="info-row" *ngIf="cr.raReviewerName"><span class="info-label">RA Reviewer</span><span class="info-value">{{ cr.raReviewerName }}</span></div>
                <mat-divider></mat-divider>
                <div class="info-row"><span class="info-label">Requested Date</span><span class="info-value">{{ cr.requestedDate | date:'dd-MMM-yyyy' }}</span></div>
                <div class="info-row"><span class="info-label">Target Date</span><span class="info-value" [ngClass]="{'overdue': isOverdue()}">{{ cr.targetImplementationDate | date:'dd-MMM-yyyy' }}</span></div>
                <div class="info-row" *ngIf="cr.actualImplementationDate"><span class="info-label">Actual Implementation</span><span class="info-value">{{ cr.actualImplementationDate | date:'dd-MMM-yyyy' }}</span></div>
                <div class="info-row" *ngIf="cr.closedDate"><span class="info-label">Closed</span><span class="info-value">{{ cr.closedDate | date:'dd-MMM-yyyy' }}</span></div>
              </mat-card>
            </div>

            <mat-card class="info-card">
              <h3>Description</h3>
              <p class="detail-text">{{ cr.description }}</p>
              <h4>Justification</h4>
              <p class="detail-text highlight">{{ cr.justification }}</p>
            </mat-card>

            <!-- Regulatory -->
            <mat-card class="info-card">
              <h3>Regulatory & Validation</h3>
              <div class="flag-row">
                <div class="flag" [ngClass]="{'active': cr.regulatoryFiling.filingRequired}">
                  <mat-icon>{{ cr.regulatoryFiling.filingRequired ? 'check_circle' : 'cancel' }}</mat-icon>
                  <span>Regulatory Filing Required</span>
                </div>
                <div class="flag" [ngClass]="{'active': cr.validationRequired}">
                  <mat-icon>{{ cr.validationRequired ? 'check_circle' : 'cancel' }}</mat-icon>
                  <span>Validation Required</span>
                </div>
              </div>
              <div *ngIf="cr.regulatoryFiling.filingRequired" class="filing-info">
                <div class="info-row"><span class="info-label">Filing Type</span><span class="info-value">{{ cr.regulatoryFiling.filingType }}</span></div>
                <div class="info-row" *ngIf="cr.regulatoryFiling.markets"><span class="info-label">Markets</span><span class="info-value">{{ cr.regulatoryFiling.markets!.join(', ') }}</span></div>
                <div class="info-row" *ngIf="cr.regulatoryFiling.filingStatus"><span class="info-label">Filing Status</span><span class="info-value">{{ cr.regulatoryFiling.filingStatus }}</span></div>
              </div>
              <div *ngIf="cr.validationDetails" class="validation-info">
                <h4>Validation Details</h4>
                <p class="detail-text">{{ cr.validationDetails }}</p>
              </div>
            </mat-card>

            <!-- Cross References -->
            <mat-card class="info-card" *ngIf="cr.relatedDeviations.length || cr.relatedCapas.length || cr.relatedChanges.length">
              <h3>Cross References</h3>
              <div class="ref-chips">
                <div class="ref-group" *ngIf="cr.relatedDeviations.length">
                  <span class="ref-label">Deviations:</span>
                  <span class="ref-chip dev" *ngFor="let d of cr.relatedDeviations">{{ d }}</span>
                </div>
                <div class="ref-group" *ngIf="cr.relatedCapas.length">
                  <span class="ref-label">CAPAs:</span>
                  <span class="ref-chip capa" *ngFor="let c of cr.relatedCapas">{{ c }}</span>
                </div>
              </div>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Impact Assessment -->
        <mat-tab label="Impact Assessment">
          <div class="tab-content">
            <mat-card class="info-card">
              <div class="section-header">
                <h3>Impact Assessment Matrix</h3>
                <button mat-raised-button color="primary" *ngIf="canEditImpactAssessment()" (click)="openImpactDialog()">
                  <mat-icon>{{ hasImpactData() ? 'edit' : 'add' }}</mat-icon> {{ hasImpactData() ? 'Edit' : 'Create' }} Impact Assessment
                </button>
              </div>
              <div class="impact-matrix">
                <div class="impact-row" *ngFor="let item of getImpactItems()">
                  <span class="impact-area">{{ item.label }}</span>
                  <span class="impact-rating" [ngClass]="item.value.toLowerCase().replace('_', '-')">{{ formatImpact(item.value) }}</span>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="overall-risk">
                <span class="risk-label">Overall Risk Level:</span>
                <span class="risk-badge" [ngClass]="cr.impactAssessment.overallRiskLevel.toLowerCase()">{{ cr.impactAssessment.overallRiskLevel }}</span>
              </div>
              <h4>Assessment Summary</h4>
              <p class="detail-text">{{ cr.impactAssessment.assessmentSummary }}</p>
              <div class="info-row" *ngIf="cr.impactAssessment.assessedBy"><span class="info-label">Assessed By</span><span class="info-value">{{ cr.impactAssessment.assessedBy }}</span></div>
              <div class="info-row" *ngIf="cr.impactAssessment.assessedDate"><span class="info-label">Assessment Date</span><span class="info-value">{{ cr.impactAssessment.assessedDate | date:'dd-MMM-yyyy' }}</span></div>
            </mat-card>

            <!-- Affected Documents -->
            <mat-card class="info-card" *ngIf="cr.affectedDocuments.length">
              <h3>Affected Documents ({{ cr.affectedDocuments.length }})</h3>
              <div class="doc-table">
                <div class="doc-row header">
                  <span>Doc Number</span><span>Title</span><span>Action</span><span>Status</span>
                </div>
                <div class="doc-row" *ngFor="let doc of cr.affectedDocuments">
                  <span class="doc-number">{{ doc.documentNumber }}</span>
                  <span class="doc-title">{{ doc.documentTitle }}</span>
                  <span class="doc-action" [ngClass]="doc.action.toLowerCase().replace('_', '-')">{{ formatAction(doc.action) }}</span>
                  <span class="doc-status">{{ doc.status }}</span>
                </div>
              </div>
            </mat-card>

            <!-- Affected Products -->
            <mat-card class="info-card" *ngIf="cr.affectedProducts.length">
              <h3>Affected Products</h3>
              <div class="product-cards">
                <div class="product-item" *ngFor="let prod of cr.affectedProducts">
                  <div class="prod-header">
                    <strong>{{ prod.productName }}</strong>
                    <span class="prod-code">{{ prod.productCode }}</span>
                  </div>
                  <div class="prod-details">
                    <span>{{ prod.dosageForm }} | Markets: {{ prod.markets.join(', ') }}</span>
                  </div>
                  <p class="prod-impact">{{ prod.impactDescription }}</p>
                </div>
              </div>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Implementation -->
        <mat-tab label="Implementation">
          <div class="tab-content">
            <mat-card class="info-card">
              <div class="section-header">
                <h3>Implementation Plan ({{ cr.implementationPlan.length }} tasks)</h3>
                <button mat-raised-button color="primary" *ngIf="canEditImplementation()" (click)="openTaskDialog()">
                  <mat-icon>add</mat-icon> Add Task
                </button>
              </div>
              <div class="task-progress" *ngIf="cr.implementationPlan.length">
                <mat-progress-bar mode="determinate" [value]="getImplementationProgress()"></mat-progress-bar>
                <span class="progress-text">{{ getImplementationProgress() }}% Complete</span>
              </div>
              <div class="task-list">
                <div class="task-item" *ngFor="let task of cr.implementationPlan" [ngClass]="task.status.toLowerCase().replace('_', '-')">
                  <div class="task-status-icon">
                    <mat-icon *ngIf="task.status === 'COMPLETED'">check_circle</mat-icon>
                    <mat-icon *ngIf="task.status === 'IN_PROGRESS'">pending</mat-icon>
                    <mat-icon *ngIf="task.status === 'NOT_STARTED'">radio_button_unchecked</mat-icon>
                    <mat-icon *ngIf="task.status === 'DELAYED'">warning</mat-icon>
                  </div>
                  <div class="task-body">
                    <div class="task-title">{{ task.taskNumber }}. {{ task.title }}</div>
                    <div class="task-desc">{{ task.description }}</div>
                    <div class="task-meta">
                      <span>{{ task.assignedTo }} ({{ task.department }})</span>
                      <span>Due: {{ task.dueDate | date:'dd-MMM-yy' }}</span>
                      <span *ngIf="task.completedDate" class="completed-date">Done: {{ task.completedDate | date:'dd-MMM-yy' }}</span>
                    </div>
                    <div class="task-actions" *ngIf="cr.status === 'IMPLEMENTATION'">
                      <button mat-stroked-button color="primary" *ngIf="task.status === 'NOT_STARTED'" (click)="updateTask(task, 'IN_PROGRESS')">Start</button>
                      <button mat-stroked-button color="primary" *ngIf="task.status === 'IN_PROGRESS'" (click)="updateTask(task, 'COMPLETED')">Complete</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="empty-state" *ngIf="!cr.implementationPlan.length">
                <mat-icon>engineering</mat-icon>
                <p>Implementation plan not yet defined.</p>
              </div>
            </mat-card>

            <!-- Training -->
            <mat-card class="info-card" *ngIf="cr.trainingRequired">
              <h3>Training Requirements</h3>
              <div class="training-list" *ngIf="cr.trainingPlan && cr.trainingPlan.length; else noTraining">
                <div class="training-item" *ngFor="let tr of cr.trainingPlan">
                  <div class="tr-header">
                    <span class="tr-title">{{ tr.trainingTitle }}</span>
                    <span class="tr-status" [ngClass]="tr.completionStatus.toLowerCase()">{{ tr.completionStatus }}</span>
                  </div>
                  <div class="tr-meta">
                    <span>{{ tr.targetAudience }} | {{ tr.department }} | {{ tr.trainingType }}</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="tr.completionPercentage"></mat-progress-bar>
                </div>
              </div>
              <ng-template #noTraining>
                <p class="no-data">Training plan not yet defined.</p>
              </ng-template>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Approvals -->
        <mat-tab label="Approvals">
          <div class="tab-content">
            <mat-card class="info-card">
              <div class="section-header">
                <h3>Approval History</h3>
                <button mat-raised-button color="primary" *ngIf="canAddApprover()" (click)="openApproverDialog()">
                  <mat-icon>person_add</mat-icon> Add Approver
                </button>
              </div>
              <div class="approval-list" *ngIf="cr.approvals.length; else noApprovals">
                <div class="approval-item" *ngFor="let approval of cr.approvals" [ngClass]="approval.decision.toLowerCase().replace('_', '-')">
                  <div class="approval-icon">
                    <mat-icon *ngIf="approval.decision === 'APPROVED'">check_circle</mat-icon>
                    <mat-icon *ngIf="approval.decision === 'APPROVED_WITH_COMMENTS'">check_circle_outline</mat-icon>
                    <mat-icon *ngIf="approval.decision === 'REJECTED'">cancel</mat-icon>
                    <mat-icon *ngIf="approval.decision === 'PENDING'">hourglass_empty</mat-icon>
                  </div>
                  <div class="approval-body">
                    <div class="approval-name">{{ approval.approverName }}</div>
                    <div class="approval-role">{{ approval.role }} - {{ approval.department }}</div>
                    <div class="approval-date" *ngIf="approval.decisionDate">{{ approval.decisionDate | date:'dd-MMM-yyyy' }}</div>
                    <div class="approval-comment" *ngIf="approval.comments">{{ approval.comments }}</div>
                    <div class="approval-actions" *ngIf="approval.decision === 'PENDING' && cr.status === 'PENDING_APPROVAL'">
                      <button mat-stroked-button color="primary" (click)="submitApproval(approval, 'APPROVED')">Approve</button>
                      <button mat-stroked-button color="warn" (click)="submitApproval(approval, 'REJECTED')">Reject</button>
                    </div>
                  </div>
                  <div class="approval-decision">
                    <span class="decision-badge" [ngClass]="approval.decision.toLowerCase().replace('_', '-')">{{ formatDecision(approval.decision) }}</span>
                  </div>
                </div>
              </div>
              <ng-template #noApprovals>
                <div class="empty-state">
                  <mat-icon>how_to_reg</mat-icon>
                  <p>No approvers added yet.</p>
                </div>
              </ng-template>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Effectiveness -->
        <mat-tab label="Effectiveness">
          <div class="tab-content">
            <mat-card class="info-card" *ngIf="cr.effectivenessReview; else noEffectiveness">
              <h3>Effectiveness Review</h3>
              <div class="effectiveness-header">
                <span class="eff-badge" [ngClass]="cr.effectivenessReview.overallEffective ? 'effective' : 'not-effective'">
                  {{ cr.effectivenessReview.overallEffective ? 'EFFECTIVE' : 'NOT EFFECTIVE' }}
                </span>
              </div>
              <div class="info-row"><span class="info-label">Reviewed By</span><span class="info-value">{{ cr.effectivenessReview.reviewerName }}</span></div>
              <div class="info-row"><span class="info-label">Review Date</span><span class="info-value">{{ cr.effectivenessReview.reviewDate | date:'dd-MMM-yyyy' }}</span></div>
              <mat-divider></mat-divider>
              <h4>Criteria Assessment</h4>
              <div class="criteria-list">
                <div class="criteria-item" *ngFor="let c of cr.effectivenessReview.criteria">
                  <mat-icon [ngClass]="c.met ? 'met' : 'not-met'">{{ c.met ? 'check' : 'close' }}</mat-icon>
                  <div class="criteria-body">
                    <span class="criteria-text">{{ c.criterion }}</span>
                    <span class="criteria-evidence">{{ c.evidence }}</span>
                  </div>
                </div>
              </div>
              <h4>Summary</h4>
              <p class="detail-text">{{ cr.effectivenessReview.summary }}</p>
            </mat-card>

            <ng-template #noEffectiveness>
              <mat-card class="info-card empty-state">
                <mat-icon>fact_check</mat-icon>
                <h3>Effectiveness Review Pending</h3>
                <p>Effectiveness review will be conducted after implementation is complete.</p>
                <button mat-raised-button color="primary" *ngIf="cr.status === 'EFFECTIVENESS_CHECK'" (click)="openEffectivenessDialog()" style="margin-top: 16px;">
                  <mat-icon>fact_check</mat-icon> Submit Effectiveness Review
                </button>
              </mat-card>
            </ng-template>
          </div>
        </mat-tab>

        <!-- Audit Trail -->
        <mat-tab label="Audit Trail">
          <div class="tab-content">
            <mat-card class="info-card">
              <h3>Complete Audit History</h3>
              <div class="audit-trail">
                <div class="audit-entry" *ngFor="let entry of cr.auditTrail">
                  <div class="audit-timestamp">{{ entry.timestamp | date:'dd-MMM-yyyy HH:mm' }}</div>
                  <div class="audit-body">
                    <div class="audit-action">{{ entry.action }}</div>
                    <div class="audit-user">by {{ entry.userName }}</div>
                    <div class="audit-change" *ngIf="entry.field">
                      <span class="field-name">{{ entry.field }}:</span>
                      <span class="old-val" *ngIf="entry.oldValue">{{ entry.oldValue }}</span>
                      <mat-icon *ngIf="entry.oldValue && entry.newValue">arrow_forward</mat-icon>
                      <span class="new-val" *ngIf="entry.newValue">{{ entry.newValue }}</span>
                    </div>
                    <div class="audit-comment" *ngIf="entry.comments">{{ entry.comments }}</div>
                  </div>
                </div>
              </div>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .cc-detail { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { font-size: 14px; color: #666; margin: 2px 0 0; }
    .header-badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .type-badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .classification-badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .classification-badge.critical { background: #ffebee; color: #c62828; }
    .classification-badge.major { background: #fff3e0; color: #e65100; }
    .classification-badge.minor { background: #e8f5e9; color: #2e7d32; }
    .priority-badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .priority-badge.urgent { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #fff8e1; color: #f57f17; }
    .priority-badge.low { background: #e8f5e9; color: #2e7d32; }
    .status-pill { padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-pill.draft { background: #f5f5f5; color: #616161; }
    .status-pill.submitted { background: #fff3e0; color: #e65100; }
    .status-pill.impact-assessment { background: #e3f2fd; color: #1565c0; }
    .status-pill.qa-review { background: #2C5F7C; color: #fff; }
    .status-pill.ra-review { background: #f3e5f5; color: #6a1b9a; }
    .status-pill.pending-approval { background: #D4760A; color: #fff; }
    .status-pill.approved { background: #388E3C; color: #fff; }
    .status-pill.implementation { background: #ED8B00; color: #fff; }
    .status-pill.verification { background: #2C5F7C; color: #fff; }
    .status-pill.effectiveness-check { background: #1565c0; color: #fff; }
    .status-pill.closed { background: #666; color: #fff; }
    .status-pill.rejected { background: #c62828; color: #fff; }
    .status-pill.withdrawn { background: #9e9e9e; color: #fff; }

    .workflow-actions-bar { display: flex; gap: 8px; margin-bottom: 20px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .wf-btn { padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .wf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .wf-btn-primary { background: #2C5F7C; color: #fff; }
    .wf-btn-primary:hover:not(:disabled) { background: #1e4a61; }
    .wf-btn-danger { background: #fff; color: #c62828; border-color: #c62828; }
    .wf-btn-danger:hover:not(:disabled) { background: #ffebee; }
    .wf-btn-secondary { background: #fff; color: #2C5F7C; border-color: #2C5F7C; }
    .wf-btn-secondary:hover:not(:disabled) { background: #e8f4f8; }

    .workflow-card { margin-bottom: 20px; }
    .workflow-stepper { display: flex; gap: 4px; overflow-x: auto; padding: 16px 0; }
    .workflow-step { display: flex; flex-direction: column; align-items: center; min-width: 80px; padding: 6px; }
    .workflow-step.completed .step-indicator { color: #2C5F7C; }
    .workflow-step.current .step-indicator { color: #ED8B00; animation: pulse-step 1.5s ease-in-out infinite; }
    @keyframes pulse-step { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .workflow-step.pending .step-indicator { color: #bdbdbd; }
    .step-indicator mat-icon { font-size: 20px; }
    .step-content { text-align: center; margin-top: 4px; }
    .step-name { font-size: 10px; font-weight: 500; color: #333; display: block; }
    .step-date { font-size: 9px; color: #888; display: block; }
    .step-assignee { font-size: 9px; color: #666; display: block; }

    .tab-content { padding: 20px 0; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
    .info-card { padding: 20px; margin-bottom: 16px; }
    .info-card h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #333; }
    .info-card h4 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: #444; }
    .info-row { display: flex; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
    .info-label { font-size: 13px; color: #666; min-width: 140px; font-weight: 500; }
    .info-value { font-size: 13px; color: #333; flex: 1; }
    .overdue { color: #d32f2f; font-weight: 600; }
    .detail-text { font-size: 13px; line-height: 1.6; color: #444; }
    .detail-text.highlight { background: #FFF8E1; padding: 12px; border-radius: 8px; border-left: 3px solid #ED8B00; }

    .flag-row { display: flex; gap: 24px; margin-bottom: 16px; }
    .flag { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #999; }
    .flag.active { color: #333; }
    .flag.active mat-icon { color: #4caf50; }
    .flag mat-icon { font-size: 18px; width: 18px; height: 18px; color: #ccc; }

    .impact-matrix { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .impact-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
    .impact-area { font-size: 13px; color: #555; }
    .impact-rating { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .impact-rating.no-impact { background: #f5f5f5; color: #999; }
    .impact-rating.low { background: #e8f5e9; color: #2e7d32; }
    .impact-rating.medium { background: #fff8e1; color: #f57f17; }
    .impact-rating.high { background: #ffebee; color: #c62828; }
    .overall-risk { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
    .risk-label { font-size: 14px; font-weight: 600; }
    .risk-badge { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .risk-badge.low { background: #e8f5e9; color: #2e7d32; }
    .risk-badge.medium { background: #fff8e1; color: #f57f17; }
    .risk-badge.high { background: #ffebee; color: #c62828; }
    .risk-badge.critical { background: #b71c1c; color: white; }

    .doc-table { display: flex; flex-direction: column; font-size: 12px; }
    .doc-row { display: grid; grid-template-columns: 140px 1fr 100px 80px; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; align-items: center; }
    .doc-row.header { font-weight: 600; color: #555; }
    .doc-number { color: #2C5F7C; font-weight: 500; }
    .doc-action { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-align: center; }
    .doc-action.revise { background: #fff3e0; color: #e65100; }
    .doc-action.create-new { background: #e8f5e9; color: #2e7d32; }
    .doc-action.retire { background: #ffebee; color: #c62828; }
    .doc-action.no-change { background: #f5f5f5; color: #757575; }

    .product-item { padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; }
    .prod-header { display: flex; justify-content: space-between; }
    .prod-code { font-size: 12px; color: #2C5F7C; }
    .prod-details { font-size: 12px; color: #666; margin-top: 4px; }
    .prod-impact { font-size: 12px; color: #444; margin-top: 6px; }

    .task-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .task-progress mat-progress-bar { flex: 1; }
    .progress-text { font-size: 13px; font-weight: 600; color: #2C5F7C; }
    .task-list { display: flex; flex-direction: column; gap: 8px; }
    .task-item { display: flex; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; }
    .task-item.completed { opacity: 0.7; }
    .task-status-icon mat-icon { font-size: 20px; }
    .task-item.completed .task-status-icon { color: #4caf50; }
    .task-item.in-progress .task-status-icon { color: #ED8B00; }
    .task-item.not-started .task-status-icon { color: #bdbdbd; }
    .task-item.delayed .task-status-icon { color: #d32f2f; }
    .task-body { flex: 1; }
    .task-title { font-size: 13px; font-weight: 500; }
    .task-desc { font-size: 12px; color: #666; margin-top: 2px; }
    .task-meta { font-size: 11px; color: #888; margin-top: 4px; display: flex; gap: 16px; }
    .completed-date { color: #4caf50; }

    .training-list { display: flex; flex-direction: column; gap: 12px; }
    .training-item { padding: 12px; border: 1px solid #eee; border-radius: 8px; }
    .tr-header { display: flex; justify-content: space-between; align-items: center; }
    .tr-title { font-size: 13px; font-weight: 500; }
    .tr-status { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .tr-status.completed { background: #e8f5e9; color: #2e7d32; }
    .tr-status.pending { background: #f5f5f5; color: #616161; }
    .tr-status.in-progress { background: rgba(237,139,0,0.12); color: #ED8B00; }
    .tr-meta { font-size: 11px; color: #888; margin: 4px 0 8px; }

    .approval-list { display: flex; flex-direction: column; gap: 12px; }
    .approval-item { display: flex; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; align-items: flex-start; }
    .approval-icon mat-icon { font-size: 22px; }
    .approval-item.approved .approval-icon, .approval-item.approved-with-comments .approval-icon { color: #4caf50; }
    .approval-item.rejected .approval-icon { color: #d32f2f; }
    .approval-item.pending .approval-icon { color: #bdbdbd; }
    .approval-body { flex: 1; }
    .approval-name { font-size: 14px; font-weight: 500; }
    .approval-role { font-size: 12px; color: #666; }
    .approval-date { font-size: 11px; color: #888; }
    .approval-comment { font-size: 12px; color: #555; font-style: italic; margin-top: 4px; padding: 6px 8px; background: #f9f9f9; border-radius: 4px; }
    .decision-badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .decision-badge.approved, .decision-badge.approved-with-comments { background: #e8f5e9; color: #2e7d32; }
    .decision-badge.rejected { background: #ffebee; color: #c62828; }
    .decision-badge.pending { background: #f5f5f5; color: #616161; }

    .effectiveness-header { margin-bottom: 16px; }
    .eff-badge { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 700; }
    .eff-badge.effective { background: #e8f5e9; color: #2e7d32; }
    .eff-badge.not-effective { background: #ffebee; color: #c62828; }
    .criteria-list { display: flex; flex-direction: column; gap: 8px; margin: 8px 0; }
    .criteria-item { display: flex; gap: 8px; align-items: flex-start; }
    .criteria-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .criteria-item mat-icon.met { color: #4caf50; }
    .criteria-item mat-icon.not-met { color: #d32f2f; }
    .criteria-body { display: flex; flex-direction: column; }
    .criteria-text { font-size: 13px; color: #333; }
    .criteria-evidence { font-size: 11px; color: #888; }

    .audit-trail { display: flex; flex-direction: column; }
    .audit-entry { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
    .audit-timestamp { font-size: 12px; color: #888; min-width: 130px; white-space: nowrap; }
    .audit-body { flex: 1; }
    .audit-action { font-size: 13px; font-weight: 500; color: #333; }
    .audit-user { font-size: 12px; color: #666; }
    .audit-change { font-size: 12px; display: flex; align-items: center; gap: 4px; margin-top: 4px; }
    .audit-change mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .field-name { color: #666; }
    .old-val { color: #d32f2f; text-decoration: line-through; }
    .new-val { color: #2e7d32; }
    .audit-comment { font-size: 12px; color: #555; font-style: italic; margin-top: 4px; }

    .ref-chips { display: flex; flex-direction: column; gap: 8px; }
    .ref-group { display: flex; align-items: center; gap: 8px; }
    .ref-label { font-size: 12px; color: #666; font-weight: 500; }
    .ref-chip { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .ref-chip.dev { background: #fff3e0; color: #e65100; }
    .ref-chip.capa { background: #f3e5f5; color: #6a1b9a; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h3 { margin: 0; }
    .task-actions { display: flex; gap: 8px; margin-top: 8px; }
    .approval-actions { display: flex; gap: 8px; margin-top: 8px; }
    .empty-state { text-align: center; padding: 48px 20px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #bbb; }
    .empty-state h3 { color: #666; }
    .empty-state p { color: #888; }
    .no-data { font-size: 13px; color: #888; text-align: center; }

    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } }
  `],
})
export class CcDetailComponent implements OnInit {
  cr: ChangeRequest | null = null;
  actionInProgress = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ccService: ChangeControlService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ccService.getChangeRequestById(id).subscribe((data) => {
        this.cr = data || null;
      });
    }
  }

  backToList(): void {
    this.router.navigate(['/change-control/list']);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatImpact(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatAction(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatDecision(decision: string): string {
    return decision.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStatusClass(status: ChangeStatus): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  isOverdue(): boolean {
    return this.cr !== null && this.cr.status !== ChangeStatus.CLOSED && this.cr.status !== ChangeStatus.REJECTED && new Date(this.cr.targetImplementationDate) < new Date();
  }

  getImplementationProgress(): number {
    if (!this.cr || !this.cr.implementationPlan.length) return 0;
    const completed = this.cr.implementationPlan.filter((t) => t.status === 'COMPLETED').length;
    return Math.round((completed / this.cr.implementationPlan.length) * 100);
  }

  getImpactItems(): { label: string; value: string }[] {
    if (!this.cr) return [];
    const ia = this.cr.impactAssessment;
    return [
      { label: 'Product Quality', value: ia.productQuality },
      { label: 'Patient Safety', value: ia.patientSafety },
      { label: 'Regulatory Compliance', value: ia.regulatoryCompliance },
      { label: 'Validation Status', value: ia.validationStatus },
      { label: 'Documentation', value: ia.documentation },
      { label: 'Training', value: ia.training },
      { label: 'Supplier Qualification', value: ia.supplierQualification },
      { label: 'Stability', value: ia.stability },
    ];
  }

  getAvailableActions(): WorkflowAction[] {
    if (!this.cr) return [];
    const roles = getUserRoleCodes();
    const allActions: Record<string, WorkflowAction[]> = {
      [ChangeStatus.DRAFT]: [
        { label: 'Submit Change Request', targetStatus: ChangeStatus.SUBMITTED, type: 'primary',
          requiredRoles: ['OWNER', 'END_USER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.SUBMITTED]: [
        { label: 'Start Impact Assessment', targetStatus: ChangeStatus.IMPACT_ASSESSMENT, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reject', targetStatus: ChangeStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.IMPACT_ASSESSMENT]: [
        { label: 'Submit for QA Review', targetStatus: ChangeStatus.QA_REVIEW, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.QA_REVIEW]: [
        { label: 'Approve QA Review', targetStatus: this.cr.regulatoryFiling?.filingRequired ? ChangeStatus.RA_REVIEW : ChangeStatus.PENDING_APPROVAL, type: 'primary',
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reject', targetStatus: ChangeStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.RA_REVIEW]: [
        { label: 'Approve RA Review', targetStatus: ChangeStatus.PENDING_APPROVAL, type: 'primary',
          requiredRoles: ['REVIEWER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reject', targetStatus: ChangeStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['REVIEWER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.PENDING_APPROVAL]: [
        { label: 'Approve Change', targetStatus: ChangeStatus.APPROVED, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_APPROVER', 'APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reject', targetStatus: ChangeStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_APPROVER', 'APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.APPROVED]: [
        { label: 'Start Implementation', targetStatus: ChangeStatus.IMPLEMENTATION, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.IMPLEMENTATION]: [
        { label: 'Complete Implementation', targetStatus: ChangeStatus.VERIFICATION, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.VERIFICATION]: [
        { label: 'Verify & Start Effectiveness', targetStatus: ChangeStatus.EFFECTIVENESS_CHECK, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [ChangeStatus.EFFECTIVENESS_CHECK]: [
        { label: 'Close Change Request', targetStatus: ChangeStatus.CLOSED, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reopen Implementation', targetStatus: ChangeStatus.IMPLEMENTATION, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
    };
    const actions = allActions[this.cr.status] || [];
    return actions.filter(a => !a.requiredRoles || a.requiredRoles.some(r => roles.includes(r)));
  }

  executeWorkflowAction(action: WorkflowAction): void {
    if (!this.cr) return;

    if (action.requiresESign) {
      const dialogRef = this.dialog.open(ESignatureDialogComponent, {
        width: '480px',
        disableClose: true,
        data: {
          recordNumber: this.cr.changeNumber,
          action: action.label,
          meaning: `I confirm the ${action.label.toLowerCase()} for ${this.cr.changeNumber}`,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result?.signed) {
          this.performStatusChange(action.targetStatus, `E-Signed: ${result.meaning}`);
        }
      });
    } else if (action.requiresComment) {
      const comment = prompt(`Please provide a reason for: ${action.label}`);
      if (comment !== null && comment.trim()) {
        this.performStatusChange(action.targetStatus, comment);
      }
    } else {
      this.performStatusChange(action.targetStatus);
    }
  }

  private performStatusChange(targetStatus: ChangeStatus, comments?: string): void {
    if (!this.cr) return;
    this.actionInProgress = true;
    this.ccService.updateStatus(this.cr.id, targetStatus, comments).subscribe({
      next: () => {
        this.actionInProgress = false;
        this.reloadCr();
      },
      error: (err) => {
        this.actionInProgress = false;
        console.error('Status change failed:', err);
        alert('Failed to update status. Please try again.');
      },
    });
  }

  private reloadCr(): void {
    if (!this.cr) return;
    this.ccService.getChangeRequestById(this.cr.id).subscribe((full) => {
      if (full) this.cr = full;
    });
  }

  hasImpactData(): boolean {
    return !!this.cr?.impactAssessment?.assessmentSummary;
  }

  canEditImpactAssessment(): boolean {
    if (!this.cr) return false;
    return [ChangeStatus.SUBMITTED, ChangeStatus.IMPACT_ASSESSMENT, ChangeStatus.DRAFT].includes(this.cr.status as ChangeStatus);
  }

  canEditImplementation(): boolean {
    if (!this.cr) return false;
    return [ChangeStatus.APPROVED, ChangeStatus.IMPLEMENTATION].includes(this.cr.status as ChangeStatus);
  }

  canAddApprover(): boolean {
    if (!this.cr) return false;
    return [ChangeStatus.QA_REVIEW, ChangeStatus.RA_REVIEW, ChangeStatus.PENDING_APPROVAL, ChangeStatus.IMPACT_ASSESSMENT].includes(this.cr.status as ChangeStatus);
  }

  openImpactDialog(): void {
    if (!this.cr) return;
    const dialogRef = this.dialog.open(CcImpactDialogComponent, {
      width: '640px',
      data: { changeRequestId: this.cr.id, existing: this.hasImpactData() ? this.cr.impactAssessment : undefined },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Impact assessment saved', 'OK', { duration: 3000 });
        this.reloadCr();
      }
    });
  }

  openTaskDialog(): void {
    if (!this.cr) return;
    const dialogRef = this.dialog.open(CcTaskDialogComponent, {
      width: '520px',
      data: { changeRequestId: this.cr.id },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Implementation task added', 'OK', { duration: 3000 });
        this.reloadCr();
      }
    });
  }

  updateTask(task: any, newStatus: string): void {
    if (!this.cr) return;
    const payload: any = { status: newStatus };
    if (newStatus === 'COMPLETED') {
      payload.completedDate = new Date().toISOString();
    }
    this.ccService.updateImplementationTask(this.cr.id, task.id, payload).subscribe({
      next: () => {
        this.snackBar.open(`Task ${newStatus === 'IN_PROGRESS' ? 'started' : 'completed'}`, 'OK', { duration: 3000 });
        this.reloadCr();
      },
      error: (err) => { console.error(err); alert('Failed to update task.'); },
    });
  }

  openApproverDialog(): void {
    if (!this.cr) return;
    const dialogRef = this.dialog.open(CcApproverDialogComponent, {
      width: '480px',
      data: { changeRequestId: this.cr.id },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Approver added', 'OK', { duration: 3000 });
        this.reloadCr();
      }
    });
  }

  submitApproval(approval: any, decision: string): void {
    if (!this.cr) return;
    let comments = '';
    if (decision === 'REJECTED') {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason === null || !reason.trim()) return;
      comments = reason;
    }
    this.ccService.submitApprovalDecision(this.cr.id, approval.id, { decision, comments }).subscribe({
      next: () => {
        this.snackBar.open(`Approval ${decision.toLowerCase()}`, 'OK', { duration: 3000 });
        this.reloadCr();
      },
      error: (err) => { console.error(err); alert('Failed to submit approval decision.'); },
    });
  }

  openEffectivenessDialog(): void {
    if (!this.cr) return;
    const dialogRef = this.dialog.open(CcEffectivenessDialogComponent, {
      width: '640px',
      data: { changeRequestId: this.cr.id },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Effectiveness review submitted', 'OK', { duration: 3000 });
        this.reloadCr();
      }
    });
  }
}
