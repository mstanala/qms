import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Supplier, SupplierService, WorkflowStep } from '../../services/supplier.service';

@Component({
  selector: 'qms-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule, MatProgressBarModule],
  template: `
    <div class="page" *ngIf="supplier">
      <div class="page-header">
        <div>
          <h1>{{ supplier.name }}</h1>
          <span class="subtitle">{{ supplier.supplierNumber }} &middot; {{ label(supplier.supplierType) }} &middot;
            <mat-chip [class]="'chip-' + supplier.status.toLowerCase()">{{ label(supplier.status) }}</mat-chip>
          </span>
        </div>
        <div class="actions">
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Overview -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Supplier Profile</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Status</label><mat-chip [class]="'chip-' + supplier.status.toLowerCase()">{{ label(supplier.status) }}</mat-chip></div>
                <div><label>Category</label><span>{{ supplier.category || '-' }}</span></div>
                <div><label>Legal Name</label><span>{{ supplier.legalName || '-' }}</span></div>
                <div><label>Owner</label><span>{{ supplier.owner?.displayName || 'Unassigned' }}</span></div>
                <div><label>Plant Site</label><span>{{ supplier.plantSite?.name || 'Corporate' }}</span></div>
                <div><label>Country</label><span>{{ supplier.country || '-' }}</span></div>
                <div><label>City</label><span>{{ supplier.city || '-' }}</span></div>
                <div><label>State</label><span>{{ supplier.state || '-' }}</span></div>
                <div><label>DUNS Number</label><span>{{ supplier.dunsNumber || '-' }}</span></div>
                <div><label>Requalification Frequency</label><span>{{ supplier.requalificationFrequencyMonths ? supplier.requalificationFrequencyMonths + ' months' : '-' }}</span></div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Contact Information</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Contact Name</label><span>{{ supplier.primaryContactName || '-' }}</span></div>
                <div><label>Email</label><span>{{ supplier.primaryContactEmail || '-' }}</span></div>
                <div><label>Phone</label><span>{{ supplier.primaryContactPhone || '-' }}</span></div>
                <div><label>Address</label><span>{{ supplier.address || '-' }}</span></div>
                <div><label>Postal Code</label><span>{{ supplier.postalCode || '-' }}</span></div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Certifications & Compliance</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>GMP Certification</label><span>{{ supplier.gmpCertification || 'None' }}</span></div>
                <div><label>ISO Certification</label><span>{{ supplier.isoCertification || 'None' }}</span></div>
                <div><label>FDA Registration</label><span>{{ supplier.fdaRegistration || 'None' }}</span></div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Qualification & Scores</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Qualification Date</label><span>{{ supplier.qualificationDate ? (supplier.qualificationDate | date:'mediumDate') : 'Pending' }}</span></div>
                <div><label>Next Requalification</label><span [class.overdue]="isOverdue(supplier.nextRequalificationDate)">{{ supplier.nextRequalificationDate ? (supplier.nextRequalificationDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Overall Score</label><span>{{ supplier.overallScore ?? '-' }}</span></div>
                <div><label>Quality Score</label><span>{{ supplier.qualityScore ?? '-' }}</span></div>
                <div><label>Delivery Score</label><span>{{ supplier.deliveryScore ?? '-' }}</span></div>
                <div><label>Compliance Score</label><span>{{ supplier.complianceScore ?? '-' }}</span></div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Qualification Workflow -->
        <mat-tab label="Qualification Workflow">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Supplier Qualification Process</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="qual-status">
                  <div><label>Current Status</label><mat-chip [class]="'chip-' + supplier.status.toLowerCase()">{{ label(supplier.status) }}</mat-chip></div>
                  <div><label>Current Step</label><span>{{ label(supplier.currentWorkflowStep || 'NOT_STARTED') }}</span></div>
                  <div><label>Qualification Date</label><span>{{ supplier.qualificationDate ? (supplier.qualificationDate | date:'mediumDate') : '-' }}</span></div>
                </div>
                <mat-divider style="margin:16px 0"></mat-divider>

                <!-- Probation Warning -->
                <div class="alert alert-warning" *ngIf="supplier.status === 'ON_PROBATION'">
                  <mat-icon>warning</mat-icon>
                  <span>This supplier is currently on probation. Corrective actions may be required before requalification.</span>
                </div>

                <!-- Disqualified Info -->
                <div class="alert alert-error" *ngIf="supplier.status === 'DISQUALIFIED'">
                  <mat-icon>block</mat-icon>
                  <span>This supplier has been disqualified and cannot be used for GxP materials or services.</span>
                </div>

                <!-- Rejected Info -->
                <div class="alert alert-error" *ngIf="supplier.status === 'REJECTED'">
                  <mat-icon>cancel</mat-icon>
                  <span>This supplier qualification was rejected during document review.</span>
                </div>

                <!-- Step Tracker -->
                <div class="qual-steps" *ngIf="supplier.status !== 'DISQUALIFIED' && supplier.status !== 'REJECTED'">
                  <!-- Step 1: Document Review -->
                  <div class="qual-step" [class.completed]="isStepComplete('DOCUMENT_REVIEW')" [class.current]="isStepCurrent('DOCUMENT_REVIEW')">
                    <mat-icon>{{ getStepIcon('DOCUMENT_REVIEW') }}</mat-icon>
                    <div>
                      <strong>Step 1: Document Review</strong>
                      <p>Review supplier documentation, certifications, and compliance records.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('DOCUMENT_REVIEW')">
                      <button mat-raised-button color="primary" (click)="docReviewDecision('AUDIT_REQUIRED')" [disabled]="transitioning">
                        <mat-icon>fact_check</mat-icon> Documents OK - Audit Required
                      </button>
                      <button mat-raised-button color="accent" (click)="docReviewDecision('NO_AUDIT')" [disabled]="transitioning">
                        <mat-icon>check</mat-icon> Documents OK - No Audit
                      </button>
                      <button mat-raised-button color="warn" (click)="docReviewDecision('REJECTED')" [disabled]="transitioning">
                        <mat-icon>close</mat-icon> Documents Rejected
                      </button>
                    </div>
                  </div>

                  <!-- Step 2: Supplier Audit -->
                  <div class="qual-step" [class.completed]="isStepComplete('AUDIT')" [class.current]="isStepCurrent('AUDIT')">
                    <mat-icon>{{ getStepIcon('AUDIT') }}</mat-icon>
                    <div>
                      <strong>Step 2: Supplier Audit</strong>
                      <p>Conduct on-site or remote audit to verify GMP compliance and quality systems.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('AUDIT')">
                      <button mat-raised-button color="primary" (click)="auditDecision('PASSED')" [disabled]="transitioning">
                        <mat-icon>check_circle</mat-icon> Audit Passed
                      </button>
                      <button mat-raised-button color="warn" (click)="auditDecision('FAILED')" [disabled]="transitioning">
                        <mat-icon>cancel</mat-icon> Audit Failed
                      </button>
                    </div>
                  </div>

                  <!-- Step 3: Corrective Action -->
                  <div class="qual-step" [class.completed]="isStepComplete('CORRECTIVE_ACTION')" [class.current]="isStepCurrent('CORRECTIVE_ACTION')">
                    <mat-icon>{{ getStepIcon('CORRECTIVE_ACTION') }}</mat-icon>
                    <div>
                      <strong>Step 3: Corrective Action</strong>
                      <p>Address audit findings and implement corrective actions before re-evaluation.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('CORRECTIVE_ACTION')">
                      <button mat-raised-button color="primary" (click)="completeCorrectiveAction()" [disabled]="transitioning">
                        <mat-icon>done_all</mat-icon> Corrective Actions Complete
                      </button>
                    </div>
                  </div>

                  <!-- Step 4: Qualification Approval -->
                  <div class="qual-step" [class.completed]="isStepComplete('APPROVAL')" [class.current]="isStepCurrent('APPROVAL')">
                    <mat-icon>{{ getStepIcon('APPROVAL') }}</mat-icon>
                    <div>
                      <strong>Step 4: Qualification Approval</strong>
                      <p>Final approval of supplier qualification by Quality Management.</p>
                    </div>
                    <div class="step-actions" *ngIf="isStepCurrent('APPROVAL')">
                      <button mat-raised-button color="primary" (click)="approveQualification()" [disabled]="transitioning">
                        <mat-icon>verified</mat-icon> Approve Qualification
                      </button>
                    </div>
                  </div>

                  <!-- Step 5: Qualified -->
                  <div class="qual-step" [class.completed]="supplier.status === 'QUALIFIED' || supplier.status === 'ON_PROBATION'">
                    <mat-icon>{{ (supplier.status === 'QUALIFIED' || supplier.status === 'ON_PROBATION') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <div>
                      <strong>Qualified</strong>
                      <p>Supplier is qualified and approved for use in GxP operations.</p>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Score Update Section (when qualified) -->
            <mat-card *ngIf="supplier.status === 'QUALIFIED' || supplier.status === 'ON_PROBATION'">
              <mat-card-header><mat-card-title>Supplier Performance Scores</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="score-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Quality Score (0-100)</mat-label>
                    <input matInput type="number" [(ngModel)]="scores.qualityScore" min="0" max="100">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Delivery Score (0-100)</mat-label>
                    <input matInput type="number" [(ngModel)]="scores.deliveryScore" min="0" max="100">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Compliance Score (0-100)</mat-label>
                    <input matInput type="number" [(ngModel)]="scores.complianceScore" min="0" max="100">
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="saveScores()" [disabled]="transitioning">
                    <mat-icon>save</mat-icon> Update Scores
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Requalification & Disqualify (when qualified or on-probation) -->
            <mat-card *ngIf="supplier.status === 'QUALIFIED' || supplier.status === 'ON_PROBATION'">
              <mat-card-header><mat-card-title>Supplier Lifecycle Actions</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="action-list">
                  <div class="action-item">
                    <div>
                      <strong>Start Requalification</strong>
                      <p>Initiate periodic requalification process to confirm continued compliance.</p>
                    </div>
                    <button mat-raised-button color="accent" (click)="requalify()" [disabled]="transitioning">
                      <mat-icon>replay</mat-icon> Start Requalification
                    </button>
                  </div>
                  <mat-divider></mat-divider>
                  <div class="action-item">
                    <div>
                      <strong>Disqualify Supplier</strong>
                      <p>Remove supplier qualification due to quality failures or compliance issues.</p>
                    </div>
                    <button mat-raised-button color="warn" (click)="disqualify()" [disabled]="transitioning">
                      <mat-icon>block</mat-icon> Disqualify
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 3: Actions -->
        <mat-tab label="Actions">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Edit Supplier Details</mat-card-title></mat-card-header>
              <mat-card-content class="edit-grid">
                <mat-form-field appearance="outline"><mat-label>Supplier Name</mat-label><input matInput [(ngModel)]="edit.name"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Contact Name</mat-label><input matInput [(ngModel)]="edit.primaryContactName"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput [(ngModel)]="edit.primaryContactEmail"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Contact Phone</mat-label><input matInput [(ngModel)]="edit.primaryContactPhone"></mat-form-field>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Certifications & Compliance</mat-card-title></mat-card-header>
              <mat-card-content class="edit-grid">
                <mat-form-field appearance="outline"><mat-label>GMP Certification</mat-label><input matInput [(ngModel)]="edit.gmpCertification"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>ISO Certification</mat-label><input matInput [(ngModel)]="edit.isoCertification"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>FDA Registration</mat-label><input matInput [(ngModel)]="edit.fdaRegistration"></mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Requalification Frequency (Months)</mat-label>
                  <input matInput type="number" [(ngModel)]="edit.requalificationFrequencyMonths" min="1" max="120">
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <div class="form-actions">
              <button mat-raised-button color="primary" (click)="saveEdits()"><mat-icon>save</mat-icon> Save Changes</button>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 4: Workflow History -->
        <mat-tab label="Workflow History">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Workflow History</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="timeline" *ngIf="workflowHistory.length">
                  <div class="timeline-item" *ngFor="let step of workflowHistory" [class.completed]="step.status === 'COMPLETED'" [class.current]="step.status === 'CURRENT'">
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
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}
    h1{margin:0;font-size:24px}
    .subtitle{color:#667085;display:flex;align-items:center;gap:8px}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    .tab-content{padding:16px 0}
    mat-card{margin-bottom:16px}
    .info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
    .info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}
    .overdue{color:#d32f2f;font-weight:600}
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
    .step-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .score-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;align-items:center}
    .action-list{display:flex;flex-direction:column;gap:16px}
    .action-item{display:flex;justify-content:space-between;align-items:center;gap:16px}
    .action-item p{margin:4px 0 0;color:#667085;font-size:13px}
    .edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:center}
    .form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:8px}
    .alert{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px}
    .alert-warning{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}
    .alert-error{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}
    .alert mat-icon{font-size:24px;width:24px;height:24px}
    .timeline{display:flex;flex-direction:column;gap:0}
    .timeline-item{display:flex;gap:12px;padding:12px 0;border-left:3px solid #e5e7eb;margin-left:14px;padding-left:20px;position:relative}
    .timeline-item.completed{border-left-color:#86efac}
    .timeline-item.current{border-left-color:#93c5fd}
    .timeline-icon{position:absolute;left:-16px;background:#fff}
    .timeline-icon mat-icon{font-size:24px;width:24px;height:24px}
    .timeline-content{flex:1}
    .timeline-content .meta{display:block;font-size:12px;color:#667085}
    .timeline-content p{margin:4px 0 0;font-size:13px;color:#374151}
    .empty{padding:16px;color:#667085}
    .chip-pending_qualification{background:#fef3c7!important;color:#92400e!important}
    .chip-under_evaluation{background:#dbeafe!important;color:#1e40af!important}
    .chip-corrective_action_required{background:#fff7ed!important;color:#9a3412!important}
    .chip-pending_approval{background:#f3e8ff!important;color:#6b21a8!important}
    .chip-qualified{background:#dcfce7!important;color:#166534!important}
    .chip-on_probation{background:#fef3c7!important;color:#92400e!important}
    .chip-disqualified{background:#fee2e2!important;color:#991b1b!important}
    .chip-rejected{background:#fee2e2!important;color:#991b1b!important}
    .chip-inactive{background:#f3f4f6!important;color:#374151!important}
  `],
})
export class SupplierDetailComponent implements OnInit {
  supplier: Supplier | null = null;
  workflowHistory: WorkflowStep[] = [];
  transitioning = false;

  edit = {
    name: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    gmpCertification: '',
    isoCertification: '',
    fdaRegistration: '',
    requalificationFrequencyMonths: 36,
  };

  scores = {
    qualityScore: 0,
    deliveryScore: 0,
    complianceScore: 0,
  };

  // Ordered workflow steps for the step tracker
  private readonly stepOrder = ['DOCUMENT_REVIEW', 'AUDIT', 'CORRECTIVE_ACTION', 'APPROVAL'];

  // Map supplier status to the current workflow step
  private readonly statusToStep: Record<string, string> = {
    'PENDING_QUALIFICATION': 'DOCUMENT_REVIEW',
    'UNDER_EVALUATION': 'AUDIT',
    'CORRECTIVE_ACTION_REQUIRED': 'CORRECTIVE_ACTION',
    'PENDING_APPROVAL': 'APPROVAL',
  };

  // Map currentWorkflowStep strings from backend to step tracker keys
  private readonly workflowStepMap: Record<string, string> = {
    'Document Review': 'DOCUMENT_REVIEW',
    'Supplier Audit': 'AUDIT',
    'Corrective Action': 'CORRECTIVE_ACTION',
    'Qualification Approval': 'APPROVAL',
  };

  constructor(private route: ActivatedRoute, private supplierService: SupplierService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.supplierService.getById(id).subscribe((supplier) => {
      this.supplier = supplier;
      this.edit = {
        name: supplier.name || '',
        primaryContactName: supplier.primaryContactName || '',
        primaryContactEmail: supplier.primaryContactEmail || '',
        primaryContactPhone: supplier.primaryContactPhone || '',
        gmpCertification: supplier.gmpCertification || '',
        isoCertification: supplier.isoCertification || '',
        fdaRegistration: supplier.fdaRegistration || '',
        requalificationFrequencyMonths: supplier.requalificationFrequencyMonths || 36,
      };
      this.scores = {
        qualityScore: supplier.qualityScore || 0,
        deliveryScore: supplier.deliveryScore || 0,
        complianceScore: supplier.complianceScore || 0,
      };
    });
    this.supplierService.getWorkflowHistory(id).subscribe(
      (h) => this.workflowHistory = h,
      () => this.workflowHistory = [],
    );
  }

  // --- Workflow Step Tracker Helpers ---

  private getCurrentStep(): string {
    if (!this.supplier) return '';
    // Map the backend currentWorkflowStep string to our step tracker key
    if (this.supplier.currentWorkflowStep) {
      const mapped = this.workflowStepMap[this.supplier.currentWorkflowStep];
      if (mapped) return mapped;
    }
    return this.statusToStep[this.supplier.status] || '';
  }

  isStepComplete(step: string): boolean {
    if (!this.supplier) return false;
    const status = this.supplier.status;
    if (status === 'QUALIFIED' || status === 'ON_PROBATION') return true;

    const currentStep = this.getCurrentStep();
    const currentIdx = this.stepOrder.indexOf(currentStep);
    const stepIdx = this.stepOrder.indexOf(step);

    if (currentIdx < 0 || stepIdx < 0) return false;
    return stepIdx < currentIdx;
  }

  isStepCurrent(step: string): boolean {
    if (!this.supplier) return false;
    const status = this.supplier.status;
    if (status === 'QUALIFIED' || status === 'ON_PROBATION' || status === 'DISQUALIFIED' || status === 'REJECTED') return false;

    const currentStep = this.getCurrentStep();

    return currentStep === step;
  }

  getStepIcon(step: string): string {
    if (this.isStepComplete(step)) return 'check_circle';
    if (this.isStepCurrent(step)) return 'radio_button_checked';
    return 'radio_button_unchecked';
  }

  // --- Workflow Transition Actions ---

  docReviewDecision(decision: string): void {
    if (!this.supplier) return;
    this.transitioning = true;
    if (decision === 'REJECTED') {
      this.supplierService.transitionStatus(this.supplier.id, 'REJECTED', { documentDecision: 'REJECTED' }).subscribe({
        next: () => { this.transitioning = false; this.snackBar.open('Supplier qualification rejected', 'Dismiss', { duration: 2500 }); this.load(); },
        error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
      });
    } else {
      this.supplierService.transitionStatus(this.supplier.id, 'UNDER_EVALUATION', { documentDecision: decision }).subscribe({
        next: () => { this.transitioning = false; this.snackBar.open('Document review completed', 'Dismiss', { duration: 2500 }); this.load(); },
        error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
      });
    }
  }

  auditDecision(result: string): void {
    if (!this.supplier) return;
    this.transitioning = true;
    const targetStatus = result === 'PASSED' ? 'PENDING_APPROVAL' : 'CORRECTIVE_ACTION_REQUIRED';
    this.supplierService.transitionStatus(this.supplier.id, targetStatus, { auditResult: result }).subscribe({
      next: () => { this.transitioning = false; this.snackBar.open('Audit result recorded', 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
    });
  }

  completeCorrectiveAction(): void {
    if (!this.supplier) return;
    this.transitioning = true;
    this.supplierService.transitionStatus(this.supplier.id, 'PENDING_APPROVAL').subscribe({
      next: () => { this.transitioning = false; this.snackBar.open('Corrective actions completed', 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
    });
  }

  approveQualification(): void {
    if (!this.supplier) return;
    this.transitioning = true;
    this.supplierService.transitionStatus(this.supplier.id, 'QUALIFIED').subscribe({
      next: () => { this.transitioning = false; this.snackBar.open('Supplier qualified successfully', 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
    });
  }

  disqualify(): void {
    if (!this.supplier) return;
    if (!confirm('Are you sure you want to disqualify this supplier? This will prevent use in GxP operations.')) return;
    this.transitioning = true;
    this.supplierService.transitionStatus(this.supplier.id, 'DISQUALIFIED').subscribe({
      next: () => { this.transitioning = false; this.snackBar.open('Supplier disqualified', 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Transition failed', 'Dismiss', { duration: 3500 }); },
    });
  }

  requalify(): void {
    if (!this.supplier) return;
    this.transitioning = true;
    this.supplierService.startRequalification(this.supplier.id).subscribe({
      next: () => { this.transitioning = false; this.snackBar.open('Requalification started', 'Dismiss', { duration: 2500 }); this.load(); },
      error: (err) => { this.transitioning = false; this.snackBar.open(err.error?.message || 'Failed to start requalification', 'Dismiss', { duration: 3500 }); },
    });
  }

  saveScores(): void {
    if (!this.supplier) return;
    this.transitioning = true;
    this.supplierService.updateScores(this.supplier.id, this.scores).subscribe({
      next: (supplier) => { this.supplier = supplier; this.transitioning = false; this.snackBar.open('Scores updated', 'Dismiss', { duration: 2500 }); },
      error: () => { this.transitioning = false; this.snackBar.open('Failed to update scores', 'Dismiss', { duration: 3500 }); },
    });
  }

  saveEdits(): void {
    if (!this.supplier) return;
    this.supplierService.update(this.supplier.id, this.edit as unknown as Record<string, unknown>).subscribe({
      next: (supplier) => { this.supplier = supplier; this.snackBar.open('Supplier updated', 'Dismiss', { duration: 2500 }); },
      error: () => this.snackBar.open('Failed to save changes', 'Dismiss', { duration: 3500 }),
    });
  }

  isOverdue(dateStr: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }
}
