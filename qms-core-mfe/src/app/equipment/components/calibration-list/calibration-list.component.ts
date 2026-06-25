import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { CalibrationRecord, Equipment, EquipmentService } from '../../services/equipment.service';
import { CalibrationCompleteDialogComponent } from '../calibration-complete-dialog/calibration-complete-dialog.component';

@Component({
  selector: 'qms-calibration-list',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Calibration Records</h1>
          <span *ngIf="equipment">{{ equipment.equipmentNumber }} &middot; {{ equipment.name }}</span>
        </div>
        <button mat-stroked-button routerLink="../"><mat-icon>arrow_back</mat-icon> Back to Equipment</button>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Schedule Calibration</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="schedule()" class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Calibration Type</mat-label>
              <mat-select formControlName="calibrationType">
                <mat-option value="ROUTINE">Routine</mat-option>
                <mat-option value="INITIAL">Initial</mat-option>
                <mat-option value="AFTER_REPAIR">After Repair</mat-option>
                <mat-option value="OUT_OF_TOLERANCE">Out of Tolerance</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Scheduled Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="scheduledDate" (click)="picker.open()">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Standard Used</mat-label><input matInput formControlName="standardUsed"></mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid"><mat-icon>event</mat-icon> Schedule</button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="records-card">
        <mat-card-header><mat-card-title>Records</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="records" class="full-table" *ngIf="records.length">
            <ng-container matColumnDef="calibrationNumber"><th mat-header-cell *matHeaderCellDef>Calibration #</th><td mat-cell *matCellDef="let row">{{ row.calibrationNumber }}</td></ng-container>
            <ng-container matColumnDef="calibrationType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ label(row.calibrationType) }}</td></ng-container>
            <ng-container matColumnDef="scheduledDate"><th mat-header-cell *matHeaderCellDef>Scheduled</th><td mat-cell *matCellDef="let row">{{ row.scheduledDate | date:'medium' }}</td></ng-container>
            <ng-container matColumnDef="performedDate"><th mat-header-cell *matHeaderCellDef>Performed</th><td mat-cell *matCellDef="let row">{{ row.performedDate ? (row.performedDate | date:'medium') : '-' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip [class]="'chip-' + row.status.toLowerCase()">{{ label(row.status) }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="result"><th mat-header-cell *matHeaderCellDef>Result</th><td mat-cell *matCellDef="let row">
              <mat-chip *ngIf="row.result" [class]="'chip-result-' + row.result.toLowerCase()">{{ label(row.result) }}</mat-chip>
              <span *ngIf="!row.result">-</span>
            </td></ng-container>
            <ng-container matColumnDef="standardUsed"><th mat-header-cell *matHeaderCellDef>Standard</th><td mat-cell *matCellDef="let row">{{ row.standardUsed || '-' }}</td></ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-stroked-button color="primary" (click)="openCompleteDialog(row)"
                  *ngIf="row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS'">
                  <mat-icon>check_circle</mat-icon> Complete
                </button>
                <button mat-stroked-button color="warn" (click)="cancelCalibration(row)"
                  *ngIf="row.status === 'SCHEDULED'">
                  Cancel
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <p class="empty" *ngIf="!records.length">No calibration records are scheduled for this equipment.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px}
    h1{margin:0;font-size:24px}.page-header span{color:#667085}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;align-items:center}
    .records-card{margin-top:16px}.full-table{width:100%}.empty{padding:16px;color:#667085}
    .chip-completed{background:#dcfce7!important;color:#166534!important}
    .chip-scheduled{background:#dbeafe!important;color:#1e40af!important}
    .chip-in_progress{background:#fef3c7!important;color:#92400e!important}
    .chip-failed,.chip-cancelled{background:#fee2e2!important;color:#991b1b!important}
    .chip-result-pass{background:#dcfce7!important;color:#166534!important}
    .chip-result-fail,.chip-result-out_of_tolerance{background:#fee2e2!important;color:#991b1b!important}
    .chip-result-pass_with_adjustment{background:#fef3c7!important;color:#92400e!important}
    td.mat-mdc-cell button+button{margin-left:8px}
  `],
})
export class CalibrationListComponent implements OnInit {
  equipment: Equipment | null = null;
  records: CalibrationRecord[] = [];
  columns = ['calibrationNumber', 'calibrationType', 'scheduledDate', 'performedDate', 'status', 'result', 'standardUsed', 'actions'];
  equipmentId = '';
  form = this.fb.group({
    calibrationType: ['ROUTINE', Validators.required],
    scheduledDate: ['', Validators.required],
    standardUsed: [''],
  });

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private equipmentService: EquipmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.equipmentId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.equipmentService.getById(this.equipmentId).subscribe((equipment) => this.equipment = equipment);
    this.equipmentService.listCalibrations(this.equipmentId).subscribe((records) => this.records = records);
  }

  schedule(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.equipmentService.createCalibration(this.equipmentId, {
      ...value,
      scheduledDate: this.toIso(value.scheduledDate || ''),
    }).subscribe({
      next: () => {
        this.form.reset({ calibrationType: 'ROUTINE', scheduledDate: '', standardUsed: '' });
        this.snackBar.open('Calibration scheduled', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('Unable to schedule calibration', 'Dismiss', { duration: 3500 }),
    });
  }

  openCompleteDialog(record: CalibrationRecord): void {
    const ref = this.dialog.open(CalibrationCompleteDialogComponent, {
      width: '700px',
      data: { record },
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Calibration completed', 'Dismiss', { duration: 2500 });
        this.load();
      }
    });
  }

  cancelCalibration(record: CalibrationRecord): void {
    if (!confirm('Cancel this calibration?')) return;
    this.equipmentService.updateCalibration(record.id, { status: 'CANCELLED' }).subscribe({
      next: () => {
        this.snackBar.open('Calibration cancelled', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('Unable to cancel calibration', 'Dismiss', { duration: 3500 }),
    });
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }

  private toIso(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
