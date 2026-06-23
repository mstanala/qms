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
import { Complaint, ComplaintService } from '../../services/complaint.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-complaint-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Complaints</h1>
        <div class="actions">
          <button mat-raised-button color="primary" routerLink="../create" [disabled]="!canCreateComplaint"><mat-icon>add</mat-icon> New Complaint</button>
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>dashboard</mat-icon> Dashboard</button>
        </div>
      </div>
      <mat-card class="filter-card">
        <mat-card-content class="filters">
          <mat-form-field appearance="outline"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (keyup.enter)="load()"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="statusFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option *ngFor="let status of statuses" [value]="status">{{ label(status) }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select [(ngModel)]="typeFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Class</mat-label><mat-select [(ngModel)]="classFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="CRITICAL">Critical</mat-option><mat-option value="MAJOR">Major</mat-option><mat-option value="MINOR">Minor</mat-option></mat-select></mat-form-field>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <table mat-table [dataSource]="complaints" class="full-table">
          <ng-container matColumnDef="complaintNumber"><th mat-header-cell *matHeaderCellDef>Complaint #</th><td mat-cell *matCellDef="let row">{{ row.complaintNumber }}</td></ng-container>
          <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>Title</th><td mat-cell *matCellDef="let row"><a [routerLink]="['../', row.id]">{{ row.title }}</a></td></ng-container>
          <ng-container matColumnDef="complaintType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ label(row.complaintType) }}</td></ng-container>
          <ng-container matColumnDef="source"><th mat-header-cell *matHeaderCellDef>Source</th><td mat-cell *matCellDef="let row">{{ label(row.source) }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip>{{ label(row.status) }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="priority"><th mat-header-cell *matHeaderCellDef>Priority</th><td mat-cell *matCellDef="let row">{{ row.priority }}</td></ng-container>
          <ng-container matColumnDef="receivedDate"><th mat-header-cell *matHeaderCellDef>Received</th><td mat-cell *matCellDef="let row">{{ row.receivedDate | date:'mediumDate' }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap}h1{margin:0;font-size:24px}.actions{display:flex;gap:8px}.filter-card{margin-bottom:16px}.filters{display:flex;gap:16px;flex-wrap:wrap}.full-table{width:100%}a{color:#1976d2;text-decoration:none;font-weight:500}`],
})
export class ComplaintListComponent implements OnInit {
  complaints: Complaint[] = [];
  columns = ['complaintNumber', 'title', 'complaintType', 'source', 'status', 'priority', 'receivedDate'];
  total = 0;
  page = 0;
  search = '';
  statusFilter = '';
  typeFilter = '';
  classFilter = '';
  statuses = ['RECEIVED', 'TRIAGE', 'INVESTIGATION', 'RESPONSE_PENDING', 'CLOSED'];
  types = ['PRODUCT_QUALITY', 'ADVERSE_EVENT', 'PACKAGING', 'DELIVERY', 'SERVICE', 'OTHER'];
  canCreateComplaint = hasStoredPermission('COMPLAINT', 'CREATE', 'complaint');

  constructor(private complaintService: ComplaintService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    const params: Record<string, string> = { page: String(this.page), size: '20' };
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    if (this.typeFilter) params['complaintType'] = this.typeFilter;
    if (this.classFilter) params['classification'] = this.classFilter;
    this.complaintService.list(params).subscribe((page) => {
      this.complaints = page.content;
      this.total = page.totalElements;
    });
  }
  onPage(event: PageEvent): void { this.page = event.pageIndex; this.load(); }
  label(value: string): string { return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'; }
}
