import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CapaService } from '../../services/capa.service';
import { Capa, CapaStatus } from '../../models/capa.model';
import { ESignatureDialogComponent } from '../e-signature-dialog/e-signature-dialog.component';
import { CapaActionDialogComponent } from '../capa-action-dialog/capa-action-dialog.component';
import { CapaEffectivenessDialogComponent } from '../capa-effectiveness-dialog/capa-effectiveness-dialog.component';

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
  targetStatus: CapaStatus;
  type: 'primary' | 'danger' | 'secondary';
  requiresESign?: boolean;
  requiresComment?: boolean;
  requiredRoles?: string[];
}

@Component({
  selector: 'capa-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatStepperModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
  template: `
    <div class="capa-detail" *ngIf="capa">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button type="button" (click)="backToList()" matTooltip="Back to list">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ capa.capaNumber }}</h1>
            <p class="subtitle">{{ capa.title }}</p>
          </div>
        </div>
        <div class="header-actions">
          <span class="status-pill" [ngClass]="getStatusClass(capa.status)">
            {{ formatStatus(capa.status) }}
          </span>
          <span class="priority-badge" [ngClass]="capa.priority.toLowerCase()">
            {{ capa.priority }}
          </span>
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

      <!-- Risk Assessment Form Overlay -->
      <div class="overlay-backdrop" *ngIf="riskFormVisible" (click)="cancelRiskForm()"></div>
      <div class="overlay-form" *ngIf="riskFormVisible">
        <h3>Risk Assessment (S x O x D)</h3>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Severity (1-5)</mat-label>
            <mat-select [(ngModel)]="riskForm.severity">
              <mat-option *ngFor="let v of [1,2,3,4,5]" [value]="v">{{ v }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Occurrence (1-5)</mat-label>
            <mat-select [(ngModel)]="riskForm.occurrence">
              <mat-option *ngFor="let v of [1,2,3,4,5]" [value]="v">{{ v }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Detection (1-5)</mat-label>
            <mat-select [(ngModel)]="riskForm.detection">
              <mat-option *ngFor="let v of [1,2,3,4,5]" [value]="v">{{ v }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="rpn-display">
          RPN: <strong>{{ riskForm.severity * riskForm.occurrence * riskForm.detection }}</strong>
          &mdash; Risk Level: <strong>{{ computeRiskLevel() }}</strong>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Justification</mat-label>
          <textarea matInput [(ngModel)]="riskForm.justification" rows="3"></textarea>
        </mat-form-field>
        <div class="form-actions">
          <button mat-button (click)="cancelRiskForm()">Cancel</button>
          <button mat-raised-button color="primary" [disabled]="riskSubmitting || !riskForm.justification" (click)="submitRiskForm()">
            {{ riskSubmitting ? 'Submitting...' : 'Submit & Proceed' }}
          </button>
        </div>
      </div>

      <!-- Workflow Progress -->
      <mat-card class="workflow-card">
        <mat-card-header>
          <mat-card-title>Workflow Progress</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="workflow-stepper">
            <div class="workflow-step" *ngFor="let step of capa.workflowHistory"
                 [ngClass]="step.status.toLowerCase()">
              <div class="step-indicator">
                <mat-icon *ngIf="step.status === 'COMPLETED'">check_circle</mat-icon>
                <mat-icon *ngIf="step.status === 'CURRENT'">radio_button_checked</mat-icon>
                <mat-icon *ngIf="step.status === 'PENDING'">radio_button_unchecked</mat-icon>
              </div>
              <div class="step-content">
                <span class="step-name">{{ step.stepName }}</span>
                <span class="step-date" *ngIf="step.completedAt">
                  {{ step.completedAt | date:'dd-MMM-yy' }}
                </span>
                <span class="step-assignee" *ngIf="step.assignedTo">
                  {{ step.assignedTo }}
                </span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab Content -->
      <mat-tab-group class="detail-tabs" animationDuration="200ms">
        <!-- Overview Tab -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="detail-grid">
              <mat-card class="info-card">
                <h3>General Information</h3>
                <div class="info-row">
                  <span class="info-label">CAPA Number</span>
                  <span class="info-value">{{ capa.capaNumber }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Type</span>
                  <span class="info-value">{{ formatType(capa.type) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Source</span>
                  <span class="info-value">{{ formatSource(capa.sourceType) }}</span>
                </div>
                <div class="info-row" *ngIf="capa.sourceReference">
                  <span class="info-label">Source Reference</span>
                  <span class="info-value link">{{ capa.sourceReference }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Plant Site</span>
                  <span class="info-value">{{ capa.plantSite }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Department</span>
                  <span class="info-value">{{ capa.department }}</span>
                </div>
                <div class="info-row" *ngIf="capa.product">
                  <span class="info-label">Product</span>
                  <span class="info-value">{{ capa.product }}</span>
                </div>
                <div class="info-row" *ngIf="capa.batchNumber">
                  <span class="info-label">Batch Number</span>
                  <span class="info-value">{{ capa.batchNumber }}</span>
                </div>
              </mat-card>

              <mat-card class="info-card">
                <h3>Assignment & Timeline</h3>
                <div class="info-row">
                  <span class="info-label">Initiator</span>
                  <span class="info-value">{{ capa.initiatorName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Owner</span>
                  <span class="info-value">{{ capa.ownerName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Initiated Date</span>
                  <span class="info-value">{{ capa.initiatedDate | date:'dd-MMM-yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Target Completion</span>
                  <span class="info-value">{{ capa.targetCompletionDate | date:'dd-MMM-yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Due Date</span>
                  <span class="info-value" [ngClass]="{'overdue': isOverdue()}">
                    {{ capa.dueDate | date:'dd-MMM-yyyy' }}
                  </span>
                </div>
                <div class="info-row" *ngIf="capa.actualCompletionDate">
                  <span class="info-label">Actual Completion</span>
                  <span class="info-value">{{ capa.actualCompletionDate | date:'dd-MMM-yyyy' }}</span>
                </div>
              </mat-card>
            </div>

            <mat-card class="info-card description-card">
              <h3>Description</h3>
              <p class="description-text">{{ capa.description }}</p>
            </mat-card>

            <!-- Risk Assessment -->
            <mat-card class="info-card" *ngIf="capa.riskAssessment">
              <h3>Risk Assessment</h3>
              <div class="risk-grid">
                <div class="risk-item">
                  <span class="risk-label">Severity</span>
                  <span class="risk-value">{{ capa.riskAssessment.severity }}</span>
                </div>
                <div class="risk-item">
                  <span class="risk-label">Occurrence</span>
                  <span class="risk-value">{{ capa.riskAssessment.occurrence }}</span>
                </div>
                <div class="risk-item">
                  <span class="risk-label">Detection</span>
                  <span class="risk-value">{{ capa.riskAssessment.detection }}</span>
                </div>
                <div class="risk-item highlight">
                  <span class="risk-label">RPN</span>
                  <span class="risk-value">{{ capa.riskAssessment.rpn }}</span>
                </div>
                <div class="risk-item">
                  <span class="risk-label">Risk Level</span>
                  <span class="risk-level-badge" [ngClass]="capa.riskAssessment.riskLevel.toLowerCase()">
                    {{ capa.riskAssessment.riskLevel }}
                  </span>
                </div>
              </div>
              <p class="risk-justification">{{ capa.riskAssessment.justification }}</p>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Root Cause Analysis Tab -->
        <mat-tab label="Root Cause Analysis">
          <div class="tab-content">
            <mat-card class="info-card" *ngIf="capa.rootCauseAnalysis; else noRca">
              <h3>{{ formatRcaMethod(capa.rootCauseAnalysis.method) }}</h3>
              <p class="rca-description">{{ capa.rootCauseAnalysis.description }}</p>

              <div class="five-why-section" *ngIf="capa.rootCauseAnalysis.fiveWhyAnalysis">
                <h4>5-Why Analysis</h4>
                <div class="five-why-list">
                  <div class="why-item" *ngFor="let why of capa.rootCauseAnalysis.fiveWhyAnalysis">
                    <div class="why-level">Why {{ why.level }}</div>
                    <div class="why-content">
                      <div class="why-question">{{ why.question }}</div>
                      <div class="why-answer">{{ why.answer }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="root-causes-section">
                <h4>Identified Root Causes</h4>
                <ul class="cause-list">
                  <li *ngFor="let cause of capa.rootCauseAnalysis.rootCauses">{{ cause }}</li>
                </ul>
              </div>

              <div class="contributing-section" *ngIf="capa.rootCauseAnalysis.contributingFactors?.length">
                <h4>Contributing Factors</h4>
                <ul class="cause-list contributing">
                  <li *ngFor="let factor of capa.rootCauseAnalysis.contributingFactors">{{ factor }}</li>
                </ul>
              </div>
            </mat-card>

            <ng-template #noRca>
              <mat-card class="info-card empty-state">
                <mat-icon>psychology</mat-icon>
                <h3>Root Cause Analysis Not Started</h3>
                <p>Begin investigation to identify the root cause of this quality event.</p>
                <button mat-raised-button color="primary" [routerLink]="['../../rca', capa.id]">
                  Start RCA
                </button>
              </mat-card>
            </ng-template>
          </div>
        </mat-tab>

        <!-- Actions Tab -->
        <mat-tab label="Actions">
          <div class="tab-content">
            <mat-card class="info-card">
              <div class="section-header">
                <h3>Corrective Actions ({{ capa.correctiveActions.length }})</h3>
                <button mat-raised-button color="primary" *ngIf="capa.status === 'ACTION_PLANNING'" (click)="openAddActionDialog('CORRECTIVE')">
                  <mat-icon>add</mat-icon> Add Corrective Action
                </button>
              </div>
              <div class="actions-list" *ngIf="capa.correctiveActions.length; else noActions">
                <div class="action-item" *ngFor="let action of capa.correctiveActions">
                  <div class="action-header">
                    <span class="action-number">{{ action.actionNumber }}</span>
                    <span class="action-status" [ngClass]="action.status.toLowerCase()">
                      {{ action.status }}
                    </span>
                  </div>
                  <p class="action-desc">{{ action.description }}</p>
                  <div class="action-meta">
                    <span><mat-icon>person</mat-icon> {{ action.assignedToName }}</span>
                    <span><mat-icon>event</mat-icon> Due: {{ action.dueDate | date:'dd-MMM-yyyy' }}</span>
                    <span *ngIf="action.completedDate">
                      <mat-icon>check</mat-icon> Completed: {{ action.completedDate | date:'dd-MMM-yyyy' }}
                    </span>
                  </div>
                  <div class="action-buttons" *ngIf="capa.status === 'ACTION_IN_PROGRESS'">
                    <button mat-stroked-button color="primary" *ngIf="action.status === 'PENDING' || action.status === 'IN_PROGRESS'" (click)="completeAction(action)">
                      <mat-icon>check_circle</mat-icon> Complete
                    </button>
                    <button mat-stroked-button color="accent" *ngIf="action.status === 'COMPLETED'" (click)="verifyAction(action)">
                      <mat-icon>verified</mat-icon> Verify
                    </button>
                  </div>
                </div>
              </div>
            </mat-card>

            <mat-card class="info-card">
              <div class="section-header">
                <h3>Preventive Actions ({{ capa.preventiveActions.length }})</h3>
                <button mat-raised-button color="primary" *ngIf="capa.status === 'ACTION_PLANNING'" (click)="openAddActionDialog('PREVENTIVE')">
                  <mat-icon>add</mat-icon> Add Preventive Action
                </button>
              </div>
              <div class="actions-list" *ngIf="capa.preventiveActions.length; else noActions">
                <div class="action-item" *ngFor="let action of capa.preventiveActions">
                  <div class="action-header">
                    <span class="action-number">{{ action.actionNumber }}</span>
                    <span class="action-status" [ngClass]="action.status.toLowerCase()">
                      {{ action.status }}
                    </span>
                  </div>
                  <p class="action-desc">{{ action.description }}</p>
                  <div class="action-meta">
                    <span><mat-icon>person</mat-icon> {{ action.assignedToName }}</span>
                    <span><mat-icon>event</mat-icon> Due: {{ action.dueDate | date:'dd-MMM-yyyy' }}</span>
                    <span *ngIf="action.completedDate">
                      <mat-icon>check</mat-icon> Completed: {{ action.completedDate | date:'dd-MMM-yyyy' }}
                    </span>
                  </div>
                  <div class="action-buttons" *ngIf="capa.status === 'ACTION_IN_PROGRESS'">
                    <button mat-stroked-button color="primary" *ngIf="action.status === 'PENDING' || action.status === 'IN_PROGRESS'" (click)="completeAction(action)">
                      <mat-icon>check_circle</mat-icon> Complete
                    </button>
                    <button mat-stroked-button color="accent" *ngIf="action.status === 'COMPLETED'" (click)="verifyAction(action)">
                      <mat-icon>verified</mat-icon> Verify
                    </button>
                  </div>
                </div>
              </div>
            </mat-card>

            <ng-template #noActions>
              <div class="empty-actions">
                <p>No actions defined yet.</p>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <!-- Effectiveness Tab -->
        <mat-tab label="Effectiveness">
          <div class="tab-content">
            <mat-card class="info-card" *ngIf="capa.effectivenessCheck; else noEffectiveness">
              <h3>Effectiveness Verification</h3>
              <div class="effectiveness-content">
                <div class="info-row">
                  <span class="info-label">Criteria</span>
                  <span class="info-value">{{ capa.effectivenessCheck.criteria }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check Date</span>
                  <span class="info-value">{{ capa.effectivenessCheck.checkDate | date:'dd-MMM-yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Result</span>
                  <span class="effectiveness-result" [ngClass]="capa.effectivenessCheck.result.toLowerCase().replace(' ', '-')">
                    {{ capa.effectivenessCheck.result }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Evidence</span>
                  <span class="info-value">{{ capa.effectivenessCheck.evidence }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Verified By</span>
                  <span class="info-value">{{ capa.effectivenessCheck.verifiedBy }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Comments</span>
                  <span class="info-value">{{ capa.effectivenessCheck.comments }}</span>
                </div>
                <div class="info-row" *ngIf="capa.effectivenessCheck.requiresRecurrence">
                  <span class="info-label">Recurrence Check</span>
                  <span class="info-value">Every {{ capa.effectivenessCheck.recurrenceMonths }} months</span>
                </div>
              </div>
            </mat-card>

            <ng-template #noEffectiveness>
              <mat-card class="info-card empty-state">
                <mat-icon>verified</mat-icon>
                <h3>Effectiveness Check Not Yet Due</h3>
                <p>The effectiveness verification will be available after all actions are completed.</p>
                <button mat-raised-button color="primary" *ngIf="capa.status === 'EFFECTIVENESS_CHECK'" (click)="openEffectivenessDialog()">
                  <mat-icon>fact_check</mat-icon> Submit Effectiveness Check
                </button>
              </mat-card>
            </ng-template>
          </div>
        </mat-tab>

        <!-- Audit Trail Tab -->
        <mat-tab label="Audit Trail">
          <div class="tab-content">
            <mat-card class="info-card">
              <h3>Complete Audit History</h3>
              <div class="audit-trail">
                <div class="audit-entry" *ngFor="let entry of capa.auditTrail">
                  <div class="audit-timestamp">
                    {{ entry.timestamp | date:'dd-MMM-yyyy HH:mm' }}
                  </div>
                  <div class="audit-body">
                    <div class="audit-action">{{ entry.action }}</div>
                    <div class="audit-user">by {{ entry.userName }}</div>
                    <div class="audit-change" *ngIf="entry.field">
                      <span class="field-name">{{ entry.field }}:</span>
                      <span class="old-val" *ngIf="entry.oldValue">{{ entry.oldValue }}</span>
                      <mat-icon *ngIf="entry.oldValue">arrow_forward</mat-icon>
                      <span class="new-val" *ngIf="entry.newValue">{{ entry.newValue }}</span>
                    </div>
                    <div class="audit-comment" *ngIf="entry.comments">
                      {{ entry.comments }}
                    </div>
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
    .capa-detail {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-header h1 {
      font-size: 22px;
      font-weight: 600;
      color: #2C5F7C;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin: 2px 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-pill {
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pill.initiated { background: #fff3e0; color: #e65100; }
    .status-pill.under-review { background: #e3f2fd; color: #1565c0; }
    .status-pill.investigation { background: #ED8B00; color: #fff; }
    .status-pill.root-cause-identified { background: #f3e5f5; color: #6a1b9a; }
    .status-pill.action-planning { background: #fff8e1; color: #f57f17; }
    .status-pill.action-in-progress { background: #D4760A; color: #fff; }
    .status-pill.effectiveness-check { background: #2C5F7C; color: #fff; }
    .status-pill.pending-closure { background: #388E3C; color: #fff; }
    .status-pill.closed { background: #666; color: #fff; }
    .status-pill.rejected { background: #c62828; color: #fff; }

    .workflow-actions-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .wf-btn {
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .wf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .wf-btn-primary { background: #2C5F7C; color: #fff; }
    .wf-btn-primary:hover:not(:disabled) { background: #1e4a61; }
    .wf-btn-danger { background: #fff; color: #c62828; border-color: #c62828; }
    .wf-btn-danger:hover:not(:disabled) { background: #ffebee; }
    .wf-btn-secondary { background: #fff; color: #2C5F7C; border-color: #2C5F7C; }
    .wf-btn-secondary:hover:not(:disabled) { background: #e8f4f8; }

    .priority-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #fff8e1; color: #f57f17; }
    .priority-badge.low { background: #e8f5e9; color: #2e7d32; }

    .workflow-card {
      margin-bottom: 20px;
    }

    .workflow-stepper {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding: 16px 0;
    }

    .workflow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 100px;
      padding: 8px;
      position: relative;
    }

    .workflow-step::after {
      content: '';
      position: absolute;
      top: 20px;
      right: -2px;
      width: 4px;
      height: 2px;
      background: #ddd;
    }

    .workflow-step:last-child::after {
      display: none;
    }

    .workflow-step.completed .step-indicator { color: #2C5F7C; }
    .workflow-step.current .step-indicator { color: #ED8B00; animation: pulse-step 1.5s ease-in-out infinite; }
    @keyframes pulse-step { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .workflow-step.pending .step-indicator { color: #bdbdbd; }

    .step-indicator mat-icon {
      font-size: 24px;
    }

    .step-content {
      text-align: center;
      margin-top: 4px;
    }

    .step-name {
      font-size: 11px;
      font-weight: 500;
      color: #333;
      display: block;
    }

    .step-date {
      font-size: 10px;
      color: #888;
      display: block;
    }

    .step-assignee {
      font-size: 10px;
      color: #666;
      display: block;
    }

    .tab-content {
      padding: 20px 0;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-card {
      padding: 20px;
      margin-bottom: 16px;
    }

    .info-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
      color: #333;
    }

    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .info-label {
      font-size: 13px;
      color: #666;
      min-width: 160px;
      font-weight: 500;
    }

    .info-value {
      font-size: 13px;
      color: #333;
    }

    .info-value.link {
      color: #2C5F7C;
      cursor: pointer;
    }

    .overdue {
      color: #d32f2f;
      font-weight: 600;
    }

    .description-text {
      font-size: 14px;
      line-height: 1.6;
      color: #444;
    }

    .risk-grid {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .risk-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .risk-label {
      font-size: 12px;
      color: #666;
    }

    .risk-value {
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }

    .risk-item.highlight .risk-value {
      color: #d32f2f;
    }

    .risk-level-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .risk-level-badge.high { background: #ffebee; color: #c62828; }
    .risk-level-badge.critical { background: #ffebee; color: #b71c1c; }
    .risk-level-badge.medium { background: #fff8e1; color: #f57f17; }
    .risk-level-badge.low { background: #e8f5e9; color: #2e7d32; }

    .risk-justification {
      font-size: 13px;
      color: #555;
      font-style: italic;
      margin-top: 8px;
    }

    .five-why-section {
      margin: 16px 0;
    }

    .five-why-section h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .five-why-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .why-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 3px solid #ED8B00;
    }

    .why-level {
      font-size: 12px;
      font-weight: 600;
      color: #ED8B00;
      min-width: 50px;
    }

    .why-question {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .why-answer {
      font-size: 13px;
      color: #555;
    }

    .cause-list {
      padding-left: 20px;
    }

    .cause-list li {
      padding: 4px 0;
      font-size: 13px;
      color: #444;
    }

    .cause-list.contributing li {
      color: #666;
    }

    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-item {
      padding: 16px;
      border: 1px solid #eee;
      border-radius: 8px;
    }

    .action-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .action-number {
      font-weight: 600;
      font-size: 13px;
      color: #2C5F7C;
    }

    .action-status {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .action-status.completed { background: #e8f5e9; color: #2e7d32; }
    .action-status.in_progress { background: #e3f2fd; color: #1565c0; }
    .action-status.pending { background: #f5f5f5; color: #666; }
    .action-status.verified { background: #e8f5e9; color: #1b5e20; }
    .action-status.overdue { background: #ffebee; color: #c62828; }

    .action-desc {
      font-size: 13px;
      color: #444;
      margin: 0 0 8px;
    }

    .action-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #666;
    }

    .action-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .action-meta mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .effectiveness-result {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .effectiveness-result.effective { background: #e8f5e9; color: #2e7d32; }
    .effectiveness-result.not_effective { background: #ffebee; color: #c62828; }
    .effectiveness-result.partially_effective { background: #fff8e1; color: #f57f17; }

    .audit-trail {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .audit-entry {
      display: flex;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .audit-timestamp {
      font-size: 12px;
      color: #888;
      min-width: 130px;
      white-space: nowrap;
    }

    .audit-body {
      flex: 1;
    }

    .audit-action {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    .audit-user {
      font-size: 12px;
      color: #666;
    }

    .audit-change {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .audit-change mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .field-name { color: #666; }
    .old-val { color: #d32f2f; text-decoration: line-through; }
    .new-val { color: #2e7d32; }

    .audit-comment {
      font-size: 12px;
      color: #555;
      font-style: italic;
      margin-top: 4px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #f0f0f0;
    }

    .action-buttons button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bbb;
    }

    .empty-state h3 {
      color: #666;
    }

    .empty-state p {
      color: #888;
      margin-bottom: 16px;
    }

    .overlay-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4); z-index: 1000;
    }
    .overlay-form {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border-radius: 12px; padding: 24px; z-index: 1001;
      width: 520px; max-width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .overlay-form h3 { margin: 0 0 16px; }
    .overlay-form .form-row {
      display: flex; gap: 12px;
    }
    .overlay-form .form-row mat-form-field { flex: 1; }
    .overlay-form .full-width { width: 100%; }
    .overlay-form .rpn-display {
      margin: -8px 0 12px; font-size: 14px; color: #555;
    }
    .overlay-form .form-actions {
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }
    }
  `],
})
export class CapaDetailComponent implements OnInit {
  capa: Capa | null = null;
  actionInProgress = false;
  riskFormVisible = false;
  riskSubmitting = false;
  riskForm = { severity: 3, occurrence: 3, detection: 3, justification: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private capaService: CapaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.capaService.getCapaById(id).subscribe((data) => {
        this.capa = data || null;
      });
    }
  }

  backToList(): void {
    this.router.navigate(['/capa/list']);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStatusClass(status: CapaStatus): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  formatType(type: string): string {
    const typeMap: Record<string, string> = {
      'CORRECTIVE': 'Corrective',
      'PREVENTIVE': 'Preventive',
      'BOTH': 'Corrective & Preventive',
      'CORRECTIVE_AND_PREVENTIVE': 'Corrective & Preventive',
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatSource(source: string): string {
    return source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatRcaMethod(method: string): string {
    return method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) + ' Analysis';
  }

  isOverdue(): boolean {
    return (
      this.capa !== null &&
      this.capa.status !== CapaStatus.CLOSED &&
      new Date(this.capa.dueDate) < new Date()
    );
  }

  getAvailableActions(): WorkflowAction[] {
    if (!this.capa) return [];
    const roles = getUserRoleCodes();
    const allActions: Record<string, WorkflowAction[]> = {
      [CapaStatus.INITIATED]: [
        { label: 'Submit for Review', targetStatus: CapaStatus.UNDER_REVIEW, type: 'primary',
          requiredRoles: ['OWNER', 'END_USER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.UNDER_REVIEW]: [
        { label: 'Approve & Start Investigation', targetStatus: CapaStatus.INVESTIGATION, type: 'primary',
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reject', targetStatus: CapaStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.INVESTIGATION]: [
        { label: 'Submit Root Cause', targetStatus: CapaStatus.ROOT_CAUSE_IDENTIFIED, type: 'primary',
          requiredRoles: ['OWNER', 'REVIEWER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Return for Rework', targetStatus: CapaStatus.INITIATED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.ROOT_CAUSE_IDENTIFIED]: [
        { label: 'Proceed to Action Planning', targetStatus: CapaStatus.ACTION_PLANNING, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.ACTION_PLANNING]: [
        { label: 'Start Action Execution', targetStatus: CapaStatus.ACTION_IN_PROGRESS, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.ACTION_IN_PROGRESS]: [
        { label: 'Complete Actions & Verify', targetStatus: CapaStatus.EFFECTIVENESS_CHECK, type: 'primary',
          requiredRoles: ['OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.EFFECTIVENESS_CHECK]: [
        { label: 'Approve Effectiveness', targetStatus: CapaStatus.PENDING_CLOSURE, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_APPROVER', 'VAULT_ADMIN'] },
        { label: 'Reopen Actions', targetStatus: CapaStatus.ACTION_PLANNING, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] },
      ],
      [CapaStatus.PENDING_CLOSURE]: [
        { label: 'Close CAPA', targetStatus: CapaStatus.CLOSED, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_APPROVER', 'VAULT_ADMIN'] },
      ],
    };
    const actions = allActions[this.capa.status] || [];
    return actions.filter(a => !a.requiredRoles || a.requiredRoles.some(r => roles.includes(r)));
  }

  executeWorkflowAction(action: WorkflowAction): void {
    if (!this.capa) return;

    // Intercept transitions that need dedicated API calls
    if (action.targetStatus === CapaStatus.ACTION_IN_PROGRESS) {
      this.actionInProgress = true;
      this.capaService.startActionExecution(this.capa.id).subscribe({
        next: () => {
          this.actionInProgress = false;
          this.snackBar.open('Action execution started', 'OK', { duration: 3000 });
          this.reloadCapa();
        },
        error: (err) => {
          this.actionInProgress = false;
          const msg = err.error?.message || err.error?.error || 'Failed to start action execution';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
      return;
    }

    if (action.targetStatus === CapaStatus.EFFECTIVENESS_CHECK && this.capa.status === CapaStatus.ACTION_IN_PROGRESS) {
      this.actionInProgress = true;
      this.capaService.completeActionExecution(this.capa.id).subscribe({
        next: () => {
          this.actionInProgress = false;
          this.snackBar.open('Action execution completed', 'OK', { duration: 3000 });
          this.reloadCapa();
        },
        error: (err) => {
          this.actionInProgress = false;
          const msg = err.error?.message || err.error?.error || 'Failed to complete action execution';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
      return;
    }

    if (action.targetStatus === CapaStatus.ACTION_PLANNING && this.capa.status === CapaStatus.ROOT_CAUSE_IDENTIFIED) {
      // Need risk assessment before proceeding to action planning
      this.openRiskAssessmentForm();
      return;
    }

    if (action.requiresESign) {
      const dialogRef = this.dialog.open(ESignatureDialogComponent, {
        width: '480px',
        disableClose: true,
        data: {
          recordNumber: this.capa.capaNumber,
          action: action.label,
          meaning: `I confirm the ${action.label.toLowerCase()} for ${this.capa.capaNumber}`,
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

  private performStatusChange(targetStatus: CapaStatus, comments?: string): void {
    if (!this.capa) return;
    this.actionInProgress = true;
    this.capaService.updateCapaStatus(this.capa.id, targetStatus, comments).subscribe({
      next: (updated) => {
        this.actionInProgress = false;
        if (updated) this.capa = updated;
        this.snackBar.open('Status updated successfully', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.actionInProgress = false;
        const msg = err.error?.message || err.error?.error || 'Failed to update status. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }

  private reloadCapa(): void {
    if (!this.capa) return;
    this.capaService.getCapaById(this.capa.id).subscribe((full) => {
      if (full) this.capa = full;
    });
  }

  openRiskAssessmentForm(): void {
    this.riskForm = { severity: 3, occurrence: 3, detection: 3, justification: '' };
    this.riskFormVisible = true;
  }

  cancelRiskForm(): void {
    this.riskFormVisible = false;
  }

  computeRiskLevel(): string {
    const rpn = this.riskForm.severity * this.riskForm.occurrence * this.riskForm.detection;
    if (rpn >= 60) return 'CRITICAL';
    if (rpn >= 30) return 'HIGH';
    if (rpn >= 10) return 'MEDIUM';
    return 'LOW';
  }

  submitRiskForm(): void {
    if (!this.capa) return;
    this.riskSubmitting = true;
    const payload = {
      severity: this.riskForm.severity,
      occurrence: this.riskForm.occurrence,
      detection: this.riskForm.detection,
      riskLevel: this.computeRiskLevel(),
      justification: this.riskForm.justification,
    };
    this.capaService.submitRiskAssessment(this.capa.id, payload).subscribe({
      next: () => {
        this.riskSubmitting = false;
        this.riskFormVisible = false;
        this.snackBar.open('Risk assessment submitted, proceeding to Action Planning', 'OK', { duration: 3000 });
        this.reloadCapa();
      },
      error: (err) => {
        this.riskSubmitting = false;
        const msg = err.error?.message || err.error?.error || 'Failed to submit risk assessment';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }

  openAddActionDialog(type: 'CORRECTIVE' | 'PREVENTIVE'): void {
    if (!this.capa) return;
    const dialogRef = this.dialog.open(CapaActionDialogComponent, {
      width: '520px',
      data: { capaId: this.capa.id, actionType: type },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open(`${type === 'CORRECTIVE' ? 'Corrective' : 'Preventive'} action added`, 'OK', { duration: 3000 });
        this.reloadCapa();
      }
    });
  }

  completeAction(action: any): void {
    if (!this.capa) return;
    const evidence = prompt('Provide completion evidence:');
    if (evidence === null || !evidence.trim()) return;
    this.capaService.completeAction(this.capa.id, action.id, { evidence }).subscribe({
      next: () => {
        this.snackBar.open('Action marked as completed', 'OK', { duration: 3000 });
        this.reloadCapa();
      },
      error: (err) => {
        console.error('Complete action failed:', err);
        alert('Failed to complete action.');
      },
    });
  }

  verifyAction(action: any): void {
    if (!this.capa) return;
    const comments = prompt('Provide verification comments:');
    if (comments === null || !comments.trim()) return;
    this.capaService.verifyAction(this.capa.id, action.id, { verificationComments: comments }).subscribe({
      next: () => {
        this.snackBar.open('Action verified', 'OK', { duration: 3000 });
        this.reloadCapa();
      },
      error: (err) => {
        console.error('Verify action failed:', err);
        alert('Failed to verify action.');
      },
    });
  }

  openEffectivenessDialog(): void {
    if (!this.capa) return;
    const dialogRef = this.dialog.open(CapaEffectivenessDialogComponent, {
      width: '560px',
      data: { capaId: this.capa.id },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Effectiveness check submitted', 'OK', { duration: 3000 });
        this.reloadCapa();
      }
    });
  }
}
