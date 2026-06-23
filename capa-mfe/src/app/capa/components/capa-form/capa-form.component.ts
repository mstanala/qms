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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CapaService } from '../../services/capa.service';
import { Capa, CapaType, CapaSourceType, CapaPriority } from '../../models/capa.model';

@Component({
  selector: 'capa-form',
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
    MatSnackBarModule,
  ],
  template: `
    <div class="capa-form-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button type="button" (click)="backToList()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ isEditMode ? 'Edit CAPA' : 'Initiate New CAPA' }}</h1>
            <p class="subtitle">{{ isEditMode ? 'Update CAPA record details' : 'Create a new Corrective and Preventive Action record' }}</p>
          </div>
        </div>
      </div>

      <mat-stepper linear #stepper>
        <!-- Step 1: Basic Information -->
        <mat-step [stepControl]="basicForm" label="Basic Information">
          <mat-card class="form-card">
            <form [formGroup]="basicForm">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>CAPA Title</mat-label>
                  <input matInput formControlName="title" placeholder="Brief description of the quality issue">
                  <mat-error *ngIf="basicForm.get('title')?.hasError('required')">Title is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="4"
                    placeholder="Detailed description of the issue, including what was observed, when, and impact"></textarea>
                  <mat-error *ngIf="basicForm.get('description')?.hasError('required')">Description is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>CAPA Type</mat-label>
                  <mat-select formControlName="type">
                    <mat-option [value]="capaTypes.CORRECTIVE">Corrective</mat-option>
                    <mat-option [value]="capaTypes.PREVENTIVE">Preventive</mat-option>
                    <mat-option [value]="capaTypes.BOTH">Corrective & Preventive</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option [value]="priorities.CRITICAL">Critical</mat-option>
                    <mat-option [value]="priorities.HIGH">High</mat-option>
                    <mat-option [value]="priorities.MEDIUM">Medium</mat-option>
                    <mat-option [value]="priorities.LOW">Low</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Source Type</mat-label>
                  <mat-select formControlName="sourceType">
                    <mat-option *ngFor="let src of sourceTypes" [value]="src">
                      {{ formatSource(src) }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Source Reference</mat-label>
                  <input matInput formControlName="sourceReference" placeholder="e.g., DEV-2025-001">
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext [disabled]="basicForm.invalid">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 2: Assignment & Location -->
        <mat-step [stepControl]="assignmentForm" label="Assignment & Location">
          <mat-card class="form-card">
            <form [formGroup]="assignmentForm">
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
                  <mat-label>Department</mat-label>
                  <mat-select formControlName="department">
                    <mat-option value="Production">Production</mat-option>
                    <mat-option value="Quality Control">Quality Control</mat-option>
                    <mat-option value="Quality Assurance">Quality Assurance</mat-option>
                    <mat-option value="Warehouse">Warehouse</mat-option>
                    <mat-option value="Engineering">Engineering</mat-option>
                    <mat-option value="R&D">R&D</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>CAPA Owner</mat-label>
                  <mat-select formControlName="ownerName">
                    <mat-option value="Rajesh Kumar">Rajesh Kumar</mat-option>
                    <mat-option value="Priya Sharma">Priya Sharma</mat-option>
                    <mat-option value="Lakshmi Devi">Lakshmi Devi</mat-option>
                    <mat-option value="Kavitha Reddy">Kavitha Reddy</mat-option>
                    <mat-option value="Venkat Rao">Venkat Rao</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Target Completion Date</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="targetCompletionDate">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Product (if applicable)</mat-label>
                  <input matInput formControlName="product" placeholder="Product name">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Batch Number (if applicable)</mat-label>
                  <input matInput formControlName="batchNumber" placeholder="Batch number">
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="assignmentForm.invalid">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 3: Review & Submit -->
        <mat-step label="Review & Submit">
          <mat-card class="form-card">
            <h3>Review CAPA Information</h3>

            <div class="review-section">
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">Title</span>
                  <span class="review-value">{{ basicForm.get('title')?.value }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Type</span>
                  <span class="review-value">{{ basicForm.get('type')?.value }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Priority</span>
                  <span class="review-value">{{ basicForm.get('priority')?.value }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Source</span>
                  <span class="review-value">{{ formatSource(basicForm.get('sourceType')?.value) }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Plant Site</span>
                  <span class="review-value">{{ assignmentForm.get('plantSite')?.value }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Department</span>
                  <span class="review-value">{{ assignmentForm.get('department')?.value }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Owner</span>
                  <span class="review-value">{{ assignmentForm.get('ownerName')?.value }}</span>
                </div>
                <div class="review-item full-width">
                  <span class="review-label">Description</span>
                  <span class="review-value">{{ basicForm.get('description')?.value }}</span>
                </div>
              </div>
            </div>

            <div class="compliance-notice">
              <mat-icon>info</mat-icon>
              <span>By submitting this CAPA, an audit trail entry will be created per 21 CFR Part 11 requirements. Electronic signature will be recorded.</span>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-raised-button color="primary" (click)="submitCapa()">
                <mat-icon>{{ isEditMode ? 'save' : 'send' }}</mat-icon>
                {{ isEditMode ? 'Save Changes' : 'Submit CAPA' }}
              </button>
            </div>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .capa-form-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
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

    .form-card {
      padding: 24px;
      margin-top: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .step-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .review-section {
      margin: 16px 0 24px;
    }

    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .review-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .review-item.full-width {
      grid-column: 1 / -1;
    }

    .review-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .review-value {
      font-size: 14px;
      color: #333;
    }

    .compliance-notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(44,95,124,0.06);
      border-left: 3px solid #2C5F7C;
      border-radius: 2px;
      margin: 16px 0;
    }

    .compliance-notice mat-icon {
      color: #2C5F7C;
      font-size: 20px;
    }

    .compliance-notice span {
      font-size: 13px;
      color: #333;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
      color: #333;
    }
  `],
})
export class CapaFormComponent implements OnInit {
  capaTypes = CapaType;
  priorities = CapaPriority;
  sourceTypes = Object.values(CapaSourceType);
  isEditMode = false;
  private capaId: string | null = null;

  basicForm: FormGroup;
  assignmentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private capaService: CapaService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.basicForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: [CapaType.BOTH, Validators.required],
      priority: [CapaPriority.MEDIUM, Validators.required],
      sourceType: [CapaSourceType.DEVIATION, Validators.required],
      sourceReference: [''],
    });

    this.assignmentForm = this.fb.group({
      plantSite: ['', Validators.required],
      department: ['', Validators.required],
      ownerName: ['', Validators.required],
      targetCompletionDate: ['', Validators.required],
      product: [''],
      batchNumber: [''],
    });
  }

  ngOnInit(): void {
    this.capaId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.capaId;

    if (this.capaId) {
      this.capaService.getCapaById(this.capaId).subscribe((capa) => {
        if (capa) {
          this.populateForms(capa);
        }
      });
    }
  }

  formatSource(source: string): string {
    if (!source) return '';
    return source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  backToList(): void {
    if (this.isEditMode && this.capaId) {
      this.router.navigate(['/capa/detail', this.capaId]);
      return;
    }
    this.router.navigate(['/capa/list']);
  }

  submitCapa(): void {
    if (this.basicForm.valid && this.assignmentForm.valid) {
      const capaData = {
        ...this.basicForm.value,
        ...this.assignmentForm.value,
        initiatedDate: new Date(),
        dueDate: this.assignmentForm.get('targetCompletionDate')?.value,
        initiatorId: 'USR-001',
        initiatorName: 'Current User',
        ownerId: 'USR-002',
      };

      const request$ = this.isEditMode && this.capaId
        ? this.capaService.updateCapa(this.capaId, capaData)
        : this.capaService.createCapa(capaData);

      request$.subscribe((saved) => {
        this.snackBar.open(
          this.isEditMode ? `CAPA ${saved.capaNumber} updated successfully` : `CAPA ${saved.capaNumber} initiated successfully`,
          'View',
          { duration: 5000 }
        );
        this.router.navigate(this.isEditMode ? ['/capa/detail', saved.id] : ['/capa/list']);
      });
    }
  }

  private populateForms(capa: Capa): void {
    this.basicForm.patchValue({
      title: capa.title,
      description: capa.description,
      type: capa.type,
      priority: capa.priority,
      sourceType: capa.sourceType,
      sourceReference: capa.sourceReference || '',
    });

    this.assignmentForm.patchValue({
      plantSite: capa.plantSite,
      department: capa.department || capa.assignedDepartment,
      ownerName: capa.ownerName,
      targetCompletionDate: capa.targetCompletionDate || capa.dueDate,
      product: capa.product || '',
      batchNumber: capa.batchNumber || '',
    });
  }
}
