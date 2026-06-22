import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Equipment, EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'qms-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Equipment</h1>
        <div class="actions">
          <button mat-raised-button color="primary" routerLink="../create"><mat-icon>add</mat-icon> New Equipment</button>
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>dashboard</mat-icon> Dashboard</button>
        </div>
      </div>

      <mat-card class="filter-card">
        <mat-card-content class="filters">
          <mat-form-field appearance="outline"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (keyup.enter)="load()"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let status of statuses" [value]="status">{{ label(status) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <table mat-table [dataSource]="equipment" class="full-table">
          <ng-container matColumnDef="equipmentNumber"><th mat-header-cell *matHeaderCellDef>Equipment #</th><td mat-cell *matCellDef="let row">{{ row.equipmentNumber }}</td></ng-container>
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let row"><a [routerLink]="['../', row.id]">{{ row.name }}</a></td></ng-container>
          <ng-container matColumnDef="equipmentType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ label(row.equipmentType) }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip>{{ label(row.status) }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="calibrationStatus"><th mat-header-cell *matHeaderCellDef>Calibration</th><td mat-cell *matCellDef="let row">{{ label(row.calibrationStatus || 'NOT_REQUIRED') }}</td></ng-container>
          <ng-container matColumnDef="site"><th mat-header-cell *matHeaderCellDef>Site</th><td mat-cell *matCellDef="let row">{{ row.plantSite?.name || '-' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let row"><button mat-stroked-button [routerLink]="['../', row.id, 'calibrations']">Calibrations</button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap}
    h1{margin:0;font-size:24px}.actions{display:flex;gap:8px}.filter-card{margin-bottom:16px}.filters{display:flex;gap:16px;flex-wrap:wrap}
    .full-table{width:100%}a{color:#1976d2;text-decoration:none;font-weight:500}
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
}
