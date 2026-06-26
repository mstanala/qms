import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DeviationService } from '../../services/deviation.service';
import { Deviation, DeviationStatus, ImpactLevel, DispositionDecision } from '../../models/deviation.model';
import { ESignatureDialogComponent } from '../e-signature-dialog/e-signature-dialog.component';

function getUserRoleCodes(): string[] {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (!raw) return [];
  try {
    const roles = JSON.parse(raw)?.user?.roles || [];
    return roles.map((r: any) => typeof r === 'string' ? r : r.code).filter(Boolean);
  } catch { return []; }
}

function getUserId(): string {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (!raw) return '';
  try { return JSON.parse(raw)?.user?.id || ''; } catch { return ''; }
}

@Component({
  selector: 'dev-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatSnackBarModule, MatDialogModule, ESignatureDialogComponent],
  template: `
    <div class="vault-detail" *ngIf="deviation">
      <!-- Record Header -->
      <div class="record-header">
        <div class="record-breadcrumb">
          <button type="button" class="breadcrumb-link breadcrumb-button" (click)="backToList()">Deviations</button>
        </div>
        <div class="record-title-row">
          <div class="record-id-group">
            <span class="record-number">{{ deviation.deviationNumber }}</span>
            <div class="impact-summary" aria-label="Impact flags">
              <span class="impact-summary-badge gmp" *ngIf="deviation.gmpImpact">GMP Impact</span>
              <span class="impact-summary-badge patient" *ngIf="deviation.patientSafetyImpact">Patient Safety</span>
              <span class="impact-summary-badge regulatory" *ngIf="deviation.regulatoryImpact">Regulatory</span>
              <span class="impact-summary-badge capa" *ngIf="deviation.capaRequired">CAPA Required</span>
            </div>
          </div>
          <div class="record-actions">
            <div class="record-navigation" aria-label="Deviation record navigation">
              <button mat-icon-button type="button" class="record-nav-btn" matTooltip="Previous Deviation" [disabled]="!previousDeviationId" (click)="navigateToDeviation(previousDeviationId)">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <button mat-icon-button type="button" class="record-nav-btn" matTooltip="Next Deviation" [disabled]="!nextDeviationId" (click)="navigateToDeviation(nextDeviationId)">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
            <button mat-icon-button type="button" matTooltip="Attachments" (click)="showSection('attachments')">
              <mat-icon>attach_file</mat-icon>
            </button>
            <button mat-icon-button type="button" matTooltip="Edit Deviation" (click)="editDeviation()">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button type="button" matTooltip="More actions" [matMenuTriggerFor]="recordActionsMenu">
              <mat-icon>more_horiz</mat-icon>
            </button>
            <mat-menu #recordActionsMenu="matMenu" xPosition="before">
              <button mat-menu-item type="button" (click)="editDeviation()">
                <mat-icon>edit</mat-icon>
                <span>Edit Deviation</span>
              </button>
              <button mat-menu-item type="button" (click)="showSection('attachments')">
                <mat-icon>attach_file</mat-icon>
                <span>Attachments</span>
              </button>
              <button mat-menu-item type="button" (click)="showSection('audit')">
                <mat-icon>receipt_long</mat-icon>
                <span>Record Audit Section</span>
              </button>
              <button mat-menu-item type="button" (click)="openAuditTrail()">
                <mat-icon>history</mat-icon>
                <span>Audit Trail</span>
              </button>
              <button mat-menu-item type="button" (click)="copyRecordLink()">
                <mat-icon>content_copy</mat-icon>
                <span>Copy Record Link</span>
              </button>
              <button mat-menu-item type="button" (click)="backToList()">
                <mat-icon>list</mat-icon>
                <span>Back to Deviations</span>
              </button>
            </mat-menu>
          </div>
        </div>
        <div class="record-title-line">
          <div class="record-title">{{ deviation.title }}</div>
          <span class="status-pill" [ngClass]="getStatusClass(deviation.status)">{{ formatStatus(deviation.status) }}</span>
          <span class="record-meta">{{ deviation.type }} | {{ deviation.classification }}</span>
        </div>

        <!-- Workflow Action Bar -->
        <div class="workflow-actions-bar" *ngIf="getAvailableActions().length > 0">
          <ng-container *ngFor="let action of getAvailableActions()">
            <button *ngIf="action.type === 'primary'"
                    class="wf-btn wf-btn-primary"
                    [disabled]="isStatusUpdating"
                    (click)="executeWorkflowAction(action)">
              <mat-icon>{{ action.icon }}</mat-icon> {{ action.label }}
            </button>
            <button *ngIf="action.type === 'danger'"
                    class="wf-btn wf-btn-danger"
                    [disabled]="isStatusUpdating"
                    (click)="executeWorkflowAction(action)">
              <mat-icon>{{ action.icon }}</mat-icon> {{ action.label }}
            </button>
            <button *ngIf="action.type === 'secondary'"
                    class="wf-btn wf-btn-secondary"
                    [disabled]="isStatusUpdating"
                    (click)="executeWorkflowAction(action)">
              <mat-icon>{{ action.icon }}</mat-icon> {{ action.label }}
            </button>
          </ng-container>
        </div>
      </div>

      <!-- Veeva Layout: Sidebar + Content -->
      <div class="vault-body">
        <!-- Left Sidebar Navigation -->
        <div class="vault-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-section-title">General Information</div>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'general'}" (click)="showSection('general')">General Details</button>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'timeline'}" (click)="showSection('timeline')">Timeline & Assignment</button>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'product'}" (click)="showSection('product')">Product & Batch Info</button>
          </div>
          <div class="sidebar-section">
            <div class="sidebar-section-title">Investigations & Root Causes</div>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'investigation'}" (click)="showSection('investigation')">Investigation ({{ deviation.investigation ? 1 : 0 }})</button>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'rootcause'}" (click)="showSection('rootcause')">Root Cause Analysis ({{ deviation.investigation ? 1 : 0 }})</button>
          </div>
          <div class="sidebar-section">
            <div class="sidebar-section-title">Assessment & Disposition</div>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'impact'}" (click)="showSection('impact')">Impact Assessment</button>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'disposition'}" (click)="showSection('disposition')">Disposition</button>
          </div>
          <div class="sidebar-section">
            <div class="sidebar-section-title">Related Records</div>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'attachments'}" (click)="showSection('attachments')">Attachments ({{ deviation.attachments.length }})</button>
            <button type="button" class="sidebar-item" [ngClass]="{'active': activeSection === 'audit'}" (click)="showSection('audit')">Audit Trail ({{ deviation.auditTrail.length }})</button>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="vault-content">
          <!-- Veeva Lifecycle Bar -->
          <div class="lifecycle-bar" [style.--workflow-step-count]="deviation.workflowHistory.length">
            <div class="lifecycle-step" *ngFor="let step of deviation.workflowHistory; let i = index"
                 [ngClass]="{'completed': step.status === 'COMPLETED', 'current': step.status === 'CURRENT', 'pending': step.status === 'PENDING'}"
                 [matTooltip]="getStepTooltip(step)">
              <div class="lifecycle-fill"></div>
              <span class="lifecycle-icon" *ngIf="step.status === 'COMPLETED'">&#10003;</span>
              <span class="lifecycle-icon pulse" *ngIf="step.status === 'CURRENT'">&#9679;</span>
              <span class="lifecycle-label">{{ step.stepName }}</span>
            </div>
          </div>

          <!-- General Details Section -->
          <div class="vault-section" *ngIf="activeSection === 'general'">
            <div class="section-header" (click)="toggleSection('generalInfo')">
              <mat-icon>{{ expandedSections['generalInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>General Information</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['generalInfo']">
              <div class="field-grid">
                <div class="field-item"><label>Deviation #</label><span>{{ deviation.deviationNumber }}</span></div>
                <div class="field-item"><label>Type</label><span>{{ deviation.type }}</span></div>
                <div class="field-item"><label>Category</label><span>{{ formatCategory(deviation.category) }}</span></div>
                <div class="field-item"><label>Classification</label><span class="classification-val" [ngClass]="deviation.classification.toLowerCase()">{{ deviation.classification }}</span></div>
                <div class="field-item"><label>Source Area</label><span>{{ deviation.sourceArea }}</span></div>
                <div class="field-item"><label>Plant Site</label><span>{{ deviation.plantSite }}</span></div>
                <div class="field-item"><label>Department</label><span>{{ deviation.department }}</span></div>
                <div class="field-item"><label>Area</label><span>{{ deviation.area }}</span></div>
                <div class="field-item" *ngIf="deviation.equipment"><label>Equipment</label><span>{{ deviation.equipment }}</span></div>
              </div>
            </div>

            <div class="section-header" (click)="toggleSection('description')">
              <mat-icon>{{ expandedSections['description'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Description</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['description']">
              <p class="description-text">{{ deviation.description }}</p>
            </div>

            <div class="section-header" (click)="toggleSection('impactFlags')">
              <mat-icon>{{ expandedSections['impactFlags'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Impact Flags</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['impactFlags']">
              <div class="flags-grid">
                <div class="flag-item" [ngClass]="{'active': deviation.gmpImpact}"><mat-icon>{{ deviation.gmpImpact ? 'check_circle' : 'cancel' }}</mat-icon> GMP Impact</div>
                <div class="flag-item" [ngClass]="{'active': deviation.patientSafetyImpact}"><mat-icon>{{ deviation.patientSafetyImpact ? 'check_circle' : 'cancel' }}</mat-icon> Patient Safety</div>
                <div class="flag-item" [ngClass]="{'active': deviation.regulatoryImpact}"><mat-icon>{{ deviation.regulatoryImpact ? 'check_circle' : 'cancel' }}</mat-icon> Regulatory</div>
                <div class="flag-item" [ngClass]="{'active': deviation.capaRequired}"><mat-icon>{{ deviation.capaRequired ? 'check_circle' : 'cancel' }}</mat-icon> CAPA Required</div>
              </div>
              <div class="capa-link" *ngIf="deviation.capaReference">Linked CAPA: <a class="vault-link">{{ deviation.capaReference }}</a></div>
            </div>
          </div>

          <!-- Timeline Section -->
          <div class="vault-section" *ngIf="activeSection === 'timeline'">
            <div class="section-header" (click)="toggleSection('timelineInfo')">
              <mat-icon>{{ expandedSections['timelineInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Timeline & Assignment</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['timelineInfo']">
              <div class="field-grid">
                <div class="field-item"><label>Occurred Date</label><span>{{ deviation.occurredDate | date:'dd-MMM-yyyy HH:mm' }}</span></div>
                <div class="field-item"><label>Detected</label><span>{{ deviation.detectedDate | date:'dd-MMM-yyyy HH:mm' }}</span></div>
                <div class="field-item"><label>Reported</label><span>{{ deviation.reportedDate | date:'dd-MMM-yyyy HH:mm' }}</span></div>
                <div class="field-item"><label>Target Closure</label><span [ngClass]="{'overdue-val': isOverdue()}">{{ deviation.targetClosureDate | date:'dd-MMM-yyyy' }}</span></div>
                <div class="field-item" *ngIf="deviation.actualClosureDate"><label>Actual Closure</label><span>{{ deviation.actualClosureDate | date:'dd-MMM-yyyy' }}</span></div>
                <div class="field-item"><label>Reported By</label><span class="vault-link">{{ deviation.reportedByName }}</span></div>
                <div class="field-item"><label>Assigned To</label><span class="vault-link">{{ deviation.assignedToName }}</span></div>
                <div class="field-item" *ngIf="deviation.reviewerName"><label>Reviewer</label><span class="vault-link">{{ deviation.reviewerName }}</span></div>
              </div>
            </div>
          </div>

          <!-- Product Section -->
          <div class="vault-section" *ngIf="activeSection === 'product'">
            <div class="section-header" (click)="toggleSection('productInfo')">
              <mat-icon>{{ expandedSections['productInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Product & Batch Information</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['productInfo']">
              <div class="field-grid" *ngIf="deviation.product || deviation.batchNumber || deviation.affectedBatches.length; else noProduct">
                <div class="field-item" *ngIf="deviation.product"><label>Product</label><span>{{ deviation.product }}</span></div>
                <div class="field-item" *ngIf="deviation.batchNumber"><label>Primary Batch</label><span>{{ deviation.batchNumber }}</span></div>
              </div>
              <div class="vault-table" *ngIf="deviation.affectedBatches.length">
                <div class="table-toolbar">
                  <span class="table-title">Affected Batches ({{ deviation.affectedBatches.length }})</span>
                </div>
                <table>
                  <thead><tr><th>Batch Number</th></tr></thead>
                  <tbody><tr *ngFor="let batch of deviation.affectedBatches"><td><a class="vault-link">{{ batch }}</a></td></tr></tbody>
                </table>
              </div>
              <ng-template #noProduct><p class="no-data-msg">No product or batch information recorded.</p></ng-template>
            </div>
          </div>

          <!-- Investigation Section -->
          <div class="vault-section" *ngIf="activeSection === 'investigation'">
            <div class="section-header" (click)="toggleSection('investigationInfo')">
              <mat-icon>{{ expandedSections['investigationInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Investigations</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['investigationInfo']">
              <div *ngIf="deviation.investigation; else noInvestigation">
                <div class="vault-table">
                  <div class="table-toolbar">
                    <button class="vault-btn-create">+ Create</button>
                    <span class="table-title">Show in Tab</span>
                  </div>
                  <table>
                    <thead><tr><th>Investigator</th><th>Method</th><th>Start Date</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr>
                        <td><a class="vault-link">{{ deviation.investigation.investigatorName }}</a></td>
                        <td>{{ deviation.investigation.method }}</td>
                        <td>{{ deviation.investigation.startDate | date:'dd-MMM-yyyy' }}</td>
                        <td>{{ deviation.investigation.completedDate ? 'Completed' : 'In Progress' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="field-grid" style="margin-top: 16px;">
                  <div class="field-item full"><label>Probable Cause</label><span>{{ deviation.investigation.probableCause }}</span></div>
                  <div class="field-item full"><label>Root Cause</label><span class="highlight-field">{{ deviation.investigation.rootCause }}</span></div>
                  <div class="field-item full"><label>Findings</label><span>{{ deviation.investigation.findings }}</span></div>
                  <div class="field-item full"><label>Conclusion</label><span>{{ deviation.investigation.conclusion }}</span></div>
                </div>
                <div class="vault-table" *ngIf="deviation.investigation.immediateActions.length" style="margin-top: 16px;">
                  <div class="table-toolbar"><span class="table-title">Immediate Actions Taken</span></div>
                  <table>
                    <thead><tr><th>#</th><th>Action</th></tr></thead>
                    <tbody><tr *ngFor="let action of deviation.investigation.immediateActions; let i = index"><td>{{ i + 1 }}</td><td>{{ action }}</td></tr></tbody>
                  </table>
                </div>
              </div>
              <ng-template #noInvestigation><p class="no-data-msg">No investigation records. Click "+ Create" to start an investigation.</p></ng-template>
            </div>
          </div>

          <!-- Root Cause Analysis Section -->
          <div class="vault-section" *ngIf="activeSection === 'rootcause'">
            <div class="section-header" (click)="toggleSection('rootCauseInfo')">
              <mat-icon>{{ expandedSections['rootCauseInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Root Cause Analysis</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['rootCauseInfo']">
              <div class="vault-table">
                <div class="table-toolbar">
                  <button type="button" class="vault-btn-create" (click)="openRootCauseForm()">+ Create</button>
                  <span class="table-title">Show in Tab</span>
                </div>
                <table *ngIf="deviation.investigation">
                  <thead><tr><th>Name</th><th>Owner</th><th>Problem</th><th>Due Date</th></tr></thead>
                  <tbody>
                    <tr>
                      <td><a class="vault-link">RCA-{{ deviation.deviationNumber }}</a></td>
                      <td>{{ deviation.investigation.investigatorName }}</td>
                      <td>{{ deviation.investigation.rootCause }}</td>
                      <td>{{ deviation.targetClosureDate | date:'dd-MMM-yyyy' }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="rca-form-card" *ngIf="rootCauseFormVisible">
                  <div class="rca-form-header">
                    <div>
                      <h3>{{ deviation.investigation ? 'Update Root Cause Analysis' : 'Create Root Cause Analysis' }}</h3>
                      <p>Capture the investigation method, probable cause, confirmed root cause, and conclusion.</p>
                    </div>
                    <button type="button" class="icon-close-btn" aria-label="Close root cause form" (click)="cancelRootCauseForm()">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                  <div class="rca-form-grid">
                    <label>
                      <span>Method</span>
                      <select [(ngModel)]="rootCauseForm.method">
                        <option value="5 Why Analysis">5 Why Analysis</option>
                        <option value="Fishbone Analysis">Fishbone Analysis</option>
                        <option value="Fault Tree Analysis">Fault Tree Analysis</option>
                        <option value="Root Cause Analysis">Root Cause Analysis</option>
                      </select>
                    </label>
                    <label class="full">
                      <span>Probable Cause</span>
                      <textarea rows="3" [(ngModel)]="rootCauseForm.probableCause"></textarea>
                    </label>
                    <label class="full">
                      <span>Root Cause</span>
                      <textarea rows="3" [(ngModel)]="rootCauseForm.rootCause"></textarea>
                    </label>
                    <label class="full">
                      <span>Immediate Actions</span>
                      <textarea rows="2" [(ngModel)]="rootCauseForm.immediateActionsText" placeholder="Enter one action per line"></textarea>
                    </label>
                    <label class="full">
                      <span>Findings</span>
                      <textarea rows="3" [(ngModel)]="rootCauseForm.findings"></textarea>
                    </label>
                    <label class="full">
                      <span>Conclusion</span>
                      <textarea rows="3" [(ngModel)]="rootCauseForm.conclusion"></textarea>
                    </label>
                  </div>
                  <div class="rca-form-actions">
                    <button type="button" class="vault-btn-secondary" (click)="cancelRootCauseForm()" [disabled]="rootCauseSubmitting">Cancel</button>
                    <button type="button" class="vault-btn-primary" (click)="submitRootCauseAnalysis()" [disabled]="rootCauseSubmitting">
                      {{ rootCauseSubmitting ? 'Saving...' : 'Save Root Cause Analysis' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Impact Assessment Section -->
          <div class="vault-section" *ngIf="activeSection === 'impact'">
            <div class="section-header" (click)="toggleSection('impactInfo')">
              <mat-icon>{{ expandedSections['impactInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Impact Assessment</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['impactInfo']">
              <div class="table-toolbar">
                <button type="button" class="vault-btn-create" (click)="openImpactAssessmentForm()">
                  {{ deviation.impactAssessment ? 'Edit' : '+ Create' }}
                </button>
              </div>
              <div class="vault-form-card" *ngIf="impactAssessmentFormVisible">
                <div class="rca-form-header">
                  <div>
                    <h3>{{ deviation.impactAssessment ? 'Edit Impact Assessment' : 'Create Impact Assessment' }}</h3>
                    <p>Evaluate product quality, patient safety, regulatory, and business impact before disposition.</p>
                  </div>
                  <button type="button" class="icon-close-btn" aria-label="Close impact assessment form" (click)="cancelImpactAssessmentForm()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="rca-form-grid">
                  <label>
                    <span>Product Quality</span>
                    <select [(ngModel)]="impactAssessmentForm.productQualityImpact">
                      <option *ngFor="let level of impactLevelOptions" [value]="level">{{ formatStatus(level) }}</option>
                    </select>
                  </label>
                  <label>
                    <span>Patient Safety</span>
                    <select [(ngModel)]="impactAssessmentForm.patientSafetyImpact">
                      <option *ngFor="let level of impactLevelOptions" [value]="level">{{ formatStatus(level) }}</option>
                    </select>
                  </label>
                  <label>
                    <span>Regulatory</span>
                    <select [(ngModel)]="impactAssessmentForm.regulatoryImpact">
                      <option *ngFor="let level of impactLevelOptions" [value]="level">{{ formatStatus(level) }}</option>
                    </select>
                  </label>
                  <label>
                    <span>Business</span>
                    <select [(ngModel)]="impactAssessmentForm.businessImpact">
                      <option *ngFor="let level of impactLevelOptions" [value]="level">{{ formatStatus(level) }}</option>
                    </select>
                  </label>
                  <label>
                    <span>Overall Risk</span>
                    <select [(ngModel)]="impactAssessmentForm.overallRiskLevel">
                      <option *ngFor="let level of riskLevelOptions" [value]="level">{{ formatStatus(level) }}</option>
                    </select>
                  </label>
                  <label>
                    <span>Batch Disposition</span>
                    <input [(ngModel)]="impactAssessmentForm.batchDisposition" placeholder="e.g. Quarantine pending QA decision">
                  </label>
                  <label class="full">
                    <span>Affected Products</span>
                    <textarea rows="2" [(ngModel)]="impactAssessmentForm.affectedProductsText" placeholder="Enter one product per line"></textarea>
                  </label>
                  <label class="full">
                    <span>Affected Batches</span>
                    <textarea rows="2" [(ngModel)]="impactAssessmentForm.affectedBatchesText" placeholder="Enter one batch per line"></textarea>
                  </label>
                  <label class="full">
                    <span>Justification</span>
                    <textarea rows="4" [(ngModel)]="impactAssessmentForm.justification"></textarea>
                  </label>
                </div>
                <div class="rca-form-actions">
                  <button type="button" class="vault-btn-secondary" (click)="cancelImpactAssessmentForm()" [disabled]="impactAssessmentSubmitting">Cancel</button>
                  <button type="button" class="vault-btn-primary" (click)="submitImpactAssessment()" [disabled]="impactAssessmentSubmitting">
                    {{ impactAssessmentSubmitting ? 'Saving...' : 'Save Impact Assessment' }}
                  </button>
                </div>
              </div>
              <div *ngIf="deviation.impactAssessment; else noImpact">
                <div class="vault-table">
                  <table>
                    <thead><tr><th>Impact Area</th><th>Rating</th></tr></thead>
                    <tbody>
                      <tr><td>Product Quality</td><td><span class="impact-badge" [ngClass]="deviation.impactAssessment.productQualityImpact.toLowerCase()">{{ deviation.impactAssessment.productQualityImpact }}</span></td></tr>
                      <tr><td>Patient Safety</td><td><span class="impact-badge" [ngClass]="deviation.impactAssessment.patientSafetyImpact.toLowerCase()">{{ deviation.impactAssessment.patientSafetyImpact }}</span></td></tr>
                      <tr><td>Regulatory</td><td><span class="impact-badge" [ngClass]="deviation.impactAssessment.regulatoryImpact.toLowerCase()">{{ deviation.impactAssessment.regulatoryImpact }}</span></td></tr>
                      <tr><td>Business</td><td><span class="impact-badge" [ngClass]="deviation.impactAssessment.businessImpact.toLowerCase()">{{ deviation.impactAssessment.businessImpact }}</span></td></tr>
                      <tr class="overall-row"><td><strong>Overall Risk Level</strong></td><td><span class="impact-badge" [ngClass]="deviation.impactAssessment.overallRiskLevel.toLowerCase()">{{ deviation.impactAssessment.overallRiskLevel }}</span></td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="field-grid" style="margin-top: 16px;">
                  <div class="field-item"><label>Batch Disposition</label><span>{{ deviation.impactAssessment.batchDisposition }}</span></div>
                  <div class="field-item"><label>Assessed By</label><span class="vault-link">{{ deviation.impactAssessment.assessedBy }}</span></div>
                  <div class="field-item"><label>Assessment Date</label><span>{{ deviation.impactAssessment.assessedDate | date:'dd-MMM-yyyy' }}</span></div>
                  <div class="field-item full"><label>Justification</label><span>{{ deviation.impactAssessment.justification }}</span></div>
                </div>
              </div>
              <ng-template #noImpact><p class="no-data-msg">Impact assessment has not been performed yet. Click "+ Create" to add one.</p></ng-template>
            </div>
          </div>

          <!-- Disposition Section -->
          <div class="vault-section" *ngIf="activeSection === 'disposition'">
            <div class="section-header" (click)="toggleSection('dispositionInfo')">
              <mat-icon>{{ expandedSections['dispositionInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Disposition</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['dispositionInfo']">
              <div class="table-toolbar">
                <button type="button" class="vault-btn-create" (click)="openDispositionForm()">
                  {{ deviation.disposition ? 'Edit' : '+ Create' }}
                </button>
              </div>
              <div class="vault-form-card" *ngIf="dispositionFormVisible">
                <div class="rca-form-header">
                  <div>
                    <h3>{{ deviation.disposition ? 'Edit Disposition' : 'Create Disposition' }}</h3>
                    <p>Document the QA disposition decision and whether CAPA is required.</p>
                  </div>
                  <button type="button" class="icon-close-btn" aria-label="Close disposition form" (click)="cancelDispositionForm()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="rca-form-grid">
                  <label>
                    <span>Decision</span>
                    <select [(ngModel)]="dispositionForm.decision">
                      <option *ngFor="let decision of dispositionDecisionOptions" [value]="decision">{{ formatDisposition(decision) }}</option>
                    </select>
                  </label>
                  <label>
                    <span>CAPA Required</span>
                    <select [(ngModel)]="dispositionForm.capaRequired">
                      <option [ngValue]="true">Yes</option>
                      <option [ngValue]="false">No</option>
                    </select>
                  </label>
                  <label class="full">
                    <span>Justification</span>
                    <textarea rows="4" [(ngModel)]="dispositionForm.justification"></textarea>
                  </label>
                  <label class="full">
                    <span>Conditions</span>
                    <textarea rows="3" [(ngModel)]="dispositionForm.conditions"></textarea>
                  </label>
                  <label class="full">
                    <span>QA Review Comments</span>
                    <textarea rows="3" [(ngModel)]="dispositionForm.qaReviewComments"></textarea>
                  </label>
                </div>
                <div class="rca-form-actions">
                  <button type="button" class="vault-btn-secondary" (click)="cancelDispositionForm()" [disabled]="dispositionSubmitting">Cancel</button>
                  <button type="button" class="vault-btn-primary" (click)="submitDisposition()" [disabled]="dispositionSubmitting">
                    {{ dispositionSubmitting ? 'Saving...' : 'Save Disposition' }}
                  </button>
                </div>
              </div>
              <div *ngIf="deviation.disposition; else noDisposition">
                <div class="disposition-header">
                  <span class="decision-tag" [ngClass]="deviation.disposition.decision.toLowerCase().replace('_', '-')">{{ formatDisposition(deviation.disposition.decision) }}</span>
                </div>
                <div class="field-grid">
                  <div class="field-item full"><label>Justification</label><span>{{ deviation.disposition.justification }}</span></div>
                  <div class="field-item" *ngIf="deviation.disposition.conditions"><label>Conditions</label><span>{{ deviation.disposition.conditions }}</span></div>
                  <div class="field-item"><label>Approved By</label><span class="vault-link">{{ deviation.disposition.approvedBy }}</span></div>
                  <div class="field-item"><label>Approval Date</label><span>{{ deviation.disposition.approvedDate | date:'dd-MMM-yyyy' }}</span></div>
                  <div class="field-item full"><label>QA Review Comments</label><span>{{ deviation.disposition.qaReviewComments }}</span></div>
                </div>
              </div>
              <ng-template #noDisposition><p class="no-data-msg">Disposition decision has not been made yet. Click "+ Create" to add one.</p></ng-template>
            </div>
          </div>

          <!-- Attachments Section -->
          <div class="vault-section" *ngIf="activeSection === 'attachments'">
            <div class="section-header" (click)="toggleSection('attachmentsInfo')">
              <mat-icon>{{ expandedSections['attachmentsInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Attachments ({{ deviation.attachments.length }})</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['attachmentsInfo']">
              <input #attachmentFileInput type="file" hidden (change)="onAttachmentSelected($event)">
              <div class="attachment-dropzone"
                   [ngClass]="{'dragging': attachmentDragActive}"
                   (dragover)="onAttachmentDragOver($event)"
                   (dragleave)="onAttachmentDragLeave($event)"
                   (drop)="onAttachmentDrop($event)">
                <mat-icon>cloud_upload</mat-icon>
                <div>
                  <strong>Drop files here or click Upload</strong>
                  <span>Files are stored as attachments on this Deviation record.</span>
                </div>
                <button type="button" class="vault-btn-primary" (click)="attachmentFileInput.click()">Upload</button>
              </div>
              <div class="attachment-upload-form" *ngIf="selectedAttachmentFile">
                <div class="selected-file">
                  <mat-icon>attach_file</mat-icon>
                  <span>{{ selectedAttachmentFile.name }}</span>
                  <small>{{ formatFileSize(selectedAttachmentFile.size) }}</small>
                </div>
                <label>
                  <span>Category</span>
                  <select [(ngModel)]="attachmentForm.category">
                    <option *ngFor="let category of attachmentCategoryOptions" [value]="category">{{ formatStatus(category) }}</option>
                  </select>
                </label>
                <label>
                  <span>Description</span>
                  <input [(ngModel)]="attachmentForm.description" placeholder="Optional searchable description">
                </label>
                <div class="attachment-upload-actions">
                  <button type="button" class="vault-btn-secondary" (click)="clearSelectedAttachment()" [disabled]="attachmentUploading">Cancel</button>
                  <button type="button" class="vault-btn-primary" (click)="uploadAttachment()" [disabled]="attachmentUploading">
                    {{ attachmentUploading ? 'Uploading...' : 'Save Attachment' }}
                  </button>
                </div>
              </div>
              <div class="vault-table" *ngIf="deviation.attachments.length; else noAttach">
                <table>
                  <thead><tr><th>File Name</th><th>Category</th><th>Uploaded By</th><th>Date</th><th>Size</th><th>Description</th><th>Actions</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let att of deviation.attachments">
                      <td><button type="button" class="vault-link link-button" (click)="viewAttachment(att.id)">{{ att.fileName }}</button></td>
                      <td>{{ formatStatus(att.category || 'OTHER') }}</td>
                      <td>{{ att.uploadedBy }}</td>
                      <td>{{ att.uploadedDate | date:'dd-MMM-yyyy' }}</td>
                      <td>{{ formatFileSize(att.fileSize) }}</td>
                      <td>{{ att.description || '-' }}</td>
                      <td>
                        <button type="button" class="table-icon-btn" matTooltip="View" (click)="viewAttachment(att.id)">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button type="button" class="table-icon-btn" matTooltip="Download" (click)="downloadAttachment(att.id)">
                          <mat-icon>download</mat-icon>
                        </button>
                        <button type="button" class="table-icon-btn danger" matTooltip="Delete" (click)="deleteAttachment(att.id)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ng-template #noAttach><p class="no-data-msg">No attachments uploaded.</p></ng-template>
            </div>
          </div>

          <!-- Audit Trail Section -->
          <div class="vault-section" *ngIf="activeSection === 'audit'">
            <div class="section-header" (click)="toggleSection('auditInfo')">
              <mat-icon>{{ expandedSections['auditInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Audit Trail</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['auditInfo']">
              <div class="vault-table">
                <table>
                  <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Comments</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let entry of deviation.auditTrail">
                      <td>{{ entry.timestamp | date:'dd-MMM-yyyy HH:mm' }}</td>
                      <td><a class="vault-link">{{ entry.userName }}</a></td>
                      <td>{{ entry.action }}</td>
                      <td>{{ entry.field || '-' }}</td>
                      <td>{{ entry.oldValue || '-' }}</td>
                      <td>{{ entry.newValue || '-' }}</td>
                      <td>{{ entry.comments || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vault-detail { font-family: 'Roboto', sans-serif; }

    /* Record Header */
    .record-header { background: #fff; border-bottom: 1px solid #ddd; padding: 16px 24px; margin: -24px -24px 0; }
    .record-breadcrumb { margin-bottom: 8px; }
    .breadcrumb-link { color: #2C5F7C; font-size: 13px; text-decoration: none; }
    .breadcrumb-link:hover { text-decoration: underline; }
    .record-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      min-height: 40px;
    }
    .record-id-group {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .record-navigation {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      background: #fff;
      border: 1px solid #d7dde3;
      border-radius: 999px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
      overflow: hidden;
    }
    .record-number { font-size: 22px; font-weight: 600; color: #333; }
    .impact-summary { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .impact-summary-badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.2px;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    .impact-summary-badge.gmp { background: #fff7ed; color: #9a3412; border-color: #fed7aa; }
    .impact-summary-badge.patient { background: #fef2f2; color: #b42318; border-color: #fecaca; }
    .impact-summary-badge.regulatory { background: #eff6ff; color: #175cd3; border-color: #bfdbfe; }
    .impact-summary-badge.capa { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
    .record-nav-btn {
      width: 34px;
      height: 34px;
      min-width: 34px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border-radius: 0;
      color: #2C5F7C;
      background: #f8fafc;
    }
    .record-nav-btn + .record-nav-btn { border-left: 1px solid #edf1f5; }
    .record-nav-btn:hover:not(:disabled) { background: #eef6fa; color: #1B3A4B; }
    .record-nav-btn:disabled { color: #b8c2cc; background: #f6f8fa; }
    .record-nav-btn mat-icon {
      display: block;
      font-size: 22px;
      width: 22px;
      height: 22px;
      line-height: 22px;
      margin: 0;
    }
    .status-badge { padding: 4px 14px; border-radius: 14px; font-size: 12px; font-weight: 600; }
    .status-badge.reported { background: #ED8B00; color: #fff; }
    .status-badge.under-review { background: #F5A623; color: #fff; }
    .status-badge.classified { background: #2C5F7C; color: #fff; }
    .status-badge.investigation { background: #ED8B00; color: #fff; }
    .status-badge.impact-assessment { background: #D4760A; color: #fff; }
    .status-badge.disposition { background: #2C5F7C; color: #fff; }
    .status-badge.capa-initiated { background: #7B1FA2; color: #fff; }
    .status-badge.pending-closure { background: #388E3C; color: #fff; }
    .status-badge.closed { background: #666; color: #fff; }
    .status-pill {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pill.reported { background: #ED8B00; color: #fff; }
    .status-pill.under-review { background: #F5A623; color: #fff; }
    .status-pill.classified { background: #2C5F7C; color: #fff; }
    .status-pill.investigation { background: #ED8B00; color: #fff; }
    .status-pill.impact-assessment { background: #D4760A; color: #fff; }
    .status-pill.disposition { background: #2C5F7C; color: #fff; }
    .status-pill.capa-initiated { background: #7B1FA2; color: #fff; }
    .status-pill.pending-closure { background: #388E3C; color: #fff; }
    .status-pill.closed { background: #666; color: #fff; }
    .status-pill.rejected { background: #c62828; color: #fff; }

    .workflow-actions-bar {
      display: flex;
      gap: 8px;
      padding: 10px 0 4px;
      flex-wrap: wrap;
    }
    .wf-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: none;
      border-radius: 6px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 100ms;
    }
    .wf-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .wf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .wf-btn-primary { background: #2C5F7C; color: #fff; }
    .wf-btn-primary:hover:not(:disabled) { background: #1B3A4B; }
    .wf-btn-danger { background: #dc2626; color: #fff; }
    .wf-btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .wf-btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #d1d5db; }
    .wf-btn-secondary:hover:not(:disabled) { background: #e2e8f0; }

    .status-select {
      min-width: 178px;
      border: 0;
      border-radius: 999px;
      padding: 6px 32px 6px 14px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
      background-position: calc(100% - 17px) 11px, calc(100% - 12px) 11px;
      background-size: 5px 5px, 5px 5px;
      background-repeat: no-repeat;
    }
    .status-select.reported { background-color: #ED8B00; }
    .status-select.under-review { background-color: #F5A623; }
    .status-select.classified { background-color: #2C5F7C; }
    .status-select.investigation { background-color: #ED8B00; }
    .status-select.impact-assessment { background-color: #D4760A; }
    .status-select.disposition { background-color: #2C5F7C; }
    .status-select.capa-initiated { background-color: #7B1FA2; }
    .status-select.pending-closure { background-color: #388E3C; }
    .status-select.closed { background-color: #666; }
    .status-select.rejected { background-color: #9E1B32; }
    .status-select:disabled { cursor: progress; opacity: 0.75; }
    .status-select option { background: #fff; color: #333; font-weight: 500; }
    .record-actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
    .record-title-line {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      margin-top: 10px;
      min-width: 0;
    }
    .record-meta { font-size: 12px; color: #667085; }
    .record-title {
      max-width: min(720px, 55vw);
      font-size: 14px;
      color: #555;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Veeva Lifecycle Bar */
    .lifecycle-bar {
      display: flex;
      gap: 0;
      width: min(100%, max(760px, calc(var(--workflow-step-count, 8) * 118px)));
      margin: 16px 0 18px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #d9e2ec;
      border-radius: 999px;
      box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
      overflow-x: auto;
    }
    .lifecycle-step {
      flex: 1 0 104px;
      min-height: 32px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      text-align: center;
      font-size: 10.5px;
      font-weight: 700;
      color: #697782;
      overflow: visible;
    }
    .lifecycle-step + .lifecycle-step { margin-left: -1px; }
    .lifecycle-step .lifecycle-fill {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 0;
      background: #edf2f7;
      border: 1px solid #d5dde6;
      border-radius: 0;
    }
    .lifecycle-step:first-child .lifecycle-fill { border-radius: 999px 0 0 999px; }
    .lifecycle-step:last-child .lifecycle-fill { border-radius: 0 999px 999px 0; }
    .lifecycle-step:only-child .lifecycle-fill { border-radius: 999px; }
    .lifecycle-step:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 0;
      right: -14px;
      bottom: 0;
      width: 28px;
      z-index: 4;
      background: #f8fafc;
      clip-path: polygon(0 0, 50% 0, 100% 50%, 50% 100%, 0 100%, 50% 50%);
      pointer-events: none;
    }
    .lifecycle-step .lifecycle-icon {
      position: relative;
      z-index: 3;
      font-size: 10px;
      margin-right: 3px;
      line-height: 1;
    }
    .lifecycle-step .lifecycle-icon.pulse {
      animation: pulse-dot 1.5s ease-in-out infinite;
      font-size: 8px;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .lifecycle-step .lifecycle-label { position: relative; z-index: 3; line-height: 1.2; }
    .lifecycle-step.completed .lifecycle-fill { background: #e8eef4; border-color: #d5dde6; }
    .lifecycle-step.completed { color: #475467; }
    .lifecycle-step.current .lifecycle-fill {
      background: linear-gradient(135deg, #1B3A4B, #2C5F7C);
      border-color: #1B3A4B;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
    }
    .lifecycle-step.current { color: #fff; font-weight: 700; }
    .lifecycle-step.pending .lifecycle-fill { background: #e8eef4; border-color: #d5dde6; }
    .lifecycle-step.pending { color: #475467; }

    /* Vault Body Layout */
    .vault-body { display: flex; gap: 0; margin: 0 -24px; min-height: calc(100vh - 280px); }

    /* Sidebar */
    .vault-sidebar { width: 220px; min-width: 220px; background: #fff; border-right: 1px solid #e0e0e0; padding: 16px 0; }
    .sidebar-section { margin-bottom: 8px; }
    .sidebar-section-title { padding: 8px 16px 4px; font-size: 11px; font-weight: 700; color: #2C5F7C; text-transform: uppercase; letter-spacing: 0.3px; }
    .sidebar-item { display: block; width: 100%; padding: 6px 16px 6px 24px; font-size: 13px; color: #333; cursor: pointer; text-align: left; text-decoration: none; border: 0; border-left: 3px solid transparent; background: transparent; font-family: inherit; }
    .sidebar-item:hover { background: #f5f5f5; }
    .sidebar-item.active { border-left-color: #ED8B00; background: #FFF8E1; color: #2C5F7C; font-weight: 500; }

    /* Content */
    .vault-content { flex: 1; background: #fafafa; padding: 0 24px 24px; overflow-y: auto; }

    /* Section Headers (Collapsible) */
    .vault-section { margin-top: 16px; }
    .section-header { display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px 4px 0 0; cursor: pointer; font-size: 13px; font-weight: 600; color: #333; }
    .section-header mat-icon { font-size: 18px; width: 18px; height: 18px; color: #666; }
    .section-header:hover { background: #e8e8e8; }
    .section-body { background: #fff; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; }

    /* Field Grid */
    .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .field-item { display: flex; flex-direction: column; gap: 2px; }
    .field-item.full { grid-column: 1 / -1; }
    .field-item label { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
    .field-item span { font-size: 13px; color: #333; }

    .classification-val { font-weight: 600; }
    .classification-val.critical { color: #c62828; }
    .classification-val.major { color: #e65100; }
    .classification-val.minor { color: #2e7d32; }

    .overdue-val { color: #c62828; font-weight: 600; }
    .vault-link { color: #2C5F7C; cursor: pointer; }
    .vault-link:hover { text-decoration: underline; }

    .highlight-field { background: #FFF8E1; padding: 8px 10px; border-left: 3px solid #ED8B00; border-radius: 2px; display: block; }

    /* Vault Tables */
    .vault-table { overflow-x: auto; }
    .table-toolbar { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .table-title { font-size: 12px; color: #2C5F7C; cursor: pointer; }
    .vault-btn-create { background: none; border: 1px solid #ccc; padding: 3px 10px; font-size: 12px; border-radius: 3px; cursor: pointer; color: #333; }
    .vault-btn-create:hover { background: #f5f5f5; }
    .vault-btn-primary,
    .vault-btn-secondary {
      border: 1px solid transparent;
      border-radius: 4px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .vault-btn-primary { background: #1B3A4B; color: #fff; }
    .vault-btn-primary:hover { background: #2C5F7C; }
    .vault-btn-primary:disabled,
    .vault-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
    .vault-btn-secondary { background: #fff; color: #333; border-color: #ccd5df; }
    .vault-btn-secondary:hover { background: #f7f9fb; }
    .rca-form-card {
      margin: 16px 0 4px;
      padding: 18px;
      border: 1px solid #d9e2ec;
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
    }
    .vault-form-card {
      margin: 12px 0 18px;
      padding: 18px;
      border: 1px solid #d9e2ec;
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
    }
    .rca-form-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 14px;
    }
    .rca-form-header h3 { margin: 0; font-size: 16px; color: #1B3A4B; }
    .rca-form-header p { margin: 4px 0 0; font-size: 12px; color: #667085; }
    .icon-close-btn {
      border: 0;
      background: transparent;
      color: #667085;
      cursor: pointer;
      padding: 2px;
      height: 28px;
      width: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .rca-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .rca-form-grid label { display: flex; flex-direction: column; gap: 6px; }
    .rca-form-grid label.full { grid-column: 1 / -1; }
    .rca-form-grid label span {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #667085;
    }
    .rca-form-grid input,
    .rca-form-grid select,
    .rca-form-grid textarea {
      width: 100%;
      border: 1px solid #ccd5df;
      border-radius: 4px;
      padding: 8px 10px;
      font: inherit;
      font-size: 13px;
      color: #1f2937;
      background: #fff;
      box-sizing: border-box;
    }
    .rca-form-grid textarea { resize: vertical; min-height: 70px; }
    .rca-form-grid input:focus,
    .rca-form-grid select:focus,
    .rca-form-grid textarea:focus {
      outline: none;
      border-color: #2C5F7C;
      box-shadow: 0 0 0 3px rgba(44, 95, 124, 0.12);
    }
    .rca-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #eef2f6;
    }
    .attachment-dropzone {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
      margin-bottom: 14px;
      border: 1px dashed #9fb3c8;
      border-radius: 6px;
      background: #f8fbfd;
      color: #1f2937;
    }
    .attachment-dropzone.dragging {
      border-color: #2C5F7C;
      background: #eef6fa;
    }
    .attachment-dropzone mat-icon { color: #2C5F7C; }
    .attachment-dropzone div { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .attachment-dropzone strong { font-size: 13px; }
    .attachment-dropzone span { font-size: 12px; color: #667085; }
    .attachment-upload-form {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 180px minmax(220px, 1.4fr) auto;
      align-items: end;
      gap: 12px;
      padding: 14px;
      margin-bottom: 14px;
      border: 1px solid #e1e7ef;
      border-radius: 6px;
      background: #fff;
    }
    .selected-file {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      column-gap: 8px;
      row-gap: 2px;
      align-items: center;
      min-width: 0;
    }
    .selected-file mat-icon { color: #2C5F7C; }
    .selected-file span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 600;
    }
    .selected-file small { grid-column: 2; color: #667085; font-size: 11px; }
    .attachment-upload-form label {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .attachment-upload-form label span {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #667085;
    }
    .attachment-upload-form input,
    .attachment-upload-form select {
      border: 1px solid #ccd5df;
      border-radius: 4px;
      padding: 8px 10px;
      font: inherit;
      font-size: 13px;
    }
    .attachment-upload-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .link-button {
      border: 0;
      background: transparent;
      padding: 0;
      cursor: pointer;
      font: inherit;
    }
    .table-icon-btn {
      width: 30px;
      height: 30px;
      border: 1px solid transparent;
      background: transparent;
      border-radius: 4px;
      color: #506070;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
    }
    .table-icon-btn:hover { background: #f2f5f8; border-color: #d9e2ec; }
    .table-icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .table-icon-btn.danger:hover { color: #b42318; background: #fff4f2; border-color: #fecdca; }

    .vault-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .vault-table thead th { background: #f5f5f5; border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-weight: 600; color: #555; font-size: 12px; }
    .vault-table tbody td { border: 1px solid #eee; padding: 8px 12px; color: #333; }
    .vault-table tbody tr:hover { background: #f9f9f9; }

    /* Impact Badges */
    .impact-badge { padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .impact-badge.none { background: #f5f5f5; color: #999; }
    .impact-badge.low { background: #e8f5e9; color: #2e7d32; }
    .impact-badge.medium { background: #fff8e1; color: #f57f17; }
    .impact-badge.high { background: #fff3e0; color: #e65100; }
    .impact-badge.critical { background: #ffebee; color: #c62828; }
    .overall-row { background: #f9f9f9; }

    /* Flags */
    .flags-grid { display: flex; gap: 20px; flex-wrap: wrap; }
    .flag-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #bbb; }
    .flag-item.active { color: #333; }
    .flag-item.active mat-icon { color: #4caf50; }
    .flag-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .capa-link { margin-top: 12px; font-size: 13px; color: #555; }

    /* Disposition */
    .disposition-header { margin-bottom: 16px; }
    .decision-tag { padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 700; }
    .decision-tag.release { background: #e8f5e9; color: #2e7d32; }
    .decision-tag.release-with-conditions { background: #fff8e1; color: #f57f17; }
    .decision-tag.reject { background: #ffebee; color: #c62828; }
    .decision-tag.quarantine { background: #fce4ec; color: #ad1457; }
    .decision-tag.reprocess { background: #e3f2fd; color: #1565c0; }

    .description-text { font-size: 13px; line-height: 1.6; color: #444; margin: 0; }
    .no-data-msg { font-size: 13px; color: #999; padding: 16px; text-align: center; }

    @media (max-width: 768px) {
      .record-title-row { flex-direction: column; align-items: stretch; row-gap: 10px; }
      .record-id-group, .record-actions { justify-content: center; }
      .record-id-group { flex-wrap: wrap; }
      .record-title-line { flex-wrap: wrap; justify-content: flex-start; }
      .record-title { max-width: 100%; white-space: normal; text-align: left; }
      .vault-body { flex-direction: column; }
      .vault-sidebar { width: 100%; min-width: auto; border-right: none; border-bottom: 1px solid #e0e0e0; }
      .field-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DeviationDetailComponent implements OnInit {
  deviation: Deviation | null = null;
  statusOptions = Object.values(DeviationStatus);
  isStatusUpdating = false;
  rootCauseFormVisible = false;
  rootCauseSubmitting = false;
  rootCauseForm = {
    method: '5 Why Analysis',
    probableCause: '',
    rootCause: '',
    immediateActionsText: '',
    findings: '',
    conclusion: '',
  };
  impactLevelOptions = Object.values(ImpactLevel);
  riskLevelOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  dispositionDecisionOptions = Object.values(DispositionDecision);
  attachmentCategoryOptions = ['INVESTIGATION', 'EVIDENCE', 'RISK_ASSESSMENT', 'VALIDATION', 'REGULATORY', 'TRAINING', 'SUPPORTING_DATA', 'OTHER'];
  impactAssessmentFormVisible = false;
  impactAssessmentSubmitting = false;
  impactAssessmentForm = {
    productQualityImpact: ImpactLevel.NONE,
    patientSafetyImpact: ImpactLevel.NONE,
    regulatoryImpact: ImpactLevel.NONE,
    businessImpact: ImpactLevel.NONE,
    overallRiskLevel: 'LOW',
    affectedProductsText: '',
    affectedBatchesText: '',
    batchDisposition: '',
    justification: '',
  };
  dispositionFormVisible = false;
  dispositionSubmitting = false;
  dispositionForm = {
    decision: DispositionDecision.USE_AS_IS,
    justification: '',
    conditions: '',
    qaReviewComments: '',
    capaRequired: false,
  };
  selectedAttachmentFile: File | null = null;
  attachmentUploading = false;
  attachmentDragActive = false;
  attachmentForm = {
    category: 'OTHER',
    description: '',
  };
  previousDeviationId: string | null = null;
  nextDeviationId: string | null = null;
  private deviationList: Deviation[] = [];
  activeSection = 'general';
  expandedSections: { [key: string]: boolean } = {
    generalInfo: true, description: true, impactFlags: true,
    timelineInfo: true, productInfo: true, investigationInfo: true,
    rootCauseInfo: true, impactInfo: true, dispositionInfo: true,
    attachmentsInfo: true, auditInfo: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviationService: DeviationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.deviationService.getDeviations().subscribe((deviations) => {
      this.deviationList = deviations;
      this.updateNavigationState(this.deviation?.id || this.route.snapshot.paramMap.get('id'));
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadDeviation(id);
      }
    });
  }

  inputValue(event: Event): DeviationStatus {
    return (event.target as HTMLSelectElement).value as DeviationStatus;
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  showSection(section: string): void {
    this.activeSection = section;

    const expandableSection = `${section}Info`;
    if (expandableSection in this.expandedSections) {
      this.expandedSections[expandableSection] = true;
    }
  }

  backToList(): void {
    this.router.navigate(['/deviations/list']);
  }

  editDeviation(): void {
    if (!this.deviation) {
      return;
    }
    this.router.navigate(['/deviations/edit', this.deviation.id]);
  }

  navigateToDeviation(id: string | null): void {
    if (!id) {
      return;
    }
    this.router.navigate(['/deviations/detail', id]);
  }

  getAvailableActions(): WorkflowAction[] {
    if (!this.deviation) return [];
    const roles = getUserRoleCodes();
    const userId = getUserId();
    const isAssignee = this.deviation.assignedToId === userId;
    const isReporter = this.deviation.reportedById === userId;

    const actions: WorkflowAction[] = [];
    switch (this.deviation.status) {
      case DeviationStatus.REPORTED:
        actions.push({ label: 'Submit for Review', icon: 'send', targetStatus: DeviationStatus.UNDER_REVIEW, type: 'primary',
          requiredRoles: ['END_USER', 'OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.UNDER_REVIEW:
        actions.push({ label: 'Classify & Assign', icon: 'assignment', targetStatus: DeviationStatus.CLASSIFIED, type: 'primary',
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        actions.push({ label: 'Reject', icon: 'close', targetStatus: DeviationStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.CLASSIFIED:
        actions.push({ label: 'Start Investigation', icon: 'search', targetStatus: DeviationStatus.INVESTIGATION, type: 'primary',
          requiredRoles: ['REVIEWER', 'OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.INVESTIGATION:
        actions.push({ label: 'Submit Investigation', icon: 'fact_check', targetStatus: DeviationStatus.IMPACT_ASSESSMENT, type: 'primary',
          requiredRoles: ['REVIEWER', 'OWNER', 'QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        actions.push({ label: 'Return for Rework', icon: 'undo', targetStatus: DeviationStatus.REPORTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.IMPACT_ASSESSMENT:
        actions.push({ label: 'Submit for Disposition', icon: 'gavel', targetStatus: DeviationStatus.DISPOSITION, type: 'primary',
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.DISPOSITION:
        actions.push({ label: 'Approve Disposition', icon: 'verified', targetStatus: DeviationStatus.PENDING_CLOSURE, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_APPROVER', 'VAULT_ADMIN'] });
        actions.push({ label: 'Initiate CAPA', icon: 'assignment_turned_in', targetStatus: DeviationStatus.CAPA_INITIATED, type: 'secondary',
          requiredRoles: ['QA_REVIEWER', 'OWNER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        actions.push({ label: 'Reject', icon: 'close', targetStatus: DeviationStatus.REJECTED, type: 'danger', requiresComment: true,
          requiredRoles: ['QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.CAPA_INITIATED:
        actions.push({ label: 'Move to Pending Closure', icon: 'check_circle', targetStatus: DeviationStatus.PENDING_CLOSURE, type: 'primary',
          requiredRoles: ['QA_REVIEWER', 'QA_APPROVER', 'VAULT_ADMIN'] });
        break;
      case DeviationStatus.PENDING_CLOSURE:
        actions.push({ label: 'Close Deviation', icon: 'lock', targetStatus: DeviationStatus.CLOSED, type: 'primary', requiresESign: true,
          requiredRoles: ['QA_APPROVER', 'VAULT_ADMIN'] });
        break;
    }
    return actions.filter(a => !a.requiredRoles || a.requiredRoles.some(r => roles.includes(r)) || isAssignee);
  }

  executeWorkflowAction(action: WorkflowAction): void {
    if (!this.deviation || this.isStatusUpdating) return;

    if (action.requiresComment) {
      const comment = prompt('Please provide a reason:');
      if (!comment) return;
      this.performStatusChange(action.targetStatus, comment);
      return;
    }

    if (action.requiresESign) {
      const dialogRef = this.dialog.open(ESignatureDialogComponent, {
        width: '440px',
        disableClose: true,
        data: {
          recordNumber: this.deviation.deviationNumber,
          action: action.label,
          meaning: `${action.label} for ${this.deviation.deviationNumber}`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result?.signed) {
          this.performStatusChange(action.targetStatus, result.meaning);
        }
      });
      return;
    }

    this.performStatusChange(action.targetStatus);
  }

  private performStatusChange(status: DeviationStatus, comments?: string): void {
    if (!this.deviation) return;
    const previousStatus = this.deviation.status;
    this.isStatusUpdating = true;
    this.deviationService.updateDeviationStatus(this.deviation.id, status, comments).subscribe({
      next: () => {
        if (this.deviation) {
          this.deviation.status = status;
        }
        this.snackBar.open(`Deviation status changed to ${this.formatStatus(status)}`, 'Close', { duration: 3000 });
        this.loadDeviation(this.deviation!.id);
      },
      error: () => {
        if (this.deviation) {
          this.deviation.status = previousStatus;
        }
        this.isStatusUpdating = false;
        this.snackBar.open('Unable to update deviation status', 'Close', { duration: 4000 });
      },
      complete: () => {
        this.isStatusUpdating = false;
      },
    });
  }

  changeStatus(status: DeviationStatus): void {
    this.performStatusChange(status);
  }

  openRootCauseForm(): void {
    if (!this.deviation) {
      return;
    }

    const investigation = this.deviation.investigation;
    this.rootCauseForm = {
      method: investigation?.method || '5 Why Analysis',
      probableCause: investigation?.probableCause || '',
      rootCause: investigation?.rootCause || '',
      immediateActionsText: (investigation?.immediateActions || []).join('\n'),
      findings: investigation?.findings || '',
      conclusion: investigation?.conclusion || '',
    };
    this.rootCauseFormVisible = true;
    this.expandedSections['rootCauseInfo'] = true;
  }

  cancelRootCauseForm(): void {
    this.rootCauseFormVisible = false;
  }

  submitRootCauseAnalysis(): void {
    if (!this.deviation || this.rootCauseSubmitting) {
      return;
    }

    const rootCause = this.rootCauseForm.rootCause.trim();
    if (!rootCause) {
      this.snackBar.open('Root cause is required', 'Close', { duration: 3000 });
      return;
    }

    const investigatorId = this.deviation.assignedToId || this.deviation.reportedById;
    if (!investigatorId) {
      this.snackBar.open('Assign an investigator before creating root cause analysis', 'Close', { duration: 4000 });
      return;
    }

    this.rootCauseSubmitting = true;
    this.deviationService.submitInvestigation(this.deviation.id, {
      investigatorId,
      method: this.rootCauseForm.method,
      probableCause: this.rootCauseForm.probableCause.trim(),
      rootCause,
      immediateActions: this.rootCauseForm.immediateActionsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      findings: this.rootCauseForm.findings.trim(),
      conclusion: this.rootCauseForm.conclusion.trim(),
    }).subscribe({
      next: (deviation) => {
        this.deviation = deviation;
        this.rootCauseFormVisible = false;
        this.activeSection = 'rootcause';
        this.snackBar.open('Root cause analysis saved', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Unable to save root cause analysis', 'Close', { duration: 4000 });
      },
      complete: () => {
        this.rootCauseSubmitting = false;
      },
    });
  }

  openImpactAssessmentForm(): void {
    if (!this.deviation) {
      return;
    }

    const assessment = this.deviation.impactAssessment;
    this.impactAssessmentForm = {
      productQualityImpact: assessment?.productQualityImpact || ImpactLevel.NONE,
      patientSafetyImpact: assessment?.patientSafetyImpact || ImpactLevel.NONE,
      regulatoryImpact: assessment?.regulatoryImpact || ImpactLevel.NONE,
      businessImpact: assessment?.businessImpact || ImpactLevel.NONE,
      overallRiskLevel: assessment?.overallRiskLevel || 'LOW',
      affectedProductsText: (assessment?.affectedProducts || []).join('\n'),
      affectedBatchesText: (assessment?.affectedBatches || []).join('\n'),
      batchDisposition: assessment?.batchDisposition || '',
      justification: assessment?.justification || '',
    };
    this.impactAssessmentFormVisible = true;
    this.expandedSections['impactInfo'] = true;
  }

  cancelImpactAssessmentForm(): void {
    this.impactAssessmentFormVisible = false;
  }

  submitImpactAssessment(): void {
    if (!this.deviation || this.impactAssessmentSubmitting) {
      return;
    }

    const justification = this.impactAssessmentForm.justification.trim();
    if (!justification) {
      this.snackBar.open('Impact assessment justification is required', 'Close', { duration: 3000 });
      return;
    }

    this.impactAssessmentSubmitting = true;
    this.deviationService.submitImpactAssessment(this.deviation.id, {
      productQualityImpact: this.impactAssessmentForm.productQualityImpact,
      patientSafetyImpact: this.impactAssessmentForm.patientSafetyImpact,
      regulatoryImpact: this.impactAssessmentForm.regulatoryImpact,
      businessImpact: this.impactAssessmentForm.businessImpact,
      overallRiskLevel: this.impactAssessmentForm.overallRiskLevel,
      affectedProducts: this.toLines(this.impactAssessmentForm.affectedProductsText),
      affectedBatches: this.toLines(this.impactAssessmentForm.affectedBatchesText),
      batchDisposition: this.impactAssessmentForm.batchDisposition.trim(),
      justification,
    }).subscribe({
      next: (deviation) => {
        this.deviation = deviation;
        this.impactAssessmentFormVisible = false;
        this.activeSection = 'impact';
        this.snackBar.open('Impact assessment saved', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Unable to save impact assessment', 'Close', { duration: 4000 });
      },
      complete: () => {
        this.impactAssessmentSubmitting = false;
      },
    });
  }

  openDispositionForm(): void {
    if (!this.deviation) {
      return;
    }

    const disposition = this.deviation.disposition;
    this.dispositionForm = {
      decision: disposition?.decision || DispositionDecision.USE_AS_IS,
      justification: disposition?.justification || '',
      conditions: disposition?.conditions || '',
      qaReviewComments: disposition?.qaReviewComments || '',
      capaRequired: this.deviation.capaRequired || false,
    };
    this.dispositionFormVisible = true;
    this.expandedSections['dispositionInfo'] = true;
  }

  cancelDispositionForm(): void {
    this.dispositionFormVisible = false;
  }

  submitDisposition(): void {
    if (!this.deviation || this.dispositionSubmitting) {
      return;
    }

    const justification = this.dispositionForm.justification.trim();
    if (!justification) {
      this.snackBar.open('Disposition justification is required', 'Close', { duration: 3000 });
      return;
    }

    this.dispositionSubmitting = true;
    this.deviationService.submitDisposition(this.deviation.id, {
      decision: this.dispositionForm.decision,
      justification,
      conditions: this.dispositionForm.conditions.trim(),
      qaReviewComments: this.dispositionForm.qaReviewComments.trim(),
      capaRequired: this.dispositionForm.capaRequired,
    }).subscribe({
      next: (deviation) => {
        this.deviation = deviation;
        this.dispositionFormVisible = false;
        this.activeSection = 'disposition';
        this.snackBar.open('Disposition saved', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Unable to save disposition', 'Close', { duration: 4000 });
      },
      complete: () => {
        this.dispositionSubmitting = false;
      },
    });
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedAttachmentFile = input.files?.[0] || null;
    if (input) {
      input.value = '';
    }
  }

  onAttachmentDragOver(event: DragEvent): void {
    event.preventDefault();
    this.attachmentDragActive = true;
  }

  onAttachmentDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.attachmentDragActive = false;
  }

  onAttachmentDrop(event: DragEvent): void {
    event.preventDefault();
    this.attachmentDragActive = false;
    this.selectedAttachmentFile = event.dataTransfer?.files?.[0] || null;
  }

  clearSelectedAttachment(): void {
    this.selectedAttachmentFile = null;
    this.attachmentForm = {
      category: 'OTHER',
      description: '',
    };
  }

  uploadAttachment(): void {
    if (!this.deviation || !this.selectedAttachmentFile || this.attachmentUploading) {
      return;
    }

    this.attachmentUploading = true;
    this.deviationService
      .uploadAttachment(this.deviation.id, this.selectedAttachmentFile, this.attachmentForm.category, this.attachmentForm.description.trim())
      .subscribe({
        next: (attachment) => {
          if (this.deviation) {
            this.deviation = {
              ...this.deviation,
              attachments: [attachment, ...this.deviation.attachments],
            };
          }
          this.clearSelectedAttachment();
          this.snackBar.open('Attachment uploaded', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Unable to upload attachment', 'Close', { duration: 4000 });
        },
        complete: () => {
          this.attachmentUploading = false;
        },
      });
  }

  viewAttachment(attachmentId: string): void {
    this.deviationService.getAttachmentContent(attachmentId, false).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.snackBar.open('Unable to open attachment', 'Close', { duration: 4000 }),
    });
  }

  downloadAttachment(attachmentId: string): void {
    const attachment = this.deviation?.attachments.find((item) => item.id === attachmentId);
    this.deviationService.getAttachmentContent(attachmentId, true).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment?.fileName || 'attachment';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.snackBar.open('Unable to download attachment', 'Close', { duration: 4000 }),
    });
  }

  deleteAttachment(attachmentId: string): void {
    if (!this.deviation) {
      return;
    }

    this.deviationService.deleteAttachment(attachmentId).subscribe({
      next: () => {
        if (this.deviation) {
          this.deviation = {
            ...this.deviation,
            attachments: this.deviation.attachments.filter((attachment) => attachment.id !== attachmentId),
          };
        }
        this.snackBar.open('Attachment deleted', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Unable to delete attachment', 'Close', { duration: 4000 }),
    });
  }

  openAuditTrail(): void {
    if (!this.deviation) {
      return;
    }

    this.router.navigate(['/tools/audit-trail'], {
      queryParams: {
        recordType: 'DEVIATION',
        recordId: this.deviation.id,
      },
    });
  }

  copyRecordLink(): void {
    const link = window.location.href;

    if (!navigator.clipboard) {
      this.snackBar.open('Copy is not available in this browser context', 'Close', { duration: 3000 });
      return;
    }

    navigator.clipboard
      .writeText(link)
      .then(() => this.snackBar.open('Deviation record link copied', 'Close', { duration: 2500 }))
      .catch(() => this.snackBar.open('Unable to copy record link', 'Close', { duration: 3000 }));
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatDisposition(decision: string): string {
    return decision.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStepTooltip(step: { stepName: string; status: string; assignedTo?: string; startedAt?: Date; completedAt?: Date }): string {
    const parts = [step.stepName];
    if (step.assignedTo) parts.push('Assigned: ' + step.assignedTo);
    if (step.status === 'CURRENT' && step.startedAt) parts.push('Started: ' + new Date(step.startedAt).toLocaleDateString());
    if (step.status === 'COMPLETED' && step.completedAt) parts.push('Completed: ' + new Date(step.completedAt).toLocaleDateString());
    if (step.status === 'PENDING') parts.push('Pending');
    return parts.join('\n');
  }

  getStatusClass(status: DeviationStatus): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  isOverdue(): boolean {
    return (
      this.deviation !== null &&
      this.deviation.status !== DeviationStatus.CLOSED &&
      new Date(this.deviation.targetClosureDate) < new Date()
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private loadDeviation(id: string): void {
    this.deviationService.getDeviationById(id).subscribe((data) => {
      this.deviation = data || null;
      this.updateNavigationState(id);
    });
  }

  private updateNavigationState(id: string | null): void {
    if (!id || !this.deviationList.length) {
      this.previousDeviationId = null;
      this.nextDeviationId = null;
      return;
    }

    const index = this.deviationList.findIndex((item) => item.id === id);
    this.previousDeviationId = index > 0 ? this.deviationList[index - 1].id : null;
    this.nextDeviationId = index >= 0 && index < this.deviationList.length - 1 ? this.deviationList[index + 1].id : null;
  }

  private toLines(value: string): string[] {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

interface WorkflowAction {
  label: string;
  icon: string;
  targetStatus: DeviationStatus;
  type: 'primary' | 'secondary' | 'danger';
  requiresESign?: boolean;
  requiresComment?: boolean;
  requiredRoles?: string[];
}
