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
import { MatIconModule } from '@angular/material/icon';
import { ChangeControlService } from '../../services/change-control.service';

interface Criterion {
  criterion: string;
  met: boolean;
  evidence: string;
}

@Component({
  selector: 'cc-effectiveness-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatCheckboxModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Submit Effectiveness Review</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Review Date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="reviewDate" name="reviewDate" (click)="picker.open()" required>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <h4>Effectiveness Criteria</h4>
      <div class="criteria-section">
        <div class="criterion-row" *ngFor="let c of criteria; let i = index">
          <mat-form-field appearance="outline" class="criterion-field">
            <mat-label>Criterion</mat-label>
            <input matInput [(ngModel)]="c.criterion" required>
          </mat-form-field>
          <mat-checkbox [(ngModel)]="c.met">Met</mat-checkbox>
          <mat-form-field appearance="outline" class="evidence-field">
            <mat-label>Evidence</mat-label>
            <input matInput [(ngModel)]="c.evidence" required>
          </mat-form-field>
          <button mat-icon-button color="warn" (click)="removeCriterion(i)" *ngIf="criteria.length > 1">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
        <button mat-stroked-button (click)="addCriterion()">
          <mat-icon>add</mat-icon> Add Criterion
        </button>
      </div>

      <mat-checkbox [(ngModel)]="overallEffective" style="margin: 16px 0; display: block;">Overall Effective</mat-checkbox>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Summary</mat-label>
        <textarea matInput [(ngModel)]="summary" rows="3" required></textarea>
      </mat-form-field>

      <mat-checkbox [(ngModel)]="followUpRequired">Follow-up Required</mat-checkbox>

      <mat-form-field appearance="outline" class="full-width" *ngIf="followUpRequired" style="margin-top: 12px;">
        <mat-label>Follow-up Actions</mat-label>
        <textarea matInput [(ngModel)]="followUpActions" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid() || saving" (click)="save()">
        {{ saving ? 'Submitting...' : 'Submit Review' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .criteria-section { margin-bottom: 16px; }
    .criterion-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .criterion-field { flex: 1; }
    .evidence-field { flex: 1; }
    h4 { margin: 16px 0 8px; font-weight: 600; }
  `],
})
export class CcEffectivenessDialogComponent {
  reviewDate: Date | null = null;
  criteria: Criterion[] = [{ criterion: '', met: true, evidence: '' }];
  overallEffective = true;
  summary = '';
  followUpRequired = false;
  followUpActions = '';
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<CcEffectivenessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { changeRequestId: string },
    private ccService: ChangeControlService,
  ) {}

  addCriterion(): void {
    this.criteria.push({ criterion: '', met: true, evidence: '' });
  }

  removeCriterion(i: number): void {
    this.criteria.splice(i, 1);
  }

  isValid(): boolean {
    return !!this.reviewDate && !!this.summary.trim() && this.criteria.every(c => c.criterion.trim() && c.evidence.trim());
  }

  save(): void {
    this.saving = true;
    this.ccService.submitEffectivenessReview(this.data.changeRequestId, {
      reviewDate: this.reviewDate!.toISOString(),
      overallEffective: this.overallEffective,
      summary: this.summary,
      followUpRequired: this.followUpRequired,
      followUpActions: this.followUpRequired ? this.followUpActions : undefined,
      criteria: this.criteria,
    }).subscribe({
      next: () => { this.saving = false; this.dialogRef.close({ saved: true }); },
      error: (err) => { this.saving = false; console.error(err); alert('Failed to submit review.'); },
    });
  }
}
