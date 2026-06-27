import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Equipment, EquipmentService, MaintenanceRecord } from '../../services/equipment.service';
import { MaintenanceCompleteDialogComponent } from '../maintenance-complete-dialog/maintenance-complete-dialog.component';

@Component({
  selector: 'qms-maintenance-list',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Maintenance Records</h1>
          <span *ngIf="equipment">{{ equipment.equipmentNumber }} &middot; {{ equipment.name }}</span>
        </div>
        <button mat-stroked-button routerLink="../"><mat-icon>arrow_back</mat-icon> Back to Equipment</button>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Schedule Maintenance</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="schedule()" class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Maintenance Type</mat-label>
              <mat-select formControlName="maintenanceType">
                <mat-option value="PREVENTIVE">Preventive</mat-option>
                <mat-option value="CORRECTIVE">Corrective</mat-option>
                <mat-option value="BREAKDOWN">Breakdown</mat-option>
                <mat-option value="PREDICTIVE">Predictive</mat-option>
                <mat-option value="CONDITION_BASED">Condition Based</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Scheduled Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="scheduledDate" (click)="picker.open()">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                <mat-option value="CRITICAL">Critical</mat-option>
                <mat-option value="HIGH">High</mat-option>
                <mat-option value="MEDIUM">Medium</mat-option>
                <mat-option value="LOW">Low</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid"><mat-icon>event</mat-icon> Schedule</button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="records-card">
        <mat-card-header><mat-card-title>Records</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="records" class="full-table" *ngIf="records.length">
            <ng-container matColumnDef="maintenanceNumber"><th mat-header-cell *matHeaderCellDef>Maintenance #</th><td mat-cell *matCellDef="let row">{{ row.maintenanceNumber }}</td></ng-container>
            <ng-container matColumnDef="maintenanceType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ label(row.maintenanceType) }}</td></ng-container>
            <ng-container matColumnDef="priority"><th mat-header-cell *matHeaderCellDef>Priority</th><td mat-cell *matCellDef="let row"><mat-chip [class]="'chip-priority-' + row.priority.toLowerCase()">{{ row.priority }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="scheduledDate"><th mat-header-cell *matHeaderCellDef>Scheduled</th><td mat-cell *matCellDef="let row">{{ row.scheduledDate | date:'medium' }}</td></ng-container>
            <ng-container matColumnDef="completedDate"><th mat-header-cell *matHeaderCellDef>Completed</th><td mat-cell *matCellDef="let row">{{ row.completedDate ? (row.completedDate | date:'medium') : '-' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip [class]="'chip-' + row.status.toLowerCase()">{{ label(row.status) }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-stroked-button color="primary" (click)="openCompleteDialog(row)"
                  *ngIf="row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS'">
                  <mat-icon>check_circle</mat-icon> Complete
                </button>
                <button mat-stroked-button color="warn" (click)="reportBreakdown(row)"
                  *ngIf="row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS'">
                  <mat-icon>warning</mat-icon> Breakdown
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <p class="empty" *ngIf="!records.length">No maintenance records for this equipment.</p>
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
    .chip-deferred,.chip-cancelled{background:#fee2e2!important;color:#991b1b!important}
    .chip-priority-critical{background:#fee2e2!important;color:#991b1b!important}
    .chip-priority-high{background:#fff7ed!important;color:#9a3412!important}
    .chip-priority-medium{background:#fef3c7!important;color:#92400e!important}
    .chip-priority-low{background:#f0fdf4!important;color:#166534!important}
    td.mat-mdc-cell button+button{margin-left:8px}
  `],
})
export class MaintenanceListComponent implements OnInit {
  equipment: Equipment | null = null;
  records: MaintenanceRecord[] = [];
  columns = ['maintenanceNumber', 'maintenanceType', 'priority', 'scheduledDate', 'completedDate', 'status', 'actions'];
  equipmentId = '';
  form = this.fb.group({
    maintenanceType: ['PREVENTIVE', Validators.required],
    scheduledDate: ['', Validators.required],
    priority: ['MEDIUM'],
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
    this.equipmentService.getById(this.equipmentId).subscribe((eq) => this.equipment = eq);
    this.equipmentService.listMaintenance(this.equipmentId).subscribe((r) => this.records = r);
  }

  schedule(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.equipmentService.createMaintenance(this.equipmentId, {
      ...value,
      scheduledDate: this.toIso(value.scheduledDate || ''),
    }).subscribe({
      next: () => {
        this.form.reset({ maintenanceType: 'PREVENTIVE', scheduledDate: '', priority: 'MEDIUM' });
        this.snackBar.open('Maintenance scheduled', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('Unable to schedule maintenance', 'Dismiss', { duration: 3500 }),
    });
  }

  openCompleteDialog(record: MaintenanceRecord): void {
    const ref = this.dialog.open(MaintenanceCompleteDialogComponent, { width: '600px', data: { record } });
    ref.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.snackBar.open('Maintenance completed', 'Dismiss', { duration: 2500 });
        this.load();
      }
    });
  }

  reportBreakdown(record: MaintenanceRecord): void {
    if (!confirm('Report equipment breakdown? This will set the equipment to OUT_OF_SERVICE and a deviation should be created.')) return;
    this.equipmentService.reportBreakdown(record.id).subscribe({
      next: () => {
        this.snackBar.open('Breakdown reported - equipment set to Out of Service', 'Dismiss', { duration: 3500 });
        this.load();
      },
      error: () => this.snackBar.open('Unable to report breakdown', 'Dismiss', { duration: 3500 }),
    });
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }

  private toIso(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
