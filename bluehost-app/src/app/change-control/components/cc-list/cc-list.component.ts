import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { ChangeControlService } from '../../services/change-control.service';
import { ChangeRequest, ChangeStatus, ChangeClassification, ChangeType, ChangePriority } from '../../models/change-control.model';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'cc-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatChipsModule,
  ],
  template: `
    <div class="cc-list-container">
      <div class="page-header">
        <div class="header-left">
          <h1>Change Control Register</h1>
          <p class="subtitle">Complete register of all change requests</p>
        </div>
        <button class="vault-create-btn" routerLink="../create" [disabled]="!canCreateChange">
          + Create
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search Changes</mat-label>
            <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onFilterChange()" placeholder="Search by number, title, or description">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="selectedStatuses" multiple (ngModelChange)="onFilterChange()">
              <mat-option *ngFor="let status of statusOptions" [value]="status">
                {{ formatStatus(status) }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="selectedTypes" multiple (ngModelChange)="onFilterChange()">
              <mat-option *ngFor="let type of typeOptions" [value]="type">
                {{ formatType(type) }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Priority</mat-label>
            <mat-select [(ngModel)]="selectedPriorities" multiple (ngModelChange)="onFilterChange()">
              <mat-option *ngFor="let p of priorityOptions" [value]="p">{{ p }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button (click)="clearFilters()">
            <mat-icon>clear</mat-icon>
            Clear
          </button>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-container">
          <table mat-table [dataSource]="filteredChanges" class="cc-table">
            <ng-container matColumnDef="changeNumber">
              <th mat-header-cell *matHeaderCellDef>CC #</th>
              <td mat-cell *matCellDef="let cr">
                <a [routerLink]="['../detail', cr.id]" class="cc-link">{{ cr.changeNumber }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let cr">
                <span class="title-text">{{ cr.title }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let cr">
                <span class="type-badge">{{ formatType(cr.type) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="classification">
              <th mat-header-cell *matHeaderCellDef>Class</th>
              <td mat-cell *matCellDef="let cr">
                <span class="classification-badge" [ngClass]="cr.classification.toLowerCase()">{{ cr.classification }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let cr">
                <span class="priority-badge" [ngClass]="cr.priority.toLowerCase()">{{ cr.priority }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let cr">
                <span class="status-chip" [ngClass]="getStatusClass(cr.status)">{{ formatStatus(cr.status) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="changeOwner">
              <th mat-header-cell *matHeaderCellDef>Owner</th>
              <td mat-cell *matCellDef="let cr">{{ cr.changeOwnerName }}</td>
            </ng-container>

            <ng-container matColumnDef="targetDate">
              <th mat-header-cell *matHeaderCellDef>Target Date</th>
              <td mat-cell *matCellDef="let cr">
                <span [ngClass]="{'overdue': isOverdue(cr)}">{{ cr.targetImplementationDate | date:'dd-MMM-yy' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let cr" (click)="stopRowNavigation($event)">
                <button mat-icon-button type="button" [matMenuTriggerFor]="menu" (click)="stopRowNavigation($event)">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['../detail', cr.id]" (click)="stopRowNavigation($event)">
                    <mat-icon>visibility</mat-icon>
                    <span>View Details</span>
                  </button>
                  <button mat-menu-item [routerLink]="['../edit', cr.id]" [disabled]="!canUpdateChange" (click)="stopRowNavigation($event)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/tools/audit-trail']" [queryParams]="{recordType: 'CHANGE_CONTROL', recordId: cr.id}" (click)="stopRowNavigation($event)">
                    <mat-icon>history</mat-icon>
                    <span>Audit Trail</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="cc-row" [routerLink]="['../detail', row.id]"></tr>
          </table>
        </div>

        <div class="table-footer">
          <span class="record-count">{{ filteredChanges.length }} records</span>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .cc-list-container { max-width: 1400px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #2C5F7C; }
    .page-header h1 { font-size: 20px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { color: #666; font-size: 14px; margin-top: 4px; }
    .vault-create-btn { background: #ED8B00; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .vault-create-btn:hover { background: #D4760A; }
    .vault-create-btn:disabled { background: #cbd5e1; color: #64748b; cursor: default; }

    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filters-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 220px; }
    .filter-field { min-width: 130px; }

    .table-card { overflow: hidden; }
    .table-container { overflow-x: auto; }
    .cc-table { width: 100%; }

    .cc-link { color: #2C5F7C; font-weight: 500; text-decoration: none; }
    .cc-link:hover { text-decoration: underline; }

    .title-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 300px; font-size: 13px; }

    .type-badge { padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; background: rgba(44,95,124,0.1); color: #2C5F7C; text-transform: uppercase; }

    .classification-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .classification-badge.critical { background: #ffebee; color: #c62828; }
    .classification-badge.major { background: #fff3e0; color: #e65100; }
    .classification-badge.minor { background: #e8f5e9; color: #2e7d32; }

    .priority-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .priority-badge.urgent { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #fff8e1; color: #f57f17; }
    .priority-badge.low { background: #e8f5e9; color: #2e7d32; }

    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap; }
    .status-chip.draft { background: #f5f5f5; color: #616161; }
    .status-chip.submitted { background: #ED8B00; color: #fff; }
    .status-chip.impact-assessment { background: #F5A623; color: #fff; }
    .status-chip.qa-review { background: #2C5F7C; color: #fff; }
    .status-chip.ra-review { background: #2C5F7C; color: #fff; }
    .status-chip.pending-approval { background: #D4760A; color: #fff; }
    .status-chip.approved { background: #388E3C; color: #fff; }
    .status-chip.implementation { background: #ED8B00; color: #fff; }
    .status-chip.verification { background: #2C5F7C; color: #fff; }
    .status-chip.effectiveness-check { background: #2C5F7C; color: #fff; }
    .status-chip.closed { background: #666; color: #fff; }
    .status-chip.rejected { background: #c62828; color: #fff; }

    .overdue { color: #d32f2f; font-weight: 500; }
    .cc-row { cursor: pointer; }
    .cc-row:hover { background: #f5f5f5; }

    .table-footer { padding: 12px 16px; border-top: 1px solid #eee; }
    .record-count { font-size: 13px; color: #666; }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `],
})
export class CcListComponent implements OnInit {
  changes: ChangeRequest[] = [];
  filteredChanges: ChangeRequest[] = [];
  searchTerm = '';
  selectedStatuses: ChangeStatus[] = [];
  selectedTypes: ChangeType[] = [];
  selectedPriorities: ChangePriority[] = [];
  canCreateChange = hasStoredPermission('CHANGE_CONTROL', 'CREATE', 'change_request');
  canUpdateChange = hasStoredPermission('CHANGE_CONTROL', 'UPDATE', 'change_request');

  displayedColumns = ['changeNumber', 'title', 'type', 'classification', 'priority', 'status', 'changeOwner', 'targetDate', 'actions'];

  statusOptions = Object.values(ChangeStatus);
  typeOptions = Object.values(ChangeType);
  priorityOptions = Object.values(ChangePriority);

  constructor(private ccService: ChangeControlService) {}

  ngOnInit(): void {
    this.loadChanges();
  }

  loadChanges(): void {
    this.ccService.getChangeRequests().subscribe((data) => {
      this.changes = data;
      this.filteredChanges = data;
    });
  }

  stopRowNavigation(event: MouseEvent): void {
    event.stopPropagation();
  }

  onFilterChange(): void {
    this.ccService
      .getChangeRequests({
        search: this.searchTerm,
        status: this.selectedStatuses.length > 0 ? this.selectedStatuses : undefined,
        type: this.selectedTypes.length > 0 ? this.selectedTypes : undefined,
        priority: this.selectedPriorities.length > 0 ? this.selectedPriorities : undefined,
      })
      .subscribe((data) => {
        this.filteredChanges = data;
      });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatuses = [];
    this.selectedTypes = [];
    this.selectedPriorities = [];
    this.onFilterChange();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStatusClass(status: ChangeStatus): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  isOverdue(cr: ChangeRequest): boolean {
    return cr.status !== ChangeStatus.CLOSED && cr.status !== ChangeStatus.REJECTED && new Date(cr.targetImplementationDate) < new Date();
  }
}
