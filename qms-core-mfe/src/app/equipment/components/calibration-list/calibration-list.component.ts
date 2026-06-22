import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { CalibrationRecord, Equipment, EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'qms-calibration-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatTableModule],
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
            <mat-form-field appearance="outline"><mat-label>Scheduled Date</mat-label><input matInput type="datetime-local" formControlName="scheduledDate"></mat-form-field>
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
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip>{{ label(row.status) }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="result"><th mat-header-cell *matHeaderCellDef>Result</th><td mat-cell *matCellDef="let row">{{ label(row.result || 'PENDING') }}</td></ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-stroked-button (click)="markComplete(row)">Mark Complete</button>
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
  `],
})
export class CalibrationListComponent implements OnInit {
  equipment: Equipment | null = null;
  records: CalibrationRecord[] = [];
  columns = ['calibrationNumber', 'calibrationType', 'scheduledDate', 'status', 'result', 'actions'];
  equipmentId = '';
  form = this.fb.group({
    calibrationType: ['ROUTINE', Validators.required],
    scheduledDate: ['', Validators.required],
    standardUsed: [''],
  });

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private equipmentService: EquipmentService, private snackBar: MatSnackBar) {}

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

  markComplete(record: CalibrationRecord): void {
    this.equipmentService.updateCalibration(record.id, {
      status: 'COMPLETED',
      result: 'PASS',
      performedDate: new Date().toISOString(),
    }).subscribe(() => {
      this.snackBar.open('Calibration completed', 'Dismiss', { duration: 2500 });
      this.load();
    });
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }

  private toIso(value: string): string {
    return new Date(value).toISOString();
  }
}
