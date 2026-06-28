import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SupplierService, Supplier } from '../../services/supplier.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatPaginatorModule, MatSelectModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="supplier-list-container">
      <div class="vault-page-header">
        <div class="header-left">
          <h1>Suppliers</h1>
          <span class="record-count-badge">{{ total }} records</span>
        </div>
        <div class="actions">
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>dashboard</mat-icon> Dashboard</button>
          <button class="vault-create-btn" routerLink="../create" [disabled]="!canCreateSupplier">+ Create</button>
        </div>
      </div>

      <mat-card class="filter-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search Suppliers</mat-label>
            <input matInput [(ngModel)]="search" (keyup.enter)="load()" placeholder="Name or number...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let s of statusOptions" [value]="s">{{ formatLabel(s) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let t of typeOptions" [value]="t">{{ formatLabel(t) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="catFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
              <mat-option value="MAJOR">Major</mat-option>
              <mat-option value="MINOR">Minor</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-container">
          <table mat-table [dataSource]="suppliers" class="supplier-table">
            <ng-container matColumnDef="supplierNumber">
              <th mat-header-cell *matHeaderCellDef>Supplier #</th>
              <td mat-cell *matCellDef="let r">{{ r.supplierNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let r"><a class="record-link" [routerLink]="['../', r.id]">{{ r.name }}</a></td>
            </ng-container>
            <ng-container matColumnDef="supplierType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">{{ formatLabel(r.supplierType) }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let r">
                <span class="category-badge" [ngClass]="r.category?.toLowerCase()">{{ r.category }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="status-chip" [ngClass]="getStatusClass(r.status)">{{ formatLabel(r.status) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="country">
              <th mat-header-cell *matHeaderCellDef>Country</th>
              <td mat-cell *matCellDef="let r">{{ r.country || '—' }}</td>
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
    .supplier-list-container { max-width: 1400px; margin: 0 auto; }

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
    .supplier-table { width: 100%; }

    .record-link { color: #2C5F7C; font-weight: 500; text-decoration: none; }
    .record-link:hover { text-decoration: underline; }

    .category-badge { padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .category-badge.critical { background: #ffebee; color: #c62828; }
    .category-badge.major { background: #fff3e0; color: #e65100; }
    .category-badge.minor { background: #e8f5e9; color: #2e7d32; }

    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .status-chip.qualified { background: #e8f5e9; color: #2e7d32; }
    .status-chip.approved { background: #c8e6c9; color: #1b5e20; }
    .status-chip.pending-qualification { background: #fff8e1; color: #f57f17; }
    .status-chip.conditionally-approved { background: #fff3e0; color: #e65100; }
    .status-chip.suspended { background: #ffebee; color: #c62828; }
    .status-chip.disqualified { background: #ffcdd2; color: #b71c1c; }
    .status-chip.inactive { background: #f5f5f5; color: #666; }

    .data-row { cursor: pointer; }
    .data-row:hover { background: #f5f5f5; }

    .table-footer { padding: 10px 16px; border-top: 1px solid #eee; background: #fafafa; display: flex; align-items: center; justify-content: space-between; }
    .record-count { font-size: 12px; color: #888; }

    ::ng-deep .supplier-table .mat-mdc-header-cell { background: #f5f5f5; font-weight: 600; color: #555; font-size: 12px; border-bottom: 2px solid #ddd; }
    ::ng-deep .supplier-table .mat-mdc-cell { font-size: 13px; border-bottom: 1px solid #eee; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `],
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  columns = ['supplierNumber', 'name', 'supplierType', 'category', 'status', 'country'];
  total = 0; page = 0;
  search = ''; statusFilter = ''; typeFilter = ''; catFilter = '';
  statusOptions = ['PENDING_QUALIFICATION', 'QUALIFIED', 'APPROVED', 'CONDITIONALLY_APPROVED', 'SUSPENDED', 'DISQUALIFIED', 'INACTIVE'];
  typeOptions = ['RAW_MATERIAL', 'PACKAGING', 'EXCIPIENT', 'API', 'CONTRACT_MANUFACTURER', 'CONTRACT_LAB', 'SERVICE_PROVIDER', 'EQUIPMENT'];
  canCreateSupplier = hasStoredPermission('SUPPLIER', 'CREATE', 'supplier');

  constructor(private svc: SupplierService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    const p: Record<string, string> = { page: this.page.toString(), size: '20' };
    if (this.search) p['search'] = this.search;
    if (this.statusFilter) p['status'] = this.statusFilter;
    if (this.typeFilter) p['supplierType'] = this.typeFilter;
    if (this.catFilter) p['category'] = this.catFilter;
    this.svc.list(p).subscribe(r => { this.suppliers = r.content; this.total = r.totalElements; });
  }

  onPage(e: PageEvent): void { this.page = e.pageIndex; this.load(); }
  formatLabel(s: string): string { return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  getStatusClass(status: string): string { return status.toLowerCase().replace(/_/g, '-'); }
}
