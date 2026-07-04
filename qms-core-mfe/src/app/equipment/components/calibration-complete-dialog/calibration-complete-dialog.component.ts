import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CalibrationRecord, EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'qms-calibration-complete-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Complete Calibration — {{ data.record.calibrationNumber }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Result</mat-label>
          <mat-select [(ngModel)]="result" name="result" required>
            <mat-option value="PASS">Pass</mat-option>
            <mat-option value="FAIL">Fail</mat-option>
            <mat-option value="PASS_WITH_ADJUSTMENT">Pass with Adjustment</mat-option>
            <mat-option value="OUT_OF_TOLERANCE">Out of Tolerance</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>As-Found Reading</mat-label>
          <textarea matInput [(ngModel)]="asFoundReading" name="asFoundReading" rows="2"
            placeholder="Reading before calibration"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>As-Left Reading</mat-label>
          <textarea matInput [(ngModel)]="asLeftReading" name="asLeftReading" rows="2"
            placeholder="Reading after calibration"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tolerance</mat-label>
          <input matInput [(ngModel)]="tolerance" name="tolerance" placeholder="e.g., ± 0.5°C">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Standard Used</mat-label>
          <input matInput [(ngModel)]="standardUsed" name="standardUsed">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Standard Certificate Reference</mat-label>
          <input matInput [(ngModel)]="standardCertificate" name="standardCertificate"
            placeholder="Certificate number or reference">
        </mat-form-field>
      </div>

      <mat-checkbox [(ngModel)]="adjustmentMade" style="margin: 12px 0; display: block;">Adjustment Made</mat-checkbox>

      <mat-form-field appearance="outline" class="full-width" *ngIf="adjustmentMade">
        <mat-label>Adjustment Details</mat-label>
        <textarea matInput [(ngModel)]="adjustmentDetails" name="adjustmentDetails" rows="2"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Certificate File Path</mat-label>
        <input matInput [(ngModel)]="certificatePath" name="certificatePath"
          placeholder="Path or URL to calibration certificate">
      </mat-form-field>

      <mat-checkbox [(ngModel)]="impactAssessmentRequired" style="margin: 8px 0; display: block;">
        Impact Assessment Required (for OOT results)
      </mat-checkbox>

      <mat-form-field appearance="outline" class="full-width" *ngIf="impactAssessmentRequired">
        <mat-label>Impact on Results</mat-label>
        <textarea matInput [(ngModel)]="impactOnResults" name="impactOnResults" rows="2"
          placeholder="Describe impact on previously tested results"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!result || saving" (click)="save()">
        {{ saving ? 'Saving...' : 'Complete Calibration' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .full-width { width: 100%; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class CalibrationCompleteDialogComponent {
  result = '';
  asFoundReading = '';
  asLeftReading = '';
  tolerance = '';
  standardUsed = '';
  standardCertificate = '';
  adjustmentMade = false;
  adjustmentDetails = '';
  certificatePath = '';
  impactAssessmentRequired = false;
  impactOnResults = '';
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<CalibrationCompleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { record: CalibrationRecord },
    private equipmentService: EquipmentService,
  ) {
    this.standardUsed = data.record.standardUsed || '';
  }

  save(): void {
    this.saving = true;
    this.equipmentService.updateCalibration(this.data.record.id, {
      status: 'COMPLETED',
      result: this.result,
      asFoundReading: this.asFoundReading || undefined,
      asLeftReading: this.asLeftReading || undefined,
      tolerance: this.tolerance || undefined,
      standardUsed: this.standardUsed || undefined,
      standardCertificate: this.standardCertificate || undefined,
      adjustmentMade: this.adjustmentMade,
      adjustmentDetails: this.adjustmentMade ? this.adjustmentDetails : undefined,
      certificatePath: this.certificatePath || undefined,
      impactAssessmentRequired: this.impactAssessmentRequired,
      impactOnResults: this.impactAssessmentRequired ? this.impactOnResults : undefined,
      performedDate: new Date().toISOString(),
    }).subscribe({
      next: () => { this.saving = false; this.dialogRef.close({ saved: true }); },
      error: (err) => { this.saving = false; console.error(err); alert('Failed to complete calibration.'); },
    });
  }
}
