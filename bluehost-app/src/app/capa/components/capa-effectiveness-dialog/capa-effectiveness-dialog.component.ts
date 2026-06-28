import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CapaService } from '../../services/capa.service';

interface DialogData {
  capaId: string;
}

@Component({
  selector: 'capa-effectiveness-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>Submit Effectiveness Check</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Effectiveness Criteria</mat-label>
        <textarea matInput [(ngModel)]="criteria" rows="2" required placeholder="e.g., No recurrence of issue for 60 days"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Check Date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="checkDate" name="checkDate" (click)="picker.open()" required>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Result</mat-label>
        <mat-select [(ngModel)]="result" required>
          <mat-option value="EFFECTIVE">Effective</mat-option>
          <mat-option value="NOT_EFFECTIVE">Not Effective</mat-option>
          <mat-option value="PARTIALLY_EFFECTIVE">Partially Effective</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Evidence</mat-label>
        <textarea matInput [(ngModel)]="evidence" rows="2" required placeholder="Describe the evidence supporting this assessment"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Comments</mat-label>
        <textarea matInput [(ngModel)]="comments" rows="2"></textarea>
      </mat-form-field>

      <mat-checkbox [(ngModel)]="requiresRecurrence">Requires periodic recurrence check</mat-checkbox>

      <mat-form-field appearance="outline" class="full-width" *ngIf="requiresRecurrence" style="margin-top: 12px;">
        <mat-label>Recurrence Interval (months)</mat-label>
        <input matInput type="number" [(ngModel)]="recurrenceMonths" min="1" max="24">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid() || saving" (click)="save()">
        {{ saving ? 'Submitting...' : 'Submit' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class CapaEffectivenessDialogComponent {
  criteria = '';
  checkDate: Date | null = null;
  result = '';
  evidence = '';
  comments = '';
  requiresRecurrence = false;
  recurrenceMonths = 3;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<CapaEffectivenessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private capaService: CapaService,
  ) {}

  isValid(): boolean {
    return !!this.criteria.trim() && !!this.checkDate && !!this.result && !!this.evidence.trim();
  }

  save(): void {
    if (!this.isValid()) return;
    this.saving = true;
    this.capaService.submitEffectivenessCheck(this.data.capaId, {
      criteria: this.criteria,
      checkDate: this.checkDate!.toISOString(),
      result: this.result,
      evidence: this.evidence,
      comments: this.comments,
      requiresRecurrence: this.requiresRecurrence,
      recurrenceMonths: this.requiresRecurrence ? this.recurrenceMonths : undefined,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close({ saved: true });
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to submit effectiveness check:', err);
        alert('Failed to submit. Please try again.');
      },
    });
  }
}
