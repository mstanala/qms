import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ChangeControlService } from '../../services/change-control.service';

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
  selector: 'cc-approver-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Add Approver</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Approver</mat-label>
        <mat-select [(ngModel)]="approverId" required>
          <mat-option *ngFor="let user of users" [value]="user.id">{{ user.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Role</mat-label>
        <mat-select [(ngModel)]="role" required>
          <mat-option value="QA Head">QA Head</mat-option>
          <mat-option value="Production Head">Production Head</mat-option>
          <mat-option value="Plant Director">Plant Director</mat-option>
          <mat-option value="Regulatory Affairs">Regulatory Affairs</mat-option>
          <mat-option value="QC Head">QC Head</mat-option>
          <mat-option value="Approver">Approver</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Department</mat-label>
        <input matInput [(ngModel)]="department">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Approval Order</mat-label>
        <input matInput type="number" [(ngModel)]="approvalOrder" min="1">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid() || saving" (click)="save()">
        {{ saving ? 'Saving...' : 'Add Approver' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class CcApproverDialogComponent {
  approverId = '';
  role = 'Approver';
  department = '';
  approvalOrder = 1;
  saving = false;
  users = USERS;

  constructor(
    public dialogRef: MatDialogRef<CcApproverDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { changeRequestId: string },
    private ccService: ChangeControlService,
  ) {}

  isValid(): boolean {
    return !!this.approverId && !!this.role;
  }

  save(): void {
    this.saving = true;
    this.ccService.addApprover(this.data.changeRequestId, {
      approverId: this.approverId,
      role: this.role,
      department: this.department || undefined,
      approvalOrder: this.approvalOrder,
    }).subscribe({
      next: () => { this.saving = false; this.dialogRef.close({ saved: true }); },
      error: (err) => { this.saving = false; console.error(err); alert('Failed to add approver.'); },
    });
  }
}
