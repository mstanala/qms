import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ChangeControlService } from '../../services/change-control.service';
import { ChangeImpactAssessment, ImpactRating } from '../../models/change-control.model';

const IMPACT_OPTIONS = [
  { value: 'NO_IMPACT', label: 'No Impact' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const RISK_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

@Component({
  selector: 'cc-impact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.existing ? 'Edit' : 'Create' }} Impact Assessment</h2>
    <mat-dialog-content>
      <div class="impact-grid">
        <mat-form-field appearance="outline" *ngFor="let field of impactFields">
          <mat-label>{{ field.label }}</mat-label>
          <mat-select [(ngModel)]="model[field.key]" required>
            <mat-option *ngFor="let opt of impactOptions" [value]="opt.value">{{ opt.label }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Overall Risk Level</mat-label>
        <mat-select [(ngModel)]="model['overallRiskLevel']" required>
          <mat-option *ngFor="let opt of riskOptions" [value]="opt.value">{{ opt.label }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Assessment Summary</mat-label>
        <textarea matInput [(ngModel)]="model['assessmentSummary']" rows="3" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid() || saving" (click)="save()">
        {{ saving ? 'Saving...' : 'Submit' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .impact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  `],
})
export class CcImpactDialogComponent {
  impactOptions = IMPACT_OPTIONS;
  riskOptions = RISK_OPTIONS;
  saving = false;

  impactFields = [
    { key: 'productQuality', label: 'Product Quality' },
    { key: 'patientSafety', label: 'Patient Safety' },
    { key: 'regulatoryCompliance', label: 'Regulatory Compliance' },
    { key: 'validationStatus', label: 'Validation Status' },
    { key: 'documentation', label: 'Documentation' },
    { key: 'training', label: 'Training' },
    { key: 'supplierQualification', label: 'Supplier Qualification' },
    { key: 'stability', label: 'Stability' },
  ];

  model: Record<string, string> = {
    productQuality: 'NO_IMPACT',
    patientSafety: 'NO_IMPACT',
    regulatoryCompliance: 'NO_IMPACT',
    validationStatus: 'NO_IMPACT',
    documentation: 'NO_IMPACT',
    training: 'NO_IMPACT',
    supplierQualification: 'NO_IMPACT',
    stability: 'NO_IMPACT',
    overallRiskLevel: 'LOW',
    assessmentSummary: '',
  };

  constructor(
    public dialogRef: MatDialogRef<CcImpactDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { changeRequestId: string; existing?: ChangeImpactAssessment },
    private ccService: ChangeControlService,
  ) {
    if (data.existing) {
      this.model = {
        productQuality: data.existing.productQuality || 'NO_IMPACT',
        patientSafety: data.existing.patientSafety || 'NO_IMPACT',
        regulatoryCompliance: data.existing.regulatoryCompliance || 'NO_IMPACT',
        validationStatus: data.existing.validationStatus || 'NO_IMPACT',
        documentation: data.existing.documentation || 'NO_IMPACT',
        training: data.existing.training || 'NO_IMPACT',
        supplierQualification: data.existing.supplierQualification || 'NO_IMPACT',
        stability: data.existing.stability || 'NO_IMPACT',
        overallRiskLevel: data.existing.overallRiskLevel || 'LOW',
        assessmentSummary: data.existing.assessmentSummary || '',
      };
    }
  }

  isValid(): boolean {
    return !!this.model['assessmentSummary']?.trim();
  }

  save(): void {
    this.saving = true;
    this.ccService.submitImpactAssessment(this.data.changeRequestId, this.model).subscribe({
      next: () => { this.saving = false; this.dialogRef.close({ saved: true }); },
      error: (err) => { this.saving = false; console.error(err); alert('Failed to submit impact assessment.'); },
    });
  }
}
