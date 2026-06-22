import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangeControlService } from '../../services/change-control.service';
import { ChangeRequest, ChangeType, ChangeCategory, ChangeClassification, ChangePriority, ImpactRating, FilingType } from '../../models/change-control.model';

@Component({
  selector: 'cc-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="cc-form-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button type="button" (click)="backToList()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ isEditMode ? 'Edit Change Request' : 'Initiate Change Request' }}</h1>
            <p class="subtitle">{{ isEditMode ? 'Update change control request details' : 'Create a new change control request for review and approval' }}</p>
          </div>
        </div>
      </div>

      <mat-stepper linear #stepper>
        <!-- Step 1: Change Description -->
        <mat-step [stepControl]="descriptionForm" label="Change Description">
          <mat-card class="form-card">
            <form [formGroup]="descriptionForm">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Change Request Title</mat-label>
                  <input matInput formControlName="title" placeholder="Brief title describing the proposed change">
                  <mat-error *ngIf="descriptionForm.get('title')?.hasError('required')">Title is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Detailed Description</mat-label>
                  <textarea matInput formControlName="description" rows="4"
                    placeholder="Describe the proposed change, current state, and proposed new state"></textarea>
                  <mat-error *ngIf="descriptionForm.get('description')?.hasError('required')">Description is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Justification / Rationale</mat-label>
                  <textarea matInput formControlName="justification" rows="3"
                    placeholder="Why is this change needed? Include business, quality, or regulatory reasons"></textarea>
                  <mat-error *ngIf="descriptionForm.get('justification')?.hasError('required')">Justification is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Change Type</mat-label>
                  <mat-select formControlName="type">
                    <mat-option *ngFor="let type of typeOptions" [value]="type">
                      {{ formatEnum(type) }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category">
                    <mat-option *ngFor="let cat of categoryOptions" [value]="cat">
                      {{ formatEnum(cat) }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Classification</mat-label>
                  <mat-select formControlName="classification">
                    <mat-option [value]="classifications.CRITICAL">Critical - Regulatory or patient safety impact</mat-option>
                    <mat-option [value]="classifications.MAJOR">Major - Significant quality system impact</mat-option>
                    <mat-option [value]="classifications.MINOR">Minor - Minimal impact, no regulatory implications</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option *ngFor="let p of priorityOptions" [value]="p">{{ p }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext [disabled]="descriptionForm.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 2: Scope & Assignment -->
        <mat-step [stepControl]="scopeForm" label="Scope & Assignment">
          <mat-card class="form-card">
            <form [formGroup]="scopeForm">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Plant Site</mat-label>
                  <mat-select formControlName="plantSite">
                    <mat-option value="Hyderabad Unit-1">Hyderabad Unit-1</mat-option>
                    <mat-option value="Hyderabad Unit-2">Hyderabad Unit-2</mat-option>
                    <mat-option value="Vizag Unit-1">Vizag Unit-1</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Initiating Department</mat-label>
                  <mat-select formControlName="department">
                    <mat-option value="Production">Production</mat-option>
                    <mat-option value="Quality Assurance">Quality Assurance</mat-option>
                    <mat-option value="Quality Control">Quality Control</mat-option>
                    <mat-option value="Engineering">Engineering</mat-option>
                    <mat-option value="Regulatory Affairs">Regulatory Affairs</mat-option>
                    <mat-option value="Supply Chain">Supply Chain</mat-option>
                    <mat-option value="R&D">R&D</mat-option>
                    <mat-option value="Packaging">Packaging</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Change Owner</mat-label>
                  <mat-select formControlName="changeOwnerName">
                    <mat-option value="Priya Sharma">Priya Sharma</mat-option>
                    <mat-option value="Lakshmi Devi">Lakshmi Devi</mat-option>
                    <mat-option value="Rajesh Kumar">Rajesh Kumar</mat-option>
                    <mat-option value="Mahesh Patil">Mahesh Patil</mat-option>
                    <mat-option value="Deepak Joshi">Deepak Joshi</mat-option>
                    <mat-option value="Suresh Menon">Suresh Menon</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>QA Reviewer</mat-label>
                  <mat-select formControlName="qaReviewerName">
                    <mat-option value="Dr. Ramesh Iyer">Dr. Ramesh Iyer</mat-option>
                    <mat-option value="Lakshmi Devi">Lakshmi Devi</mat-option>
                    <mat-option value="Kavitha Reddy">Kavitha Reddy</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Target Implementation Date</mat-label>
                  <input matInput [matDatepicker]="targetPicker" formControlName="targetImplementationDate">
                  <mat-datepicker-toggle matIconSuffix [for]="targetPicker"></mat-datepicker-toggle>
                  <mat-datepicker #targetPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Affected Areas (comma separated)</mat-label>
                  <input matInput formControlName="affectedAreasText" placeholder="e.g. Compression Area, QC Lab, Packaging">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Affected Processes (comma separated)</mat-label>
                  <input matInput formControlName="affectedProcessesText" placeholder="e.g. Granulation, Compression, In-Process Testing">
                </mat-form-field>
              </div>

              <div class="regulatory-section">
                <h4>Regulatory & Validation</h4>
                <div class="checkbox-row">
                  <mat-checkbox formControlName="regulatoryFilingRequired">Regulatory Filing Required</mat-checkbox>
                  <mat-checkbox formControlName="validationRequired">Validation Required</mat-checkbox>
                  <mat-checkbox formControlName="trainingRequired">Training Required</mat-checkbox>
                </div>

                <mat-form-field appearance="outline" *ngIf="scopeForm.get('regulatoryFilingRequired')?.value" class="full-width">
                  <mat-label>Filing Type</mat-label>
                  <mat-select formControlName="filingType">
                    <mat-option *ngFor="let ft of filingTypes" [value]="ft">{{ ft }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="scopeForm.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 3: Review & Submit -->
        <mat-step label="Review & Submit">
          <mat-card class="form-card">
            <h3>Review Change Request</h3>

            <div class="review-grid">
              <div class="review-item"><span class="review-label">Title</span><span class="review-value">{{ descriptionForm.get('title')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Type</span><span class="review-value">{{ formatEnum(descriptionForm.get('type')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Category</span><span class="review-value">{{ formatEnum(descriptionForm.get('category')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Classification</span><span class="review-value">{{ descriptionForm.get('classification')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Priority</span><span class="review-value">{{ descriptionForm.get('priority')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Plant Site</span><span class="review-value">{{ scopeForm.get('plantSite')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Department</span><span class="review-value">{{ scopeForm.get('department')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Change Owner</span><span class="review-value">{{ scopeForm.get('changeOwnerName')?.value }}</span></div>
              <div class="review-item full-width"><span class="review-label">Justification</span><span class="review-value">{{ descriptionForm.get('justification')?.value }}</span></div>
            </div>

            <div class="compliance-notice">
              <mat-icon>info</mat-icon>
              <span>This change request will be routed through multi-level review and approval workflow per SOP-QA-022 (Change Control Procedure). Electronic signatures will be captured at each approval stage per 21 CFR Part 11.</span>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
              <button mat-stroked-button *ngIf="!isEditMode" (click)="saveDraft()">
                <mat-icon>save</mat-icon> Save as Draft
              </button>
              <button mat-raised-button color="primary" (click)="submitChange()" style="background:#ED8B00;color:#fff">
                <mat-icon>{{ isEditMode ? 'save' : 'send' }}</mat-icon> {{ isEditMode ? 'Save Changes' : 'Submit for Review' }}
              </button>
            </div>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .cc-form-container { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { font-size: 14px; color: #666; margin: 2px 0 0; }
    .form-card { padding: 24px; margin-top: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
    .regulatory-section { margin-top: 20px; }
    .regulatory-section h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #333; }
    .checkbox-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
    .review-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
    .review-item { display: flex; flex-direction: column; gap: 4px; }
    .review-item.full-width { grid-column: 1 / -1; }
    .review-label { font-size: 12px; color: #666; font-weight: 500; }
    .review-value { font-size: 14px; color: #333; }
    .compliance-notice { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; background: rgba(44,95,124,0.06); border-left: 3px solid #2C5F7C; border-radius: 2px; margin: 16px 0; }
    .compliance-notice mat-icon { color: #2C5F7C; font-size: 20px; }
    .compliance-notice span { font-size: 13px; color: #333; }
    h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #333; }
  `],
})
export class CcFormComponent implements OnInit {
  typeOptions = Object.values(ChangeType);
  categoryOptions = Object.values(ChangeCategory);
  classifications = ChangeClassification;
  priorityOptions = Object.values(ChangePriority);
  filingTypes = Object.values(FilingType);
  isEditMode = false;
  private changeRequestId: string | null = null;

  descriptionForm: FormGroup;
  scopeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ccService: ChangeControlService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.descriptionForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      justification: ['', Validators.required],
      type: [ChangeType.PROCESS, Validators.required],
      category: [ChangeCategory.PRODUCT, Validators.required],
      classification: [ChangeClassification.MAJOR, Validators.required],
      priority: [ChangePriority.MEDIUM, Validators.required],
    });

    this.scopeForm = this.fb.group({
      plantSite: ['', Validators.required],
      department: ['', Validators.required],
      changeOwnerName: ['', Validators.required],
      qaReviewerName: [''],
      targetImplementationDate: ['', Validators.required],
      affectedAreasText: [''],
      affectedProcessesText: [''],
      regulatoryFilingRequired: [false],
      validationRequired: [false],
      trainingRequired: [false],
      filingType: [FilingType.NONE],
    });
  }

  ngOnInit(): void {
    this.changeRequestId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.changeRequestId;

    if (this.changeRequestId) {
      this.ccService.getChangeRequestById(this.changeRequestId).subscribe((changeRequest) => {
        if (changeRequest) {
          this.populateForms(changeRequest);
        }
      });
    }
  }

  formatEnum(value: string): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  backToList(): void {
    if (this.isEditMode && this.changeRequestId) {
      this.router.navigate(['/change-control/detail', this.changeRequestId]);
      return;
    }
    this.router.navigate(['/change-control/list']);
  }

  saveDraft(): void {
    const data = this.buildChangeData();
    this.ccService.createChangeRequest(data).subscribe((created) => {
      this.snackBar.open(`Draft ${created.changeNumber} saved`, 'OK', { duration: 4000 });
      this.router.navigate(['/change-control/list']);
    });
  }

  submitChange(): void {
    if (this.descriptionForm.valid && this.scopeForm.valid) {
      const data = this.buildChangeData();
      const request$ = this.isEditMode && this.changeRequestId
        ? this.ccService.updateChangeRequest(this.changeRequestId, data)
        : this.ccService.createChangeRequest(data);

      request$.subscribe((saved) => {
        this.snackBar.open(
          this.isEditMode ? `Change Request ${saved.changeNumber} updated successfully` : `Change Request ${saved.changeNumber} submitted for review`,
          'View',
          { duration: 5000 }
        );
        this.router.navigate(this.isEditMode ? ['/change-control/detail', saved.id] : ['/change-control/list']);
      });
    }
  }

  private populateForms(changeRequest: ChangeRequest): void {
    this.descriptionForm.patchValue({
      title: changeRequest.title,
      description: changeRequest.description,
      justification: changeRequest.justification,
      type: changeRequest.type,
      category: changeRequest.category,
      classification: changeRequest.classification,
      priority: changeRequest.priority,
    });

    this.scopeForm.patchValue({
      plantSite: changeRequest.plantSite,
      department: changeRequest.department,
      changeOwnerName: changeRequest.changeOwnerName,
      qaReviewerName: changeRequest.qaReviewerName || '',
      targetImplementationDate: changeRequest.targetImplementationDate,
      affectedAreasText: (changeRequest.affectedAreas || []).join(', '),
      affectedProcessesText: (changeRequest.affectedProcesses || []).join(', '),
      regulatoryFilingRequired: changeRequest.regulatoryFiling?.filingRequired ?? false,
      validationRequired: changeRequest.validationRequired,
      trainingRequired: changeRequest.trainingRequired,
      filingType: changeRequest.regulatoryFiling?.filingType || FilingType.NONE,
    });
  }

  private buildChangeData(): any {
    const desc = this.descriptionForm.value;
    const scope = this.scopeForm.value;
    return {
      ...desc,
      plantSite: scope.plantSite,
      department: scope.department,
      changeOwnerName: scope.changeOwnerName,
      changeOwnerId: 'USR-AUTO',
      qaReviewerName: scope.qaReviewerName,
      targetImplementationDate: scope.targetImplementationDate,
      affectedAreas: scope.affectedAreasText ? scope.affectedAreasText.split(',').map((s: string) => s.trim()) : [],
      affectedProcesses: scope.affectedProcessesText ? scope.affectedProcessesText.split(',').map((s: string) => s.trim()) : [],
      regulatoryFiling: {
        filingRequired: scope.regulatoryFilingRequired,
        filingType: scope.regulatoryFilingRequired ? scope.filingType : FilingType.NONE,
      },
      validationRequired: scope.validationRequired,
      trainingRequired: scope.trainingRequired,
      requestedById: 'USR-001',
      requestedByName: 'Current User',
      requestedDate: new Date(),
      impactAssessment: {
        productQuality: ImpactRating.NO_IMPACT,
        patientSafety: ImpactRating.NO_IMPACT,
        regulatoryCompliance: ImpactRating.NO_IMPACT,
        validationStatus: ImpactRating.NO_IMPACT,
        documentation: ImpactRating.NO_IMPACT,
        training: ImpactRating.NO_IMPACT,
        supplierQualification: ImpactRating.NO_IMPACT,
        stability: ImpactRating.NO_IMPACT,
        overallRiskLevel: 'LOW',
        assessmentSummary: 'Impact assessment pending',
      },
    };
  }
}
