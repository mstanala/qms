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
import { Nonconformance, NonconformanceService } from '../../services/nonconformance.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-nc-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Nonconformances</h1>
        <div class="actions">
          <button mat-raised-button color="primary" routerLink="../create" [disabled]="!canCreateNonconformance"><mat-icon>add</mat-icon> New NC</button>
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>dashboard</mat-icon> Dashboard</button>
        </div>
      </div>
      <mat-card class="filter-card">
        <mat-card-content class="filters">
          <mat-form-field appearance="outline"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (keyup.enter)="load()"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="statusFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option *ngFor="let status of statuses" [value]="status">{{ label(status) }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select [(ngModel)]="typeFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Hold</mat-label><mat-select [(ngModel)]="holdFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="NONE">None</mat-option><mat-option value="HOLD">Hold</mat-option><mat-option value="RELEASED">Released</mat-option></mat-select></mat-form-field>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <table mat-table [dataSource]="records" class="full-table">
          <ng-container matColumnDef="ncNumber"><th mat-header-cell *matHeaderCellDef>NC #</th><td mat-cell *matCellDef="let row">{{ row.ncNumber }}</td></ng-container>
          <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>Title</th><td mat-cell *matCellDef="let row"><a [routerLink]="['../', row.id]">{{ row.title }}</a></td></ng-container>
          <ng-container matColumnDef="ncType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ label(row.ncType) }}</td></ng-container>
          <ng-container matColumnDef="priority"><th mat-header-cell *matHeaderCellDef>Priority</th><td mat-cell *matCellDef="let row">{{ row.priority }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip>{{ label(row.status) }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="holdStatus"><th mat-header-cell *matHeaderCellDef>Hold</th><td mat-cell *matCellDef="let row">{{ label(row.holdStatus || 'NONE') }}</td></ng-container>
          <ng-container matColumnDef="owner"><th mat-header-cell *matHeaderCellDef>Owner</th><td mat-cell *matCellDef="let row">{{ row.owner?.displayName || '-' }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap}h1{margin:0;font-size:24px}.actions{display:flex;gap:8px}.filter-card{margin-bottom:16px}.filters{display:flex;gap:16px;flex-wrap:wrap}.full-table{width:100%}a{color:#1976d2;text-decoration:none;font-weight:500}`],
})
export class NcListComponent implements OnInit {
  records: Nonconformance[] = [];
  columns = ['ncNumber', 'title', 'ncType', 'priority', 'status', 'holdStatus', 'owner'];
  total = 0;
  page = 0;
  search = '';
  statusFilter = '';
  typeFilter = '';
  holdFilter = '';
  statuses = ['IDENTIFIED', 'UNDER_REVIEW', 'INVESTIGATION', 'DISPOSITION_PENDING', 'DISPOSITION_APPROVED', 'CLOSED'];
  types = ['PRODUCT', 'PROCESS', 'MATERIAL', 'EQUIPMENT', 'DOCUMENTATION', 'SUPPLIER'];
  canCreateNonconformance = hasStoredPermission('NONCONFORMANCE', 'CREATE', 'nonconformance');

  constructor(private ncService: NonconformanceService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: Record<string, string> = { page: String(this.page), size: '20' };
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    if (this.typeFilter) params['ncType'] = this.typeFilter;
    if (this.holdFilter) params['holdStatus'] = this.holdFilter;
    this.ncService.list(params).subscribe((page) => {
      this.records = page.content;
      this.total = page.totalElements;
    });
  }

  onPage(event: PageEvent): void { this.page = event.pageIndex; this.load(); }
  label(value: string): string { return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'; }
}
