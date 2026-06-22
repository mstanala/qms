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
import { MatChipsModule } from '@angular/material/chips';
import { SupplierService, Supplier } from '../../services/supplier.service';

@Component({
  selector: 'qms-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatPaginatorModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatChipsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Suppliers</h1>
        <div class="actions">
          <button mat-raised-button color="primary" routerLink="../create"><mat-icon>add</mat-icon> New Supplier</button>
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>dashboard</mat-icon> Dashboard</button>
        </div>
      </div>
      <mat-card class="filter-card">
        <mat-card-content class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="search" (keyup.enter)="load()" placeholder="Name or number...">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let s of statusOptions" [value]="s">{{ formatLabel(s) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let t of typeOptions" [value]="t">{{ formatLabel(t) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="catFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
              <mat-option value="MAJOR">Major</mat-option>
              <mat-option value="MINOR">Minor</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <table mat-table [dataSource]="suppliers" class="full-table">
          <ng-container matColumnDef="supplierNumber"><th mat-header-cell *matHeaderCellDef>Supplier #</th><td mat-cell *matCellDef="let r">{{ r.supplierNumber }}</td></ng-container>
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let r"><a [routerLink]="['../', r.id]">{{ r.name }}</a></td></ng-container>
          <ng-container matColumnDef="supplierType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let r">{{ formatLabel(r.supplierType) }}</td></ng-container>
          <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let r"><mat-chip [class]="'cat-' + r.category.toLowerCase()">{{ r.category }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let r"><mat-chip [class]="'st-' + r.status.toLowerCase()">{{ formatLabel(r.status) }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="country"><th mat-header-cell *matHeaderCellDef>Country</th><td mat-cell *matCellDef="let r">{{ r.country || '—' }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .page{padding:24px} .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
    .page-header h1{margin:0;font-size:22px} .actions{display:flex;gap:8px}
    .filter-card{margin-bottom:16px} .filters{display:flex;gap:16px;flex-wrap:wrap}
    .full-table{width:100%} a{color:#1976d2;text-decoration:none;font-weight:500}
    .cat-critical{background:#ffcdd2!important} .cat-major{background:#ffe0b2!important} .cat-minor{background:#c8e6c9!important}
    .st-qualified{background:#c8e6c9!important} .st-approved{background:#a5d6a7!important} .st-pending_qualification{background:#fff9c4!important}
    .st-suspended{background:#ffcdd2!important} .st-disqualified{background:#ef9a9a!important} .st-inactive{background:#e0e0e0!important}
    .st-conditionally_approved{background:#ffe0b2!important}
  `],
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  columns = ['supplierNumber', 'name', 'supplierType', 'category', 'status', 'country'];
  total = 0; page = 0;
  search = ''; statusFilter = ''; typeFilter = ''; catFilter = '';
  statusOptions = ['PENDING_QUALIFICATION', 'QUALIFIED', 'APPROVED', 'CONDITIONALLY_APPROVED', 'SUSPENDED', 'DISQUALIFIED', 'INACTIVE'];
  typeOptions = ['RAW_MATERIAL', 'PACKAGING', 'EXCIPIENT', 'API', 'CONTRACT_MANUFACTURER', 'CONTRACT_LAB', 'SERVICE_PROVIDER', 'EQUIPMENT'];

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
}
