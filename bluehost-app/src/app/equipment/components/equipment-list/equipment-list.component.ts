import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Equipment, EquipmentService } from '../../services/equipment.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule],
  template: `
    <div class="equipment-list-container">
      <div class="vault-page-header">
        <div class="header-left">
          <h1>Equipment</h1>
          <span class="record-count-badge">{{ total }} records</span>
        </div>
        <div class="actions">
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>dashboard</mat-icon> Dashboard</button>
          <button class="vault-create-btn" routerLink="../create" [disabled]="!canCreateEquipment">+ Create</button>
        </div>
      </div>

      <mat-card class="filter-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search Equipment</mat-label>
            <input matInput [(ngModel)]="search" (keyup.enter)="load()">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let status of statuses" [value]="status">{{ label(status) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-container">
          <table mat-table [dataSource]="equipment" class="equipment-table">
            <ng-container matColumnDef="equipmentNumber">
              <th mat-header-cell *matHeaderCellDef>Equipment #</th>
              <td mat-cell *matCellDef="let row">{{ row.equipmentNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row"><a class="record-link" [routerLink]="['../', row.id]">{{ row.name }}</a></td>
            </ng-container>
            <ng-container matColumnDef="equipmentType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let row">{{ label(row.equipmentType) }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-chip" [ngClass]="getStatusClass(row.status)">{{ label(row.status) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="calibrationStatus">
              <th mat-header-cell *matHeaderCellDef>Calibration</th>
              <td mat-cell *matCellDef="let row">
                <span class="calibration-badge" [ngClass]="getCalibrationClass(row.calibrationStatus)">{{ label(row.calibrationStatus || 'NOT_REQUIRED') }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="site">
              <th mat-header-cell *matHeaderCellDef>Site</th>
              <td mat-cell *matCellDef="let row">{{ row.plantSite?.name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-stroked-button class="cal-btn" [routerLink]="['../', row.id, 'calibrations']">Calibrations</button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;" class="data-row" [routerLink]="['../', row.id]"></tr>
          </table>
        </div>
        <div class="table-footer">
          <span class="record-count">{{ total }} records</span>
          <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .equipment-list-container { max-width: 1400px; margin: 0 auto; }

    .vault-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #2C5F7C; }
    .vault-page-header h1 { font-size: 20px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .record-count-badge { font-size: 12px; color: #888; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .vault-create-btn { background: #ED8B00; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .vault-create-btn:hover { background: #D4760A; }
    .vault-create-btn:disabled { background: #cbd5e1; color: #64748b; cursor: default; }

    .filter-card { margin-bottom: 12px; padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 4px; }
    .filters-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 220px; }
    .filter-field { min-width: 140px; }

    .table-card { overflow: hidden; border: 1px solid #ddd; border-radius: 4px; }
    .table-container { overflow-x: auto; }
    .equipment-table { width: 100%; }

    .record-link { color: #2C5F7C; font-weight: 500; text-decoration: none; }
    .record-link:hover { text-decoration: underline; }

    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .status-chip.active { background: #e8f5e9; color: #2e7d32; }
    .status-chip.inactive { background: #f5f5f5; color: #666; }
    .status-chip.out-of-service { background: #ffebee; color: #c62828; }
    .status-chip.decommissioned { background: #efebe9; color: #795548; }

    .calibration-badge { padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .calibration-badge.current { background: #e8f5e9; color: #2e7d32; }
    .calibration-badge.due { background: #fff3e0; color: #e65100; }
    .calibration-badge.overdue { background: #ffebee; color: #c62828; }
    .calibration-badge.not-required { background: #f5f5f5; color: #888; }

    .cal-btn { font-size: 12px; }

    .data-row { cursor: pointer; }
    .data-row:hover { background: #f5f5f5; }

    .table-footer { padding: 10px 16px; border-top: 1px solid #eee; background: #fafafa; display: flex; align-items: center; justify-content: space-between; }
    .record-count { font-size: 12px; color: #888; }

    ::ng-deep .equipment-table .mat-mdc-header-cell { background: #f5f5f5; font-weight: 600; color: #555; font-size: 12px; border-bottom: 2px solid #ddd; }
    ::ng-deep .equipment-table .mat-mdc-cell { font-size: 13px; border-bottom: 1px solid #eee; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `],
})
export class EquipmentListComponent implements OnInit {
  equipment: Equipment[] = [];
  columns = ['equipmentNumber', 'name', 'equipmentType', 'status', 'calibrationStatus', 'site', 'actions'];
  total = 0;
  page = 0;
  search = '';
  statusFilter = '';
  typeFilter = '';
  statuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'];
  types = ['MANUFACTURING', 'LABORATORY', 'UTILITY', 'WAREHOUSE', 'COMPUTERIZED_SYSTEM', 'MEASURING_DEVICE'];
  canCreateEquipment = hasStoredPermission('EQUIPMENT', 'CREATE', 'equipment');

  constructor(private equipmentService: EquipmentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const params: Record<string, string> = { page: String(this.page), size: '20' };
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    if (this.typeFilter) params['equipmentType'] = this.typeFilter;
    this.equipmentService.list(params).subscribe((page) => {
      this.equipment = page.content;
      this.total = page.totalElements;
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.load();
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }

  getStatusClass(status: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : '';
  }

  getCalibrationClass(status: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : 'not-required';
  }
}
