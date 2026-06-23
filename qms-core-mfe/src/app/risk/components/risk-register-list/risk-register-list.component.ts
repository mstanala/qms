import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { RiskService, RiskRegister } from '../../services/risk.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-risk-register-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, FormsModule
  ],
  template: `
    <div class="list-container">
      <div class="list-header">
        <h1>Risk Registers</h1>
        <button mat-raised-button color="primary" routerLink="../registers/create" [disabled]="!canCreateRisk">
          <mat-icon>add</mat-icon> New Register
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="searchTerm" (keyup.enter)="loadData()" placeholder="Search registers...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="filterStatus" (selectionChange)="loadData()">
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="CLOSED">Closed</option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Risk Type</mat-label>
          <mat-select [(ngModel)]="filterRiskType" (selectionChange)="loadData()">
            <option value="">All</option>
            <option value="PRODUCT">Product</option>
            <option value="PROCESS">Process</option>
            <option value="PATIENT_SAFETY">Patient Safety</option>
            <option value="SUPPLY_CHAIN">Supply Chain</option>
            <option value="REGULATORY">Regulatory</option>
          </mat-select>
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="registers" class="register-table">
        <ng-container matColumnDef="registerNumber">
          <th mat-header-cell *matHeaderCellDef>Register #</th>
          <td mat-cell *matCellDef="let row">
            <a [routerLink]="['../', 'registers', row.id]" class="link">{{ row.registerNumber }}</a>
          </td>
        </ng-container>

        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let row">{{ row.title }}</td>
        </ng-container>

        <ng-container matColumnDef="riskType">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let row">{{ row.riskType }}</td>
        </ng-container>

        <ng-container matColumnDef="methodology">
          <th mat-header-cell *matHeaderCellDef>Methodology</th>
          <td mat-cell *matCellDef="let row">{{ row.methodology }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class]="'status-' + row.status.toLowerCase()">{{ row.status }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="priority">
          <th mat-header-cell *matHeaderCellDef>Priority</th>
          <td mat-cell *matCellDef="let row">{{ row.priority }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" [routerLink]="['../', 'registers', row.id]"></tr>
      </table>

      <mat-paginator
        [length]="totalElements"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50]"
        (page)="onPage($event)">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .list-container { padding: 24px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .list-header h1 { margin: 0; }
    .filters { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filters mat-form-field { min-width: 180px; }
    .register-table { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f5f5f5; }
    .link { color: #1976d2; text-decoration: none; font-weight: 500; }
    .status-draft { background: #e0e0e0 !important; }
    .status-active { background: #c8e6c9 !important; }
    .status-under_review { background: #fff9c4 !important; }
    .status-approved { background: #bbdefb !important; }
    .status-closed { background: #f5f5f5 !important; }
  `],
})
export class RiskRegisterListComponent implements OnInit {
  registers: RiskRegister[] = [];
  displayedColumns = ['registerNumber', 'title', 'riskType', 'methodology', 'status', 'priority'];
  totalElements = 0;
  pageSize = 10;
  page = 0;
  searchTerm = '';
  filterStatus = '';
  filterRiskType = '';
  canCreateRisk = hasStoredPermission('RISK', 'CREATE', 'risk_register');

  constructor(private riskService: RiskService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const params: Record<string, string> = {
      page: this.page.toString(),
      size: this.pageSize.toString(),
    };
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.filterRiskType) params['riskType'] = this.filterRiskType;

    this.riskService.listRegisters(params).subscribe((result) => {
      this.registers = result.content;
      this.totalElements = result.totalElements;
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }
}
