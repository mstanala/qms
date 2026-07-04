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
import { CapaService } from '../../services/capa.service';

interface DialogData {
  capaId: string;
  actionType: 'CORRECTIVE' | 'PREVENTIVE';
}

const USERS = [
  { id: 'd0000000-0000-0000-0000-000000000001', name: 'Rajesh Kumar' },
  { id: 'd0000000-0000-0000-0000-000000000002', name: 'Srinivas Rao' },
  { id: 'd0000000-0000-0000-0000-000000000003', name: 'Priya Sharma' },
  { id: 'd0000000-0000-0000-0000-000000000004', name: 'Suresh Reddy' },
  { id: 'd0000000-0000-0000-0000-000000000005', name: 'Anitha Rao' },
  { id: 'd0000000-0000-0000-0000-000000000006', name: 'Lakshmi Devi' },
  { id: 'd0000000-0000-0000-0000-000000000007', name: 'Venkat Naidu' },
  { id: 'd0000000-0000-0000-0000-000000000008', name: 'Mohammad Ali' },
  { id: 'd0000000-0000-0000-0000-000000000009', name: 'Kavitha Krishnan' },
  { id: 'd0000000-0000-0000-0000-000000000010', name: 'Ravi Teja' },
];

@Component({
  selector: 'capa-action-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>Add {{ data.actionType === 'CORRECTIVE' ? 'Corrective' : 'Preventive' }} Action</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="description" name="description" rows="3" required></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Assign To</mat-label>
        <mat-select [(ngModel)]="assignedToId" name="assignedToId" required>
          <mat-option *ngFor="let user of users" [value]="user.id">{{ user.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Due Date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="dueDate" name="dueDate" (click)="picker.open()" required>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid() || saving" (click)="save()">
        {{ saving ? 'Saving...' : 'Add Action' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class CapaActionDialogComponent {
  description = '';
  assignedToId = '';
  dueDate: Date | null = null;
  saving = false;
  users = USERS;

  constructor(
    public dialogRef: MatDialogRef<CapaActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private capaService: CapaService,
  ) {}

  isValid(): boolean {
    return !!this.description.trim() && !!this.assignedToId && !!this.dueDate;
  }

  save(): void {
    if (!this.isValid()) return;
    this.saving = true;
    this.capaService.addAction(this.data.capaId, {
      description: this.description,
      type: this.data.actionType,
      assignedToId: this.assignedToId,
      dueDate: this.dueDate!.toISOString(),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close({ saved: true });
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to add action:', err);
        alert('Failed to add action. Please try again.');
      },
    });
  }
}
