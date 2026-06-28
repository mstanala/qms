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
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditService, AuditPlan } from '../../services/audit.service';

@Component({
  selector: 'qms-audit-plan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatPaginatorModule, MatSelectModule, MatFormFieldModule, MatChipsModule,
    MatMenuModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Audit Plans</h1>
        <div class="actions">
          <button mat-raised-button color="primary" routerLink="../plans/new"><mat-icon>add</mat-icon> Create Plan</button>
          <button mat-stroked-button routerLink="../dashboard"><mat-icon>arrow_back</mat-icon> Dashboard</button>
        </div>
      </div>

      <mat-card class="filter-card">
        <mat-card-content class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option value="DRAFT">Draft</mat-option>
              <mat-option value="APPROVED">Approved</mat-option>
              <mat-option value="IN_PROGRESS">In Progress</mat-option>
              <mat-option value="COMPLETED">Completed</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Year</mat-label>
            <mat-select [(ngModel)]="yearFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let y of years" [value]="y.toString()">{{ y }}</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <table mat-table [dataSource]="plans" class="full-table">
          <ng-container matColumnDef="planNumber">
            <th mat-header-cell *matHeaderCellDef>Plan #</th>
            <td mat-cell *matCellDef="let row">{{ row.planNumber }}</td>
          </ng-container>
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let row">{{ row.title }}</td>
          </ng-container>
          <ng-container matColumnDef="planYear">
            <th mat-header-cell *matHeaderCellDef>Year</th>
            <td mat-cell *matCellDef="let row">{{ row.planYear }}</td>
          </ng-container>
          <ng-container matColumnDef="auditType">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let row">{{ row.auditType | titlecase }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="'chip-' + row.status.toLowerCase()">{{ row.status }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="planMenu"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #planMenu="matMenu">
                <button mat-menu-item *ngIf="row.status === 'DRAFT'" (click)="updatePlanStatus(row, 'APPROVED')">
                  <mat-icon>check_circle</mat-icon> Approve
                </button>
                <button mat-menu-item *ngIf="row.status === 'APPROVED'" (click)="updatePlanStatus(row, 'IN_PROGRESS')">
                  <mat-icon>play_arrow</mat-icon> Start
                </button>
                <button mat-menu-item *ngIf="row.status === 'IN_PROGRESS'" (click)="updatePlanStatus(row, 'COMPLETED')">
                  <mat-icon>done_all</mat-icon> Complete
                </button>
                <button mat-menu-item *ngIf="row.status !== 'CANCELLED' && row.status !== 'COMPLETED'" (click)="updatePlanStatus(row, 'CANCELLED')">
                  <mat-icon>cancel</mat-icon> Cancel
                </button>
              </mat-menu>
            </td>
          </ng-container>
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
    .full-table{width:100%}
    .chip-draft{background:#e0e0e0!important} .chip-approved{background:#c8e6c9!important}
    .chip-in_progress{background:#bbdefb!important} .chip-completed{background:#a5d6a7!important}
    .chip-cancelled{background:#ffcdd2!important}
  `],
})
export class AuditPlanListComponent implements OnInit {
  plans: AuditPlan[] = [];
  columns = ['planNumber', 'title', 'planYear', 'auditType', 'status', 'actions'];
  total = 0;
  page = 0;
  statusFilter = '';
  yearFilter = '';
  years: number[] = [];

  constructor(private auditService: AuditService, private snackBar: MatSnackBar) {
    const y = new Date().getFullYear();
    this.years = [y - 1, y, y + 1];
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: Record<string, string> = { page: this.page.toString(), size: '20' };
    if (this.statusFilter) params['status'] = this.statusFilter;
    if (this.yearFilter) params['planYear'] = this.yearFilter;
    this.auditService.listPlans(params).subscribe((r) => {
      this.plans = r.content;
      this.total = r.totalElements;
    });
  }

  onPage(e: PageEvent): void { this.page = e.pageIndex; this.load(); }

  updatePlanStatus(plan: AuditPlan, status: string): void {
    this.auditService.updatePlanStatus(plan.id, status).subscribe(() => {
      this.snackBar.open(`Plan ${plan.planNumber} ${status.toLowerCase()}`, 'OK', { duration: 3000 });
      this.load();
    });
  }
}
