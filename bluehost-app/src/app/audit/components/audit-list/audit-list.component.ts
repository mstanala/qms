import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, Sort } from '@angular/material/sort';
import { AuditService, Audit } from '../../services/audit.service';

@Component({
  selector: 'qms-audit-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, MatSortModule],
  template: `
    <div class="list-container">
      <div class="list-header">
        <div class="header-left">
          <h1>Audit Management</h1>
          <span class="record-count">{{ total }} records</span>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="../new"><mat-icon>add</mat-icon> Schedule Audit</button>
          <button mat-stroked-button routerLink="../plans"><mat-icon>event_note</mat-icon> Audit Plans</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table mat-table [dataSource]="audits" matSort (matSortChange)="onSort($event)" class="audit-table">

          <ng-container matColumnDef="auditNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Audit #</th>
            <td mat-cell *matCellDef="let row">
              <a class="record-link" [routerLink]="['../', row.id]">{{ row.auditNumber }}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
            <td mat-cell *matCellDef="let row" class="col-title">
              <span [matTooltip]="row.title">{{ row.title }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
            <td mat-cell *matCellDef="let row">{{ row.category || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="auditType">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Audit Type</th>
            <td mat-cell *matCellDef="let row">{{ formatEnum(row.auditType) }}</td>
          </ng-container>

          <ng-container matColumnDef="lifecycleState">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Lifecycle State</th>
            <td mat-cell *matCellDef="let row">
              <span class="lifecycle-badge" [ngClass]="'lc-' + (row.lifecycleState || 'DRAFT').toLowerCase()">
                {{ formatEnum(row.lifecycleState || 'DRAFT') }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="status-badge" [ngClass]="'st-' + row.status.toLowerCase()">
                {{ formatEnum(row.status) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="frequency">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Frequency</th>
            <td mat-cell *matCellDef="let row">{{ formatEnum(row.frequency) || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
            <td mat-cell *matCellDef="let row">
              <span class="priority-badge" [ngClass]="'pr-' + (row.priority || 'MEDIUM').toLowerCase()">
                {{ row.priority || 'MEDIUM' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="leadAuditor">
            <th mat-header-cell *matHeaderCellDef>Lead Auditor</th>
            <td mat-cell *matCellDef="let row">{{ row.leadAuditor?.displayName || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="scheduledStartDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Scheduled Start</th>
            <td mat-cell *matCellDef="let row">{{ row.scheduledStartDate | date:'dd-MMM-yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="executiveSummary">
            <th mat-header-cell *matHeaderCellDef>Executive Summary</th>
            <td mat-cell *matCellDef="let row" class="col-summary">
              <span [matTooltip]="row.executiveSummary || ''">{{ truncate(row.executiveSummary, 80) }}</span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;" [routerLink]="['../', row.id]" class="clickable-row"></tr>
        </table>
      </div>

      <mat-paginator [length]="total" [pageSize]="pageSize" [pageSizeOptions]="[10, 20, 50]"
                     (page)="onPage($event)" showFirstLastButtons></mat-paginator>
    </div>
  `,
  styles: [`
    .list-container { padding: 20px 24px; }
    .list-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
    }
    .header-left { display: flex; align-items: baseline; gap: 12px; }
    .header-left h1 { margin: 0; font-size: 20px; font-weight: 600; color: #1f2937; }
    .record-count { font-size: 12px; color: #667085; background: #f1f5f9; padding: 2px 10px; border-radius: 10px; }
    .header-actions { display: flex; gap: 8px; }

    .table-wrapper { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }

    .audit-table { width: 100%; }
    .audit-table th.mat-mdc-header-cell {
      font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;
      letter-spacing: 0.04em; background: #f8fafc; padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .audit-table td.mat-mdc-cell {
      font-size: 13px; color: #374151; padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .clickable-row { cursor: pointer; transition: background 100ms ease; }
    .clickable-row:hover { background: #f8fafc; }

    .record-link { color: #2C5F7C; font-weight: 500; text-decoration: none; }
    .record-link:hover { text-decoration: underline; }

    .col-title { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-summary { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #667085; font-size: 12px; }

    .status-badge, .lifecycle-badge, .priority-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 500; letter-spacing: 0.02em;
    }

    .st-planned { background: #e2e8f0; color: #475569; }
    .st-scheduled { background: #dbeafe; color: #1e40af; }
    .st-in_progress { background: #fef3c7; color: #92400e; }
    .st-report_drafting { background: #fed7aa; color: #9a3412; }
    .st-under_review { background: #e9d5ff; color: #6b21a8; }
    .st-completed { background: #d1fae5; color: #065f46; }
    .st-cancelled { background: #fecaca; color: #991b1b; }

    .lc-draft { background: #f1f5f9; color: #64748b; }
    .lc-active { background: #dbeafe; color: #1e40af; }
    .lc-under_review { background: #e9d5ff; color: #6b21a8; }
    .lc-approved { background: #d1fae5; color: #065f46; }
    .lc-superseded { background: #fef3c7; color: #92400e; }
    .lc-retired { background: #e2e8f0; color: #475569; }

    .pr-critical { background: #fecaca; color: #991b1b; }
    .pr-high { background: #fed7aa; color: #9a3412; }
    .pr-medium { background: #fef3c7; color: #92400e; }
    .pr-low { background: #d1fae5; color: #065f46; }
  `],
})
export class AuditListComponent implements OnInit {
  audits: Audit[] = [];
  columns = [
    'auditNumber', 'title', 'category', 'auditType', 'lifecycleState',
    'status', 'frequency', 'priority', 'leadAuditor', 'scheduledStartDate', 'executiveSummary'
  ];
  total = 0;
  page = 0;
  pageSize = 20;
  sortField = '';
  sortDirection = '';

  constructor(private auditService: AuditService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: Record<string, string> = { page: this.page.toString(), size: this.pageSize.toString() };
    if (this.sortField && this.sortDirection) {
      params['sort'] = `${this.sortField},${this.sortDirection}`;
    }
    this.auditService.listAudits(params).subscribe((r) => {
      this.audits = r.content;
      this.total = r.totalElements;
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.pageSize = e.pageSize;
    this.load();
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active;
    this.sortDirection = sort.direction;
    this.page = 0;
    this.load();
  }

  formatEnum(value: string | null): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  truncate(value: string | null, max: number): string {
    if (!value) return '—';
    return value.length > max ? value.substring(0, max) + '...' : value;
  }
}