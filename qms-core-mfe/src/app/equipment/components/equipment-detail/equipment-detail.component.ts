import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Equipment, EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'qms-equipment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page" *ngIf="equipment">
      <div class="page-header">
        <div><h1>{{ equipment.name }}</h1><span>{{ equipment.equipmentNumber }} &middot; {{ label(equipment.equipmentType) }}</span></div>
        <div class="actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Status</button>
          <button mat-stroked-button [routerLink]="['calibrations']"><mat-icon>fact_check</mat-icon> Calibrations</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
        <mat-menu #statusMenu="matMenu"><button mat-menu-item *ngFor="let status of statuses" (click)="setStatus(status)">{{ label(status) }}</button></mat-menu>
      </div>
      <mat-card>
        <mat-card-header><mat-card-title>Overview</mat-card-title></mat-card-header>
        <mat-card-content class="info-grid">
          <div><label>Status</label><mat-chip>{{ label(equipment.status) }}</mat-chip></div>
          <div><label>Category</label><span>{{ equipment.category }}</span></div>
          <div><label>Manufacturer</label><span>{{ equipment.manufacturer || '-' }}</span></div>
          <div><label>Model</label><span>{{ equipment.modelNumber || '-' }}</span></div>
          <div><label>Serial</label><span>{{ equipment.serialNumber || '-' }}</span></div>
          <div><label>Plant Site</label><span>{{ equipment.plantSite?.name || '-' }}</span></div>
          <div><label>Department</label><span>{{ equipment.department?.name || '-' }}</span></div>
          <div><label>Qualification</label><span>{{ label(equipment.qualificationStatus || 'NOT_SET') }}</span></div>
          <div><label>Calibration Required</label><span>{{ equipment.calibrationRequired ? 'Yes' : 'No' }}</span></div>
          <div><label>Calibration Status</label><span>{{ label(equipment.calibrationStatus || 'NOT_REQUIRED') }}</span></div>
          <div><label>Next Calibration</label><span>{{ equipment.nextCalibrationDate ? (equipment.nextCalibrationDate | date:'mediumDate') : '-' }}</span></div>
        </mat-card-content>
      </mat-card>
      <mat-card class="edit-card">
        <mat-card-header><mat-card-title>Controlled Updates</mat-card-title></mat-card-header>
        <mat-card-content class="edit-grid">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="edit.name"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Qualification Status</mat-label>
            <mat-select [(ngModel)]="edit.qualificationStatus">
              <mat-option value="">Not Set</mat-option>
              <mat-option *ngFor="let status of qualificationStatuses" [value]="status">{{ label(status) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Calibration Status</mat-label>
            <mat-select [(ngModel)]="edit.calibrationStatus">
              <mat-option value="">Not Set</mat-option>
              <mat-option *ngFor="let status of calibrationStatuses" [value]="status">{{ label(status) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="save()"><mat-icon>save</mat-icon> Save</button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}h1{margin:0;font-size:24px}.page-header span{color:#667085}.actions{display:flex;gap:8px;flex-wrap:wrap}.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}.edit-card{margin-top:16px}.edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:center}`],
})
export class EquipmentDetailComponent implements OnInit {
  equipment: Equipment | null = null;
  edit = {
    name: '',
    qualificationStatus: '',
    calibrationStatus: '',
  };
  statuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'];
  qualificationStatuses = ['NOT_QUALIFIED', 'IQ_COMPLETED', 'OQ_COMPLETED', 'PQ_COMPLETED', 'FULLY_QUALIFIED', 'REQUALIFICATION_DUE', 'QUALIFICATION_EXPIRED'];
  calibrationStatuses = ['CALIBRATED', 'DUE', 'OVERDUE', 'NOT_APPLICABLE'];

  constructor(private route: ActivatedRoute, private equipmentService: EquipmentService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.equipmentService.getById(id).subscribe((equipment) => {
      this.equipment = equipment;
      this.edit = {
        name: equipment.name || '',
        qualificationStatus: equipment.qualificationStatus || '',
        calibrationStatus: equipment.calibrationStatus || '',
      };
    });
  }

  setStatus(status: string): void {
    if (!this.equipment) return;
    this.equipmentService.update(this.equipment.id, { status }).subscribe((equipment) => {
      this.equipment = equipment;
      this.snackBar.open('Equipment status updated', 'Dismiss', { duration: 2500 });
    });
  }

  save(): void {
    if (!this.equipment) return;
    this.equipmentService.update(this.equipment.id, this.edit).subscribe((equipment) => {
      this.equipment = equipment;
      this.snackBar.open('Equipment updated', 'Dismiss', { duration: 2500 });
    });
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }
}
