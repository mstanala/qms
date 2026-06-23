import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
import { DeviationService } from '../../services/deviation.service';
import { Deviation, DeviationType, DeviationCategory, DeviationClassification } from '../../models/deviation.model';

@Component({
  selector: 'dev-form',
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
    <div class="deviation-form-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button type="button" (click)="backToList()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ isEditMode ? 'Edit Deviation' : 'Report Deviation' }}</h1>
            <p class="subtitle">{{ isEditMode ? 'Update deviation record details' : 'Create a new deviation record for tracking and investigation' }}</p>
          </div>
        </div>
      </div>

      <mat-stepper linear #stepper>
        <!-- Step 1: Event Details -->
        <mat-step [stepControl]="eventForm" label="Event Details">
          <mat-card class="form-card">
            <form [formGroup]="eventForm">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Deviation Title</mat-label>
                  <input matInput formControlName="title" placeholder="Brief description of the deviation event">
                  <mat-error *ngIf="eventForm.get('title')?.hasError('required')">Title is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Detailed Description</mat-label>
                  <textarea matInput formControlName="description" rows="5"
                    placeholder="Describe what happened, when, where, who was involved, and what was observed"></textarea>
                  <mat-error *ngIf="eventForm.get('description')?.hasError('required')">Description is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Deviation Type</mat-label>
                  <mat-select formControlName="type">
                    <mat-option [value]="deviationTypes.PLANNED">Planned</mat-option>
                    <mat-option [value]="deviationTypes.UNPLANNED">Unplanned</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category">
                    <mat-option *ngFor="let cat of categoryOptions" [value]="cat">
                      {{ formatCategory(cat) }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Initial Classification</mat-label>
                  <mat-select formControlName="classification">
                    <mat-option [value]="classifications.CRITICAL">Critical - Patient safety / regulatory impact</mat-option>
                    <mat-option [value]="classifications.MAJOR">Major - Significant quality impact</mat-option>
                    <mat-option [value]="classifications.MINOR">Minor - No significant quality impact</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date/Time Occurred</mat-label>
                  <input matInput [matDatepicker]="occurPicker" formControlName="occurredDate">
                  <mat-datepicker-toggle matIconSuffix [for]="occurPicker"></mat-datepicker-toggle>
                  <mat-datepicker #occurPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date/Time Detected</mat-label>
                  <input matInput [matDatepicker]="detectPicker" formControlName="detectedDate">
                  <mat-datepicker-toggle matIconSuffix [for]="detectPicker"></mat-datepicker-toggle>
                  <mat-datepicker #detectPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Source Area</mat-label>
                  <input matInput formControlName="sourceArea" placeholder="e.g., Production Floor, Cold Storage">
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext [disabled]="eventForm.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 2: Location & Product -->
        <mat-step [stepControl]="locationForm" label="Location & Product">
          <mat-card class="form-card">
            <form [formGroup]="locationForm">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Plant Site</mat-label>
                  <mat-select formControlName="plantSite" (selectionChange)="onPlantSiteChange($event.value)">
                    <mat-option *ngFor="let site of plantSites" [value]="site.id">{{ site.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Department</mat-label>
                  <mat-select formControlName="department">
                    <mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Area / Room</mat-label>
                  <input matInput formControlName="area" placeholder="e.g., Room 204, Compression Area">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Equipment (if applicable)</mat-label>
                  <input matInput formControlName="equipment" placeholder="Equipment ID or name">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Product (if applicable)</mat-label>
                  <input matInput formControlName="product" placeholder="Product name">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Batch Number (if applicable)</mat-label>
                  <input matInput formControlName="batchNumber" placeholder="Batch number">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Assigned To</mat-label>
                  <mat-select formControlName="assignedToId">
                    <mat-option *ngFor="let user of users" [value]="user.id">{{ user.displayName }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Target Closure Date</mat-label>
                  <input matInput [matDatepicker]="closurePicker" formControlName="targetClosureDate">
                  <mat-datepicker-toggle matIconSuffix [for]="closurePicker"></mat-datepicker-toggle>
                  <mat-datepicker #closurePicker></mat-datepicker>
                </mat-form-field>
              </div>

              <div class="impact-section">
                <h4>Initial Impact Assessment</h4>
                <div class="checkbox-row">
                  <mat-checkbox formControlName="gmpImpact">GMP Impact</mat-checkbox>
                  <mat-checkbox formControlName="patientSafetyImpact">Patient Safety Impact</mat-checkbox>
                  <mat-checkbox formControlName="regulatoryImpact">Regulatory Impact</mat-checkbox>
                </div>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="locationForm.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-card>
        </mat-step>

        <!-- Step 3: Review & Submit -->
        <mat-step label="Review & Submit">
          <mat-card class="form-card">
            <h3>Review Deviation Report</h3>

            <div class="review-grid">
              <div class="review-item"><span class="review-label">Title</span><span class="review-value">{{ eventForm.get('title')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Type</span><span class="review-value">{{ eventForm.get('type')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Category</span><span class="review-value">{{ formatCategory(eventForm.get('category')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Classification</span><span class="review-value">{{ eventForm.get('classification')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Plant Site</span><span class="review-value">{{ getPlantSiteName(locationForm.get('plantSite')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Department</span><span class="review-value">{{ getDepartmentName(locationForm.get('department')?.value) }}</span></div>
              <div class="review-item"><span class="review-label">Area</span><span class="review-value">{{ locationForm.get('area')?.value }}</span></div>
              <div class="review-item"><span class="review-label">Assigned To</span><span class="review-value">{{ getUserName(locationForm.get('assignedToId')?.value) }}</span></div>
              <div class="review-item full-width"><span class="review-label">Description</span><span class="review-value">{{ eventForm.get('description')?.value }}</span></div>
            </div>

            <div class="compliance-notice">
              <mat-icon>info</mat-icon>
              <span>This deviation report will be time-stamped and logged per 21 CFR Part 11 requirements. An electronic signature will be captured upon submission.</span>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
              <button mat-stroked-button (click)="saveDraft()" *ngIf="!isEditMode" [disabled]="eventForm.invalid">
                <mat-icon>save</mat-icon> Save as Draft
              </button>
              <button mat-raised-button color="primary" (click)="submitDeviation()" style="background:#ED8B00;color:#fff">
                <mat-icon>{{ isEditMode ? 'save' : 'send' }}</mat-icon> {{ isEditMode ? 'Save Changes' : 'Submit Deviation Report' }}
              </button>
            </div>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .deviation-form-container { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { font-size: 14px; color: #666; margin: 2px 0 0; }
    .form-card { padding: 24px; margin-top: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
    .impact-section { margin-top: 16px; }
    .impact-section h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #333; }
    .checkbox-row { display: flex; gap: 24px; flex-wrap: wrap; }
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
export class DeviationFormComponent implements OnInit {
  deviationTypes = DeviationType;
  classifications = DeviationClassification;
  categoryOptions = Object.values(DeviationCategory);
  isEditMode = false;
  deviationId: string | null = null;
  plantSites: { id: string; name: string }[] = [];
  departments: { id: string; name: string }[] = [];
  users: { id: string; displayName: string }[] = [];

  eventForm: FormGroup;
  locationForm: FormGroup;

  private readonly apiBase = 'http://localhost:8082/api/v1';

  constructor(
    private fb: FormBuilder,
    private deviationService: DeviationService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: [DeviationType.UNPLANNED, Validators.required],
      category: [DeviationCategory.PROCESS, Validators.required],
      classification: [DeviationClassification.MAJOR, Validators.required],
      occurredDate: [new Date(), Validators.required],
      detectedDate: [new Date(), Validators.required],
      sourceArea: ['', Validators.required],
    });

    this.locationForm = this.fb.group({
      plantSite: ['', Validators.required],
      department: ['', Validators.required],
      area: ['', Validators.required],
      equipment: [''],
      product: [''],
      batchNumber: [''],
      assignedToId: ['', Validators.required],
      targetClosureDate: ['', Validators.required],
      gmpImpact: [false],
      patientSafetyImpact: [false],
      regulatoryImpact: [false],
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.deviationId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.deviationId;

    if (this.deviationId) {
      this.deviationService.getDeviationById(this.deviationId).subscribe((deviation) => {
        if (!deviation) return;
        this.populateForms(deviation);
      });
    }
  }

  private loadReferenceData(): void {
    const headers = this.authHeaders();
    this.http.get<any[]>(`${this.apiBase}/admin/plant-sites`, { headers }).subscribe({
      next: (sites) => this.plantSites = (sites || []).map((s: any) => ({ id: s.id, name: s.name })),
      error: () => this.plantSites = [
        { id: 'b0000000-0000-0000-0000-000000000001', name: 'Genome Valley Manufacturing Unit' },
        { id: 'b0000000-0000-0000-0000-000000000002', name: 'Kukatpally QC Laboratory' },
        { id: 'b0000000-0000-0000-0000-000000000003', name: 'Medchal Central Warehouse' },
      ],
    });
    this.http.get<any[]>(`${this.apiBase}/admin/departments`, { headers }).subscribe({
      next: (depts) => this.departments = (depts || []).map((d: any) => ({ id: d.id, name: d.name })),
      error: () => this.departments = [
        { id: 'c0000000-0000-0000-0000-000000000001', name: 'Production' },
        { id: 'c0000000-0000-0000-0000-000000000002', name: 'Quality Assurance' },
        { id: 'c0000000-0000-0000-0000-000000000003', name: 'Quality Control' },
        { id: 'c0000000-0000-0000-0000-000000000004', name: 'Engineering & Maintenance' },
        { id: 'c0000000-0000-0000-0000-000000000005', name: 'Warehouse & Stores' },
      ],
    });
    this.http.get<any>(`${this.apiBase}/users`, { headers, params: new HttpParams().set('size', '100') }).subscribe({
      next: (page) => this.users = ((page?.content || page || []) as any[]).map((u: any) => ({
        id: u.id,
        displayName: u.displayName || `${u.firstName} ${u.lastName}`,
      })),
      error: () => this.users = [],
    });
  }

  onPlantSiteChange(siteId: string): void {
    const headers = this.authHeaders();
    this.http.get<any[]>(`${this.apiBase}/admin/departments`, { headers, params: new HttpParams().set('plantSiteId', siteId) }).subscribe({
      next: (depts) => this.departments = (depts || []).map((d: any) => ({ id: d.id, name: d.name })),
    });
  }

  getPlantSiteName(id: string): string {
    return this.plantSites.find(s => s.id === id)?.name || id || '';
  }

  getDepartmentName(id: string): string {
    return this.departments.find(d => d.id === id)?.name || id || '';
  }

  getUserName(id: string): string {
    return this.users.find(u => u.id === id)?.displayName || id || '';
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    return token ? new HttpHeaders({ Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }) : new HttpHeaders();
  }

  formatCategory(category: string): string {
    if (!category) return '';
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  backToList(): void {
    if (this.isEditMode && this.deviationId) {
      this.router.navigate(['/deviations/detail', this.deviationId]);
      return;
    }
    this.router.navigate(['/deviations/list']);
  }

  saveDraft(): void {
    if (this.eventForm.valid) {
      const formValues = { ...this.eventForm.value, ...this.locationForm.value };
      const deviationData = {
        ...formValues,
        plantSiteId: formValues.plantSite,
        departmentId: formValues.department,
        reportedDate: new Date(),
      };

      this.deviationService.createDeviation(deviationData).subscribe((created) => {
        this.snackBar.open(`Draft deviation ${created.deviationNumber} saved`, 'View', { duration: 5000 });
        this.router.navigate(['/deviations/detail', created.id]);
      });
    }
  }

  submitDeviation(): void {
    if (this.eventForm.valid && this.locationForm.valid) {
      const formValues = { ...this.eventForm.value, ...this.locationForm.value };
      const deviationData = {
        ...formValues,
        plantSiteId: formValues.plantSite,
        departmentId: formValues.department,
        reportedDate: new Date(),
      };

      if (this.isEditMode && this.deviationId) {
        this.deviationService.updateDeviation(this.deviationId, deviationData).subscribe((updated) => {
          this.snackBar.open(`Deviation ${updated.deviationNumber} updated successfully`, 'Close', { duration: 4000 });
          this.router.navigate(['/deviations/detail', updated.id]);
        });
        return;
      }

      this.deviationService.createDeviation(deviationData).subscribe((created) => {
        this.snackBar.open(`Deviation ${created.deviationNumber} reported successfully`, 'View', { duration: 5000 });
        this.router.navigate(['/deviations/list']);
      });
    }
  }

  private populateForms(deviation: Deviation): void {
    this.eventForm.patchValue({
      title: deviation.title,
      description: deviation.description,
      type: deviation.type,
      category: deviation.category,
      classification: deviation.classification,
      occurredDate: deviation.occurredDate,
      detectedDate: deviation.detectedDate,
      sourceArea: deviation.sourceArea,
    });

    this.locationForm.patchValue({
      plantSite: deviation.plantSite,
      department: deviation.department,
      area: deviation.area,
      equipment: deviation.equipment || '',
      product: deviation.product || '',
      batchNumber: deviation.batchNumber || '',
      assignedToId: deviation.assignedToId,
      targetClosureDate: deviation.targetClosureDate,
      gmpImpact: deviation.gmpImpact,
      patientSafetyImpact: deviation.patientSafetyImpact,
      regulatoryImpact: deviation.regulatoryImpact,
    });
  }
}
