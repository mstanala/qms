import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { RiskService, RiskRegister, RiskAssessment, RiskControl, WorkflowStep } from '../../services/risk.service';

@Component({
  selector: 'qms-risk-register-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatChipsModule, MatTableModule, MatMenuModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule,
    MatProgressBarModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="page" *ngIf="register">
      <div class="page-header">
        <div>
          <h1>{{ register.title }}</h1>
          <span class="subtitle">
            <mat-chip>{{ register.registerNumber }}</mat-chip>
            <mat-chip [class]="'chip-' + register.status.toLowerCase()">{{ label(register.status) }}</mat-chip>
            <mat-chip>{{ register.riskType }}</mat-chip>
            <mat-chip>{{ register.methodology }}</mat-chip>
          </span>
        </div>
        <div class="actions">
          <button mat-stroked-button routerLink="../../registers">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Overview -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Register Information</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Description</label><span>{{ register.description || '-' }}</span></div>
                <div><label>Scope</label><span>{{ register.scope || '-' }}</span></div>
                <div><label>Priority</label><span>{{ register.priority }}</span></div>
                <div><label>Review Frequency</label><span>{{ register.reviewFrequencyMonths }} months</span></div>
                <div><label>Current Step</label><span>{{ register.currentWorkflowStep || '-' }}</span></div>
                <div><label>Approved Date</label><span>{{ register.approvedDate ? (register.approvedDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Next Review</label><span>{{ register.nextReviewDate ? (register.nextReviewDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Created</label><span>{{ register.createdAt | date:'medium' }}</span></div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Risk Workflow -->
        <mat-tab label="Risk Workflow">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Risk Management Workflow</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="qual-status">
                  <div><label>Current Status</label><mat-chip [class]="'chip-' + register.status.toLowerCase()">{{ label(register.status) }}</mat-chip></div>
                  <div><label>Current Step</label><span>{{ register.currentWorkflowStep || 'Not Started' }}</span></div>
                </div>
                <mat-divider style="margin:16px 0"></mat-divider>

                <div class="qual-steps">
                  <!-- Step 1: Draft / Identify Risks -->
                  <div class="qual-step" [class.completed]="isStepComplete('DRAFT')" [class.current]="isStepCurrent('DRAFT')">
                    <mat-icon>{{ getStepIcon('DRAFT') }}</mat-icon>
                    <div>
                      <strong>Step 1: Identify & Assess Risks</strong>
                      <p>Add risk assessments with hazard identification and initial scoring (S x O x D).</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('DRAFT')">
                      <button mat-raised-button color="primary" (click)="submitForAssessment()" [disabled]="transitioning || assessments.length === 0">
                        <mat-icon>send</mat-icon> Submit for Evaluation
                      </button>
                      <span class="hint" *ngIf="assessments.length === 0">Add at least one assessment first</span>
                    </div>
                  </div>

                  <!-- Step 2: Risk Evaluation -->
                  <div class="qual-step" [class.completed]="isStepComplete('RISK_EVALUATION')" [class.current]="isStepCurrent('RISK_EVALUATION')">
                    <mat-icon>{{ getStepIcon('RISK_EVALUATION') }}</mat-icon>
                    <div>
                      <strong>Step 2: Risk Evaluation & Prioritization</strong>
                      <p>QA Reviewer evaluates risks using {{ register.methodology }} methodology.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('RISK_EVALUATION')">
                      <button mat-raised-button color="primary" (click)="completeEvaluation()" [disabled]="transitioning">
                        <mat-icon>check</mat-icon> Evaluation Complete
                      </button>
                    </div>
                  </div>

                  <!-- Step 3: Control Planning -->
                  <div class="qual-step" [class.completed]="isStepComplete('CONTROL_PLANNING')" [class.current]="isStepCurrent('CONTROL_PLANNING')">
                    <mat-icon>{{ getStepIcon('CONTROL_PLANNING') }}</mat-icon>
                    <div>
                      <strong>Step 3: Control Planning</strong>
                      <p>Risk Owner defines preventive, detective, and corrective controls.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('CONTROL_PLANNING')">
                      <button mat-raised-button color="primary" (click)="completeControlPlanning()" [disabled]="transitioning">
                        <mat-icon>check</mat-icon> Controls Planned - Proceed to Implementation
                      </button>
                    </div>
                  </div>

                  <!-- Step 4: Control Implementation -->
                  <div class="qual-step" [class.completed]="isStepComplete('CONTROL_IMPL')" [class.current]="isStepCurrent('CONTROL_IMPL')">
                    <mat-icon>{{ getStepIcon('CONTROL_IMPL') }}</mat-icon>
                    <div>
                      <strong>Step 4: Control Implementation</strong>
                      <p>Implement controls, collect evidence, and mark controls as implemented.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('CONTROL_IMPL')">
                      <button mat-raised-button color="primary" (click)="completeImplementation()" [disabled]="transitioning">
                        <mat-icon>check</mat-icon> Implementation Complete - Submit for Residual Review
                      </button>
                    </div>
                  </div>

                  <!-- Step 5: Residual Risk Review -->
                  <div class="qual-step" [class.completed]="isStepComplete('RESIDUAL_REVIEW')" [class.current]="isStepCurrent('RESIDUAL_REVIEW')">
                    <mat-icon>{{ getStepIcon('RESIDUAL_REVIEW') }}</mat-icon>
                    <div>
                      <strong>Step 5: Residual Risk Assessment</strong>
                      <p>QA re-scores risks with controls applied and verifies control effectiveness.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('RESIDUAL_REVIEW')">
                      <button mat-raised-button color="primary" (click)="acceptResidualRisk()" [disabled]="transitioning">
                        <mat-icon>check_circle</mat-icon> Residual Risk Acceptable
                      </button>
                      <button mat-raised-button color="warn" (click)="rejectResidualRisk()" [disabled]="transitioning">
                        <mat-icon>replay</mat-icon> Unacceptable - Additional Controls Needed
                      </button>
                    </div>
                  </div>

                  <!-- Step 6: Register Approval -->
                  <div class="qual-step" [class.completed]="isStepComplete('APPROVAL')" [class.current]="isStepCurrent('APPROVAL')">
                    <mat-icon>{{ getStepIcon('APPROVAL') }}</mat-icon>
                    <div>
                      <strong>Step 6: Register Approval</strong>
                      <p>QA Approver reviews risk-benefit analysis and provides final approval with e-signature.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('APPROVAL')">
                      <button mat-raised-button color="primary" (click)="approveRegister()" [disabled]="transitioning">
                        <mat-icon>verified</mat-icon> Approve Risk Register
                      </button>
                    </div>
                  </div>

                  <!-- Final: Approved -->
                  <div class="qual-step" [class.completed]="register.status === 'APPROVED'">
                    <mat-icon>{{ register.status === 'APPROVED' ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <div>
                      <strong>Approved</strong>
                      <p>Risk register is approved. Periodic reviews will be scheduled per review frequency.</p>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 3: Risk Assessments -->
        <mat-tab label="Assessments ({{ assessments.length }})">
          <div class="tab-content">
            <!-- Add Assessment Form (only when DRAFT or IN_ASSESSMENT) -->
            <mat-card *ngIf="canAddAssessment()">
              <mat-card-header><mat-card-title>Add Risk Assessment</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Hazard Description</mat-label>
                    <textarea matInput [(ngModel)]="newAssessment.hazardDescription" rows="2"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Harm Description</mat-label>
                    <textarea matInput [(ngModel)]="newAssessment.harmDescription" rows="2"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Risk Category</mat-label>
                    <mat-select [(ngModel)]="newAssessment.riskCategory">
                      <mat-option *ngFor="let c of riskCategories" [value]="c">{{ c }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Process Step</mat-label>
                    <input matInput [(ngModel)]="newAssessment.processStep">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Severity (1-5)</mat-label>
                    <input matInput type="number" [(ngModel)]="newAssessment.initialSeverity" min="1" max="5">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Occurrence (1-5)</mat-label>
                    <input matInput type="number" [(ngModel)]="newAssessment.initialOccurrence" min="1" max="5">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Detectability (1-5)</mat-label>
                    <input matInput type="number" [(ngModel)]="newAssessment.initialDetectability" min="1" max="5">
                  </mat-form-field>
                </div>
                <div class="rpn-preview" *ngIf="newAssessment.initialSeverity && newAssessment.initialOccurrence && newAssessment.initialDetectability">
                  RPN = {{ newAssessment.initialSeverity * newAssessment.initialOccurrence * newAssessment.initialDetectability }}
                  ({{ getRiskLevel(newAssessment.initialSeverity * newAssessment.initialOccurrence * newAssessment.initialDetectability) }})
                </div>
                <button mat-raised-button color="primary" (click)="addAssessment()" [disabled]="!newAssessment.hazardDescription || !newAssessment.initialSeverity">
                  <mat-icon>add</mat-icon> Add Assessment
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Assessments List -->
            <mat-card *ngFor="let a of assessments" class="assessment-card">
              <mat-card-header>
                <mat-card-title>{{ a.assessmentNumber }}</mat-card-title>
                <mat-card-subtitle>{{ a.hazardDescription }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div><label>Harm</label><span>{{ a.harmDescription || '-' }}</span></div>
                  <div><label>Category</label><span>{{ a.riskCategory || '-' }}</span></div>
                  <div><label>Process Step</label><span>{{ a.processStep || '-' }}</span></div>
                  <div><label>Status</label><span>{{ a.status }}</span></div>
                  <div>
                    <label>Initial Risk (S x O x D)</label>
                    <span>{{ a.initialSeverity }} x {{ a.initialOccurrence }} x {{ a.initialDetectability }} = {{ a.initialSeverity * a.initialOccurrence * a.initialDetectability }}</span>
                  </div>
                  <div>
                    <label>Initial Level</label>
                    <mat-chip [class]="'level-' + (a.initialRiskLevel || '').toLowerCase()">{{ a.initialRiskLevel }}</mat-chip>
                  </div>
                  <div *ngIf="a.residualRiskLevel">
                    <label>Residual Risk (S x O x D)</label>
                    <span>{{ a.residualSeverity }} x {{ a.residualOccurrence }} x {{ a.residualDetectability }} = {{ a.residualSeverity! * a.residualOccurrence! * a.residualDetectability! }}</span>
                  </div>
                  <div *ngIf="a.residualRiskLevel">
                    <label>Residual Level</label>
                    <mat-chip [class]="'level-' + a.residualRiskLevel.toLowerCase()">{{ a.residualRiskLevel }}</mat-chip>
                  </div>
                  <div *ngIf="a.riskAcceptance"><label>Acceptance</label><span>{{ a.riskAcceptance }}</span></div>
                  <div *ngIf="a.justification"><label>Justification</label><span>{{ a.justification }}</span></div>
                </div>

                <!-- Evaluation form (during RISK_EVALUATION step) -->
                <div class="inline-form" *ngIf="isStepCurrent('RISK_EVALUATION')">
                  <mat-divider style="margin:12px 0"></mat-divider>
                  <strong>Evaluate this risk:</strong>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Risk Acceptance</mat-label>
                      <mat-select [(ngModel)]="evaluationData[a.id].riskAcceptance">
                        <mat-option value="ACCEPTABLE">Acceptable</mat-option>
                        <mat-option value="ACCEPTABLE_WITH_CONTROLS">Acceptable with Controls</mat-option>
                        <mat-option value="UNACCEPTABLE">Unacceptable</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Justification</mat-label>
                      <input matInput [(ngModel)]="evaluationData[a.id].justification">
                    </mat-form-field>
                    <button mat-raised-button color="accent" (click)="evaluateAssessment(a)" [disabled]="!evaluationData[a.id].riskAcceptance">
                      <mat-icon>save</mat-icon> Save
                    </button>
                  </div>
                </div>

                <!-- Residual risk form (during RESIDUAL_REVIEW step) -->
                <div class="inline-form" *ngIf="isStepCurrent('RESIDUAL_REVIEW')">
                  <mat-divider style="margin:12px 0"></mat-divider>
                  <strong>Residual Risk Scoring:</strong>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Residual Severity (1-5)</mat-label>
                      <input matInput type="number" [(ngModel)]="residualData[a.id].residualSeverity" min="1" max="5">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Residual Occurrence (1-5)</mat-label>
                      <input matInput type="number" [(ngModel)]="residualData[a.id].residualOccurrence" min="1" max="5">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Residual Detectability (1-5)</mat-label>
                      <input matInput type="number" [(ngModel)]="residualData[a.id].residualDetectability" min="1" max="5">
                    </mat-form-field>
                    <button mat-raised-button color="accent" (click)="saveResidualRisk(a)" [disabled]="!residualData[a.id].residualSeverity">
                      <mat-icon>save</mat-icon> Save
                    </button>
                  </div>
                </div>

                <!-- Controls section -->
                <mat-divider style="margin:12px 0"></mat-divider>
                <div class="controls-section">
                  <strong>Controls ({{ getControls(a.id).length }})</strong>
                  <div *ngFor="let ctrl of getControls(a.id)" class="control-item">
                    <div class="control-header">
                      <mat-chip>{{ ctrl.controlNumber }}</mat-chip>
                      <mat-chip>{{ ctrl.controlType }}</mat-chip>
                      <mat-chip [class]="'ctrl-' + ctrl.status.toLowerCase()">{{ ctrl.status }}</mat-chip>
                    </div>
                    <p>{{ ctrl.description }}</p>
                    <div class="control-actions" *ngIf="canManageControls()">
                      <button mat-stroked-button *ngIf="ctrl.status === 'PLANNED'" (click)="implementControl(ctrl)">
                        <mat-icon>play_arrow</mat-icon> Mark Implemented
                      </button>
                      <button mat-stroked-button *ngIf="ctrl.status === 'IMPLEMENTED' && isStepCurrent('RESIDUAL_REVIEW')" (click)="verifyControl(ctrl)">
                        <mat-icon>verified</mat-icon> Verify
                      </button>
                    </div>
                    <div class="form-row" *ngIf="ctrl.status === 'IMPLEMENTED' && isStepCurrent('RESIDUAL_REVIEW')">
                      <mat-form-field appearance="outline">
                        <mat-label>Effectiveness</mat-label>
                        <mat-select [(ngModel)]="verifyData[ctrl.id]">
                          <mat-option value="EFFECTIVE">Effective</mat-option>
                          <mat-option value="PARTIALLY_EFFECTIVE">Partially Effective</mat-option>
                          <mat-option value="NOT_EFFECTIVE">Not Effective</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                  </div>

                  <!-- Add Control (during CONTROL_PLANNING or CONTROL_IMPLEMENTATION) -->
                  <div *ngIf="canAddControls()" class="add-control-form">
                    <mat-divider style="margin:8px 0"></mat-divider>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Control Type</mat-label>
                        <mat-select [(ngModel)]="newControl[a.id].controlType">
                          <mat-option value="PREVENTIVE">Preventive</mat-option>
                          <mat-option value="DETECTIVE">Detective</mat-option>
                          <mat-option value="CORRECTIVE">Corrective</mat-option>
                          <mat-option value="DESIGN">Design</mat-option>
                          <mat-option value="PROCEDURAL">Procedural</mat-option>
                          <mat-option value="MONITORING">Monitoring</mat-option>
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline" style="flex:2">
                        <mat-label>Description</mat-label>
                        <input matInput [(ngModel)]="newControl[a.id].description">
                      </mat-form-field>
                      <button mat-raised-button color="accent" (click)="addControl(a)" [disabled]="!newControl[a.id].controlType || !newControl[a.id].description">
                        <mat-icon>add</mat-icon> Add Control
                      </button>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <p class="empty" *ngIf="assessments.length === 0">No risk assessments added yet.</p>
          </div>
        </mat-tab>

        <!-- Tab 4: Workflow History -->
        <mat-tab label="Workflow History">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Workflow History</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="timeline" *ngIf="workflowHistory.length">
                  <div class="timeline-item" *ngFor="let step of workflowHistory"
                       [class.completed]="step.status === 'COMPLETED'"
                       [class.current]="step.status === 'CURRENT'">
                    <div class="timeline-icon">
                      <mat-icon *ngIf="step.status === 'COMPLETED'">check_circle</mat-icon>
                      <mat-icon *ngIf="step.status === 'CURRENT'" color="primary">pending</mat-icon>
                      <mat-icon *ngIf="step.status !== 'COMPLETED' && step.status !== 'CURRENT'">radio_button_unchecked</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <strong>{{ step.stepName }}</strong>
                      <span class="meta" *ngIf="step.assignedTo">by {{ step.assignedTo.displayName }}</span>
                      <span class="meta" *ngIf="step.completedAt">{{ step.completedAt | date:'medium' }}</span>
                      <span class="meta" *ngIf="step.startedAt && !step.completedAt">Started: {{ step.startedAt | date:'medium' }}</span>
                      <p *ngIf="step.comments">{{ step.comments }}</p>
                    </div>
                  </div>
                </div>
                <p class="empty" *ngIf="!workflowHistory.length">No workflow history available.</p>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page{padding:24px}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:12px;flex-wrap:wrap}
    h1{margin:0;font-size:24px}
    .subtitle{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .actions{display:flex;gap:8px}
    .tab-content{padding:16px 0}
    mat-card{margin-bottom:16px}
    .info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
    .info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}
    .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px}
    .form-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:8px}
    .form-row mat-form-field{flex:1;min-width:160px}
    .rpn-preview{margin:8px 0 16px;padding:8px 16px;background:#f5f7fa;border-radius:4px;font-weight:500}
    .qual-status{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:8px}
    .qual-status label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}
    .qual-steps{display:flex;flex-direction:column;gap:16px}
    .qual-step{display:flex;align-items:flex-start;gap:16px;padding:12px;border-radius:8px;border:1px solid #e5e7eb}
    .qual-step.completed{background:#f0fdf4;border-color:#86efac}
    .qual-step.current{background:#eff6ff;border-color:#93c5fd}
    .qual-step mat-icon{font-size:28px;width:28px;height:28px;margin-top:2px}
    .qual-step.completed mat-icon{color:#16a34a}
    .qual-step.current mat-icon{color:#2563eb}
    .qual-step div{flex:1}
    .qual-step p{margin:4px 0 0;color:#667085;font-size:13px}
    .step-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}
    .hint{color:#667085;font-size:12px;font-style:italic}
    .assessment-card{margin-bottom:12px}
    .controls-section{margin-top:8px}
    .control-item{padding:8px 0;border-bottom:1px solid #f0f0f0}
    .control-item:last-child{border-bottom:none}
    .control-header{display:flex;gap:8px;align-items:center;margin-bottom:4px}
    .control-item p{margin:4px 0;font-size:13px;color:#374151}
    .control-actions{margin-top:4px}
    .inline-form{margin-top:8px}
    .add-control-form{margin-top:8px}
    .empty{padding:16px;color:#667085}
    .timeline{display:flex;flex-direction:column}
    .timeline-item{display:flex;gap:12px;padding:12px 0;border-left:3px solid #e5e7eb;margin-left:14px;padding-left:20px;position:relative}
    .timeline-item.completed{border-left-color:#86efac}
    .timeline-item.current{border-left-color:#93c5fd}
    .timeline-icon{position:absolute;left:-16px;background:#fff}
    .timeline-icon mat-icon{font-size:24px;width:24px;height:24px}
    .timeline-content{flex:1}
    .timeline-content .meta{display:block;font-size:12px;color:#667085}
    .timeline-content p{margin:4px 0 0;font-size:13px;color:#374151}
    .chip-draft{background:#e0e0e0!important}
    .chip-in_assessment{background:#fff9c4!important;color:#f57f17!important}
    .chip-evaluation{background:#e3f2fd!important;color:#1565c0!important}
    .chip-control_implementation{background:#fff3e0!important;color:#e65100!important}
    .chip-residual_risk_review{background:#f3e5f5!important;color:#7b1fa2!important}
    .chip-pending_approval{background:#e8eaf6!important;color:#283593!important}
    .chip-approved{background:#c8e6c9!important;color:#2e7d32!important}
    .chip-closed{background:#eceff1!important;color:#546e7a!important}
    .level-critical{background:#d32f2f!important;color:white!important}
    .level-high{background:#f57c00!important;color:white!important}
    .level-medium{background:#fbc02d!important}
    .level-low{background:#388e3c!important;color:white!important}
    .ctrl-planned{background:#e3f2fd!important}
    .ctrl-in_progress{background:#fff9c4!important}
    .ctrl-implemented{background:#c8e6c9!important}
    .ctrl-verified{background:#a5d6a7!important}
    .ctrl-ineffective{background:#ffcdd2!important}
  `],
})
export class RiskRegisterDetailComponent implements OnInit {
  register: RiskRegister | null = null;
  assessments: RiskAssessment[] = [];
  controlsMap: Record<string, RiskControl[]> = {};
  workflowHistory: WorkflowStep[] = [];
  transitioning = false;

  riskCategories = ['SAFETY', 'QUALITY', 'REGULATORY', 'ENVIRONMENTAL', 'OPERATIONAL', 'FINANCIAL'];

  newAssessment = this.emptyAssessment();
  evaluationData: Record<string, { riskAcceptance: string; justification: string }> = {};
  residualData: Record<string, { residualSeverity: number; residualOccurrence: number; residualDetectability: number }> = {};
  newControl: Record<string, { controlType: string; description: string }> = {};
  verifyData: Record<string, string> = {};

  private readonly stepOrder = ['DRAFT', 'RISK_EVALUATION', 'CONTROL_PLANNING', 'CONTROL_IMPL', 'RESIDUAL_REVIEW', 'APPROVAL'];

  private readonly workflowStepMap: Record<string, string> = {
    'Draft': 'DRAFT',
    'Risk Evaluation': 'RISK_EVALUATION',
    'Control Planning': 'CONTROL_PLANNING',
    'Control Implementation': 'CONTROL_IMPL',
    'Residual Risk Review': 'RESIDUAL_REVIEW',
    'Register Approval': 'APPROVAL',
    'Approved': 'APPROVED',
  };

  constructor(
    private route: ActivatedRoute,
    private riskService: RiskService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.riskService.getRegister(id).subscribe((r) => {
      this.register = r;
    });
    this.riskService.listAssessments(id).subscribe((a) => {
      this.assessments = a;
      this.initFormsForAssessments();
      a.forEach((assessment) => {
        this.riskService.listControls(assessment.id).subscribe((ctrls) => {
          this.controlsMap[assessment.id] = ctrls;
          ctrls.forEach((c) => { if (!this.verifyData[c.id]) this.verifyData[c.id] = ''; });
        });
      });
    });
    this.riskService.getWorkflowHistory(id).subscribe(
      (h) => this.workflowHistory = h,
      () => this.workflowHistory = [],
    );
  }

  private initFormsForAssessments(): void {
    this.assessments.forEach((a) => {
      if (!this.evaluationData[a.id]) {
        this.evaluationData[a.id] = { riskAcceptance: a.riskAcceptance || '', justification: a.justification || '' };
      }
      if (!this.residualData[a.id]) {
        this.residualData[a.id] = {
          residualSeverity: a.residualSeverity || a.initialSeverity,
          residualOccurrence: a.residualOccurrence || a.initialOccurrence,
          residualDetectability: a.residualDetectability || a.initialDetectability,
        };
      }
      if (!this.newControl[a.id]) {
        this.newControl[a.id] = { controlType: '', description: '' };
      }
    });
  }

  // ─── Step Tracker ────────────────────────────────────────────────────────────

  private getCurrentStep(): string {
    if (!this.register) return '';
    if (this.register.currentWorkflowStep) {
      const mapped = this.workflowStepMap[this.register.currentWorkflowStep];
      if (mapped) return mapped;
    }
    return '';
  }

  isStepComplete(step: string): boolean {
    if (!this.register) return false;
    if (this.register.status === 'APPROVED' || this.register.status === 'CLOSED') return true;
    const currentStep = this.getCurrentStep();
    const currentIdx = this.stepOrder.indexOf(currentStep);
    const stepIdx = this.stepOrder.indexOf(step);
    if (currentIdx < 0 || stepIdx < 0) return false;
    return stepIdx < currentIdx;
  }

  isStepCurrent(step: string): boolean {
    if (!this.register) return false;
    if (this.register.status === 'APPROVED' || this.register.status === 'CLOSED') return false;
    return this.getCurrentStep() === step;
  }

  getStepIcon(step: string): string {
    if (this.isStepComplete(step)) return 'check_circle';
    if (this.isStepCurrent(step)) return 'radio_button_checked';
    return 'radio_button_unchecked';
  }

  canAddAssessment(): boolean {
    return !!this.register && ['DRAFT', 'IN_ASSESSMENT'].includes(this.register.status);
  }

  canAddControls(): boolean {
    return !!this.register && ['EVALUATION', 'CONTROL_IMPLEMENTATION'].includes(this.register.status);
  }

  canManageControls(): boolean {
    return !!this.register && ['EVALUATION', 'CONTROL_IMPLEMENTATION', 'RESIDUAL_RISK_REVIEW'].includes(this.register.status);
  }

  // ─── Workflow Transition Actions ─────────────────────────────────────────────

  submitForAssessment(): void {
    this.doTransition('IN_ASSESSMENT', 'Submitted for risk evaluation');
  }

  completeEvaluation(): void {
    this.doTransition('EVALUATION', 'Risk evaluation completed');
  }

  completeControlPlanning(): void {
    this.doTransition('CONTROL_IMPLEMENTATION', 'Controls planned, proceeding to implementation');
  }

  completeImplementation(): void {
    this.doTransition('RESIDUAL_RISK_REVIEW', 'Implementation complete, submitted for residual risk review');
  }

  acceptResidualRisk(): void {
    this.doTransition('PENDING_APPROVAL', 'Residual risk accepted, submitted for approval');
  }

  rejectResidualRisk(): void {
    if (!this.register) return;
    this.transitioning = true;
    this.riskService.transitionStatus(this.register.id, 'BACK_TO_CONTROL', { comments: 'Additional controls needed' }).subscribe({
      next: () => { this.transitioning = false; this.snackBar.open('Looped back for additional controls', 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
    });
  }

  approveRegister(): void {
    this.doTransition('APPROVED', 'Risk register approved');
  }

  private doTransition(status: string, successMsg: string): void {
    if (!this.register) return;
    this.transitioning = true;
    this.riskService.transitionStatus(this.register.id, status).subscribe({
      next: () => { this.transitioning = false; this.snackBar.open(successMsg, 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
    });
  }

  // ─── Assessment Actions ─────────────────────────────────────────────────────

  addAssessment(): void {
    if (!this.register) return;
    this.riskService.createAssessment(this.register.id, this.newAssessment as any).subscribe({
      next: () => { this.snackBar.open('Assessment added', 'Dismiss', { duration: 2000 }); this.newAssessment = this.emptyAssessment(); this.load(); },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to add assessment', 'Dismiss', { duration: 3500 }),
    });
  }

  evaluateAssessment(a: RiskAssessment): void {
    const data = this.evaluationData[a.id];
    this.riskService.updateAssessment(a.id, {
      riskAcceptance: data.riskAcceptance,
      justification: data.justification,
      status: 'EVALUATED',
    }).subscribe({
      next: () => { this.snackBar.open('Assessment evaluated', 'Dismiss', { duration: 2000 }); this.load(); },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to evaluate', 'Dismiss', { duration: 3500 }),
    });
  }

  saveResidualRisk(a: RiskAssessment): void {
    const data = this.residualData[a.id];
    this.riskService.updateResidualRisk(a.id, {
      residualSeverity: data.residualSeverity,
      residualOccurrence: data.residualOccurrence,
      residualDetectability: data.residualDetectability,
    }).subscribe({
      next: () => { this.snackBar.open('Residual risk updated', 'Dismiss', { duration: 2000 }); this.load(); },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to update residual risk', 'Dismiss', { duration: 3500 }),
    });
  }

  // ─── Control Actions ────────────────────────────────────────────────────────

  getControls(assessmentId: string): RiskControl[] {
    return this.controlsMap[assessmentId] || [];
  }

  addControl(a: RiskAssessment): void {
    const data = this.newControl[a.id];
    this.riskService.addControl(a.id, data as any).subscribe({
      next: () => {
        this.snackBar.open('Control added', 'Dismiss', { duration: 2000 });
        this.newControl[a.id] = { controlType: '', description: '' };
        this.riskService.listControls(a.id).subscribe((c) => this.controlsMap[a.id] = c);
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to add control', 'Dismiss', { duration: 3500 }),
    });
  }

  implementControl(ctrl: RiskControl): void {
    this.riskService.updateControl(ctrl.id, { status: 'IMPLEMENTED', evidence: 'Implementation evidence collected' }).subscribe({
      next: () => { this.snackBar.open('Control marked as implemented', 'Dismiss', { duration: 2000 }); this.load(); },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to update control', 'Dismiss', { duration: 3500 }),
    });
  }

  verifyControl(ctrl: RiskControl): void {
    const rating = this.verifyData[ctrl.id] || 'EFFECTIVE';
    this.riskService.updateControl(ctrl.id, { status: 'VERIFIED', effectivenessRating: rating }).subscribe({
      next: () => { this.snackBar.open('Control verified', 'Dismiss', { duration: 2000 }); this.load(); },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to verify control', 'Dismiss', { duration: 3500 }),
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  getRiskLevel(rpn: number): string {
    if (rpn >= 80) return 'CRITICAL';
    if (rpn >= 40) return 'HIGH';
    if (rpn >= 15) return 'MEDIUM';
    return 'LOW';
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
  }

  private emptyAssessment() {
    return {
      hazardDescription: '',
      harmDescription: '',
      riskCategory: '',
      processStep: '',
      initialSeverity: null as number | null,
      initialOccurrence: null as number | null,
      initialDetectability: null as number | null,
    };
  }
}
