import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviationService } from '../../services/deviation.service';
import { Deviation, DeviationStatus } from '../../models/deviation.model';

@Component({
  selector: 'dev-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
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
            <span class="status-badge" [ngClass]="getStatusClass(deviation.status)">{{ formatStatus(deviation.status) }}</span>
          </div>
          <div class="record-actions">
            <span class="record-meta">{{ deviation.type }} | {{ deviation.classification }}</span>
            <button mat-icon-button type="button" matTooltip="Attachments" (click)="showSection('attachments')">
              <mat-icon>attach_file</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Copy"><mat-icon>content_copy</mat-icon></button>
            <button mat-icon-button matTooltip="More"><mat-icon>more_horiz</mat-icon></button>
          </div>
        </div>
        <div class="record-title">{{ deviation.title }}</div>
      </div>

      <!-- Veeva Lifecycle Bar -->
      <div class="lifecycle-bar">
        <div class="lifecycle-step" *ngFor="let step of deviation.workflowHistory; let i = index"
             [ngClass]="{'completed': step.status === 'COMPLETED', 'current': step.status === 'CURRENT', 'pending': step.status === 'PENDING'}">
          <div class="lifecycle-fill"></div>
          <span class="lifecycle-label">{{ step.stepName }}</span>
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
                  <button class="vault-btn-create">+ Create</button>
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
              <ng-template #noImpact><p class="no-data-msg">Impact assessment has not been performed yet.</p></ng-template>
            </div>
          </div>

          <!-- Disposition Section -->
          <div class="vault-section" *ngIf="activeSection === 'disposition'">
            <div class="section-header" (click)="toggleSection('dispositionInfo')">
              <mat-icon>{{ expandedSections['dispositionInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Disposition</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['dispositionInfo']">
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
              <ng-template #noDisposition><p class="no-data-msg">Disposition decision has not been made yet.</p></ng-template>
            </div>
          </div>

          <!-- Attachments Section -->
          <div class="vault-section" *ngIf="activeSection === 'attachments'">
            <div class="section-header" (click)="toggleSection('attachmentsInfo')">
              <mat-icon>{{ expandedSections['attachmentsInfo'] ? 'expand_more' : 'chevron_right' }}</mat-icon>
              <span>Attachments ({{ deviation.attachments.length }})</span>
            </div>
            <div class="section-body" *ngIf="expandedSections['attachmentsInfo']">
              <div class="vault-table" *ngIf="deviation.attachments.length; else noAttach">
                <div class="table-toolbar"><button class="vault-btn-create">+ Add</button></div>
                <table>
                  <thead><tr><th>File Name</th><th>Uploaded By</th><th>Date</th><th>Size</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let att of deviation.attachments">
                      <td><a class="vault-link">{{ att.fileName }}</a></td>
                      <td>{{ att.uploadedBy }}</td>
                      <td>{{ att.uploadedDate | date:'dd-MMM-yyyy' }}</td>
                      <td>{{ formatFileSize(att.fileSize) }}</td>
                      <td>{{ att.description || '-' }}</td>
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
    .record-title-row { display: flex; justify-content: space-between; align-items: center; }
    .record-id-group { display: flex; align-items: center; gap: 12px; }
    .record-number { font-size: 22px; font-weight: 600; color: #333; }
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
    .record-actions { display: flex; align-items: center; gap: 4px; }
    .record-meta { font-size: 12px; color: #888; margin-right: 8px; }
    .record-title { font-size: 14px; color: #555; margin-top: 6px; }

    /* Veeva Lifecycle Bar */
    .lifecycle-bar { display: flex; margin: 0 -24px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
    .lifecycle-step { flex: 1; position: relative; text-align: center; padding: 10px 4px; font-size: 11px; font-weight: 500; color: #999; overflow: hidden; }
    .lifecycle-step .lifecycle-fill { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; }
    .lifecycle-step .lifecycle-label { position: relative; z-index: 1; }
    .lifecycle-step.completed .lifecycle-fill { background: #2C5F7C; }
    .lifecycle-step.completed { color: #fff; }
    .lifecycle-step.current .lifecycle-fill { background: #ED8B00; }
    .lifecycle-step.current { color: #fff; font-weight: 600; }
    .lifecycle-step.pending .lifecycle-fill { background: transparent; }

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
      .vault-body { flex-direction: column; }
      .vault-sidebar { width: 100%; min-width: auto; border-right: none; border-bottom: 1px solid #e0e0e0; }
      .field-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DeviationDetailComponent implements OnInit {
  deviation: Deviation | null = null;
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
    private deviationService: DeviationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.deviationService.getDeviationById(id).subscribe((data) => {
        this.deviation = data || null;
      });
    }
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

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatDisposition(decision: string): string {
    return decision.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
}
