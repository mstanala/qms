import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MaintenanceRecord, EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'qms-maintenance-complete-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Complete Maintenance - {{ data.record.maintenanceNumber }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Work Performed</mat-label>
        <textarea matInput [(ngModel)]="workPerformed" rows="3" placeholder="Describe maintenance activities performed"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Parts Replaced</mat-label>
        <textarea matInput [(ngModel)]="partsReplaced" rows="2" placeholder="List any parts replaced (if applicable)"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Downtime (Hours)</mat-label>
        <input matInput type="number" [(ngModel)]="downtimeHours" placeholder="0">
      </mat-form-field>

      <mat-checkbox [(ngModel)]="impactOnProduction" style="display:block;margin:8px 0">Impact on Production</mat-checkbox>
      <mat-checkbox [(ngModel)]="requalificationRequired" style="display:block;margin:8px 0">Re-qualification Required</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="saving" (click)="save()">
        {{ saving ? 'Saving...' : 'Complete Maintenance' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width{width:100%}`],
})
export class MaintenanceCompleteDialogComponent {
  workPerformed = '';
  partsReplaced = '';
  downtimeHours: number | null = null;
  impactOnProduction = false;
  requalificationRequired = false;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<MaintenanceCompleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { record: MaintenanceRecord },
    private equipmentService: EquipmentService,
  ) {}

  save(): void {
    this.saving = true;
    this.equipmentService.completeMaintenance(this.data.record.id, {
      workPerformed: this.workPerformed || undefined,
      partsReplaced: this.partsReplaced || undefined,
      downtimeHours: this.downtimeHours || undefined,
      impactOnProduction: this.impactOnProduction,
      requalificationRequired: this.requalificationRequired,
    }).subscribe({
      next: () => { this.saving = false; this.dialogRef.close({ saved: true }); },
      error: () => { this.saving = false; alert('Failed to complete maintenance.'); },
    });
  }
}
