import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditService } from '../../services/audit.service';
import { CoreLookupService, PlantSiteOption, UserOption, DepartmentOption } from '../../../shared/core-lookup.service';

@Component({
  selector: 'qms-audit-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatStepperModule, MatSnackBarModule,
  ],
  template: `
    <div class="form-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1>Schedule New Audit</h1>
            <p class="subtitle">Create and schedule an audit for execution</p>
          </div>
        </div>
      </div>

      <mat-stepper linear #stepper>
        <!-- Step 1: Basic Info -->
        <mat-step [stepControl]="basicForm" label="Audit Details">
          <mat-card class="form-card">
            <form [formGroup]="basicForm">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Audit Title</mat-label>
                  <input matInput formControlName="title" placeholder="e.g., GMP Compliance Audit - Production Unit 1">
                  <mat-error *ngIf="basicForm.get('title')?.hasError('required')">Title is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe the objective and scope of this audit"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Audit Type</mat-label>
                  <mat-select formControlName="auditType">
                    <mat-option value="INTERNAL">Internal</mat-option>
                    <mat-option value="EXTERNAL">External</mat-option>
                    <mat-option value="SUPPLIER">Supplier</mat-option>
                    <mat-option value="SELF_INSPECTION">Self Inspection</mat-option>
                    <mat-option value="REGULATORY_INSPECTION">Regulatory Inspection</mat-option>
                    <mat-option value="FOR_CAUSE">For Cause</mat-option>
                  </mat-select>
                  <mat-error *ngIf="basicForm.get('auditType')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category">
                    <mat-option value="GMP">GMP Compliance</mat-option>
                    <mat-option value="ISO">ISO Standards</mat-option>
                    <mat-option value="SAFETY">Safety</mat-option>
                    <mat-option value="ENVIRONMENTAL">Environmental</mat-option>
                    <mat-option value="DATA_INTEGRITY">Data Integrity</mat-option>
                    <mat-option value="PROCESS">Process</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option value="CRITICAL">Critical</mat-option>
                    <mat-option value="HIGH">High</mat-option>
                    <mat-option value="MEDIUM">Medium</mat-option>
                    <mat-option value="LOW">Low</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Frequency</mat-label>
                  <mat-select formControlName="frequency">
                    <mat-option value="ANNUAL">Annual</mat-option>
                    <mat-option value="SEMI_ANNUAL">Semi-Annual</mat-option>
                    <mat-option value="QUARTERLY">Quarterly</mat-option>
                    <mat-option value="ONE_TIME">One-Time</mat-option>
                    <mat-option value="AS_NEEDED">As Needed</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Audit Scope</mat-label>
                  <textarea matInput formControlName="auditScope" rows="3"
                    placeholder="Areas, departments, processes, and systems to be audited"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Standards Reference</mat-label>
                  <input matInput formControlName="standardsReference"
                    placeholder="e.g., ICH Q10, 21 CFR 211, EU GMP Annex 15">
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext [disabled]="basicForm.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 2: Schedule & Assignment -->
        <mat-step [stepControl]="scheduleForm" label="Schedule & Team">
          <mat-card class="form-card">
            <form [formGroup]="scheduleForm">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Plant Site</mat-label>
                  <mat-select formControlName="plantSiteId">
                    <mat-option *ngFor="let ps of plantSites" [value]="ps.id">{{ ps.name }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="scheduleForm.get('plantSiteId')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Auditee Department</mat-label>
                  <mat-select formControlName="auditeeDepartmentId">
                    <mat-option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Lead Auditor</mat-label>
                  <mat-select formControlName="leadAuditorId">
                    <mat-option *ngFor="let u of users" [value]="u.id">{{ u.displayName || u.username }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="scheduleForm.get('leadAuditorId')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Auditee Contact</mat-label>
                  <mat-select formControlName="auditeeContactId">
                    <mat-option *ngFor="let u of users" [value]="u.id">{{ u.displayName || u.username }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Scheduled Start Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="scheduledStartDate" (click)="startPicker.open()">
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                  <mat-error *ngIf="scheduleForm.get('scheduledStartDate')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Scheduled End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="scheduledEndDate" (click)="endPicker.open()">
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                  <mat-error *ngIf="scheduleForm.get('scheduledEndDate')?.hasError('required')">Required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Area to be Audited</mat-label>
                  <input matInput formControlName="areaAudited" placeholder="e.g., Production Floor, QC Lab, Warehouse">
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="scheduleForm.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 3: Review & Submit -->
        <mat-step label="Review & Submit">
          <mat-card class="form-card">
            <h3>Review Audit Information</h3>
            <div class="review-grid">
              <div class="review-item"><span class="review-label">Title</span><span class="review-value">{{ basicForm.get('title')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Audit Type</span><span class="review-value">{{ formatEnum(basicForm.get('auditType')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Category</span><span class="review-value">{{ basicForm.get('category')?.value || '—' }}</span></div>
              <div class="review-item"><span class="review-label">Priority</span><span class="review-value">{{ basicForm.get('priority')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Frequency</span><span class="review-value">{{ formatEnum(basicForm.get('frequency')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Plant Site</span><span class="review-value">{{ getPlantSiteName(scheduleForm.get('plantSiteId')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Lead Auditor</span><span class="review-value">{{ getUserName(scheduleForm.get('leadAuditorId')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Start Date</span><span class="review-value">{{ scheduleForm.get('scheduledStartDate')?.value | date:'dd-MMM-yyyy' }}</span></div>
              <div class="review-item"><span class="review-label">End Date</span><span class="review-value">{{ scheduleForm.get('scheduledEndDate')?.value | date:'dd-MMM-yyyy' }}</span></div>
              <div class="review-item full-width"><span class="review-label">Scope</span><span class="review-value">{{ basicForm.get('auditScope')?.value || '—' }}</span></div>
            </div>

            <div class="compliance-notice">
              <mat-icon>info</mat-icon>
              <span>A Flowable workflow process will be initiated for this audit. All status transitions will be tracked in the audit trail.</span>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
              <button mat-raised-button color="primary" (click)="submitAudit()" [disabled]="submitting">
                <mat-icon>send</mat-icon> Schedule Audit
              </button>
            </div>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .form-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { font-size: 14px; color: #666; margin: 2px 0 0; }
    .form-card { padding: 24px; margin-top: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
    h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #333; }
    .review-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
    .review-item { display: flex; flex-direction: column; gap: 4px; }
    .review-item.full-width { grid-column: 1 / -1; }
    .review-label { font-size: 12px; color: #666; font-weight: 500; }
    .review-value { font-size: 14px; color: #333; }
    .compliance-notice { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; background: rgba(44,95,124,0.06); border-left: 3px solid #2C5F7C; border-radius: 2px; margin: 16px 0; }
    .compliance-notice mat-icon { color: #2C5F7C; font-size: 20px; }
    .compliance-notice span { font-size: 13px; color: #333; }
  `],
})
export class AuditFormComponent implements OnInit {
  basicForm: FormGroup;
  scheduleForm: FormGroup;
  users: UserOption[] = [];
  plantSites: PlantSiteOption[] = [];
  departments: DepartmentOption[] = [];
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private lookup: CoreLookupService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.basicForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      auditType: ['INTERNAL', Validators.required],
      category: [''],
      priority: ['MEDIUM'],
      frequency: ['ANNUAL'],
      auditScope: [''],
      standardsReference: [''],
    });

    this.scheduleForm = this.fb.group({
      plantSiteId: ['', Validators.required],
      auditeeDepartmentId: [''],
      leadAuditorId: ['', Validators.required],
      auditeeContactId: [''],
      scheduledStartDate: ['', Validators.required],
      scheduledEndDate: ['', Validators.required],
      areaAudited: [''],
    });
  }

  ngOnInit(): void {
    this.lookup.users().subscribe(r => this.users = r.content);
    this.lookup.plantSites().subscribe(r => this.plantSites = r);
    this.lookup.departments().subscribe(r => this.departments = r);
  }

  goBack(): void {
    this.router.navigate(['/audit/list']);
  }

  formatEnum(value: string | null): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getPlantSiteName(id: string): string {
    return this.plantSites.find(p => p.id === id)?.name || '—';
  }

  getUserName(id: string): string {
    const u = this.users.find(u => u.id === id);
    return u?.displayName || u?.username || '—';
  }

  submitAudit(): void {
    if (this.basicForm.invalid || this.scheduleForm.invalid) return;
    this.submitting = true;

    const data = {
      ...this.basicForm.value,
      ...this.scheduleForm.value,
      scheduledStartDate: new Date(this.scheduleForm.value.scheduledStartDate).toISOString(),
      scheduledEndDate: new Date(this.scheduleForm.value.scheduledEndDate).toISOString(),
    };

    this.auditService.createAudit(data).subscribe({
      next: (audit) => {
        this.snackBar.open(`Audit ${audit.auditNumber} scheduled successfully`, 'View', { duration: 5000 })
          .onAction().subscribe(() => this.router.navigate(['/audit', audit.id]));
        this.router.navigate(['/audit/list']);
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to create audit', 'OK', { duration: 4000 });
      },
    });
  }
}
