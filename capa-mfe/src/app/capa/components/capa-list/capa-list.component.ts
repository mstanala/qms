import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { CapaService } from '../../services/capa.service';
import { Capa, CapaStatus, CapaPriority } from '../../models/capa.model';

@Component({
  selector: 'capa-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <div class="capa-list-container">
      <div class="page-header">
        <div class="header-left">
          <h1>CAPA Records</h1>
          <p class="subtitle">Manage all Corrective and Preventive Action records</p>
        </div>
        <button class="vault-create-btn" routerLink="../create">
          + Create
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search CAPAs</mat-label>
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
            <mat-label>Priority</mat-label>
            <mat-select [(ngModel)]="selectedPriorities" multiple (ngModelChange)="onFilterChange()">
              <mat-option *ngFor="let priority of priorityOptions" [value]="priority">
                {{ priority }}
              </mat-option>
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
          <table mat-table [dataSource]="filteredCapas" class="capa-table">
            <ng-container matColumnDef="capaNumber">
              <th mat-header-cell *matHeaderCellDef>CAPA #</th>
              <td mat-cell *matCellDef="let capa">
                <a [routerLink]="['../detail', capa.id]" class="capa-link">
                  {{ capa.capaNumber }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let capa">
                <span class="title-text">{{ capa.title }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let capa">
                <span class="status-chip" [ngClass]="getStatusClass(capa.status)">
                  {{ formatStatus(capa.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let capa">
                <span class="priority-badge" [ngClass]="capa.priority.toLowerCase()">
                  {{ capa.priority }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="owner">
              <th mat-header-cell *matHeaderCellDef>Owner</th>
              <td mat-cell *matCellDef="let capa">{{ capa.ownerName }}</td>
            </ng-container>

            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef>Department</th>
              <td mat-cell *matCellDef="let capa">{{ capa.department }}</td>
            </ng-container>

            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let capa">
                <span [ngClass]="{'overdue': isOverdue(capa)}">
                  {{ capa.dueDate | date:'dd-MMM-yyyy' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let capa" (click)="stopRowNavigation($event)">
                <button mat-icon-button type="button" [matMenuTriggerFor]="menu" matTooltip="Actions" (click)="stopRowNavigation($event)">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['../detail', capa.id]" (click)="stopRowNavigation($event)">
                    <mat-icon>visibility</mat-icon>
                    <span>View Details</span>
                  </button>
                  <button mat-menu-item [routerLink]="['../edit', capa.id]" (click)="stopRowNavigation($event)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item [routerLink]="['../rca', capa.id]" (click)="stopRowNavigation($event)">
                    <mat-icon>psychology</mat-icon>
                    <span>Root Cause Analysis</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/tools/audit-trail']" [queryParams]="{recordType: 'CAPA', recordId: capa.id}" (click)="stopRowNavigation($event)">
                    <mat-icon>history</mat-icon>
                    <span>Audit Trail</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="capa-row"
                [routerLink]="['../detail', row.id]"></tr>
          </table>
        </div>

        <div class="table-footer">
          <span class="record-count">{{ filteredCapas.length }} records</span>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .capa-list-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #2C5F7C;
    }

    .page-header h1 {
      font-size: 20px;
      font-weight: 600;
      color: #2C5F7C;
      margin: 0;
    }

    .vault-create-btn { background: #ED8B00; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .vault-create-btn:hover { background: #D4760A; }

    .subtitle {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }

    .filter-card {
      margin-bottom: 16px;
      padding: 16px;
    }

    .filters-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-field {
      min-width: 160px;
    }

    .table-card {
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
    }

    .capa-table {
      width: 100%;
    }

    .capa-link {
      color: #2C5F7C;
      font-weight: 500;
      text-decoration: none;
    }

    .capa-link:hover {
      text-decoration: underline;
    }

    .title-text {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 300px;
      font-size: 13px;
    }

    .status-chip {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-chip.initiated { background: #ED8B00; color: #fff; }
    .status-chip.investigation { background: #ED8B00; color: #fff; }
    .status-chip.action-in-progress { background: #D4760A; color: #fff; }
    .status-chip.effectiveness-check { background: #2C5F7C; color: #fff; }
    .status-chip.pending-closure { background: #388E3C; color: #fff; }
    .status-chip.closed { background: #666; color: #fff; }
    .status-chip.under-review { background: #F5A623; color: #fff; }

    .priority-badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #fff8e1; color: #f57f17; }
    .priority-badge.low { background: #e8f5e9; color: #2e7d32; }

    .overdue {
      color: #d32f2f;
      font-weight: 500;
    }

    .capa-row {
      cursor: pointer;
    }

    .capa-row:hover {
      background: #f5f5f5;
    }

    .table-footer {
      padding: 12px 16px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .record-count {
      font-size: 13px;
      color: #666;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `],
})
export class CapaListComponent implements OnInit {
  capas: Capa[] = [];
  filteredCapas: Capa[] = [];
  searchTerm = '';
  selectedStatuses: CapaStatus[] = [];
  selectedPriorities: CapaPriority[] = [];

  displayedColumns = ['capaNumber', 'title', 'status', 'priority', 'owner', 'department', 'dueDate', 'actions'];

  statusOptions = Object.values(CapaStatus);
  priorityOptions = Object.values(CapaPriority);

  constructor(private capaService: CapaService) {}

  ngOnInit(): void {
    this.loadCapas();
  }

  loadCapas(): void {
    this.capaService.getCapas().subscribe((data) => {
      this.capas = data;
      this.filteredCapas = data;
    });
  }

  stopRowNavigation(event: MouseEvent): void {
    event.stopPropagation();
  }

  onFilterChange(): void {
    this.capaService
      .getCapas({
        search: this.searchTerm,
        status: this.selectedStatuses.length > 0 ? this.selectedStatuses : undefined,
        priority: this.selectedPriorities.length > 0 ? this.selectedPriorities : undefined,
      })
      .subscribe((data) => {
        this.filteredCapas = data;
      });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatuses = [];
    this.selectedPriorities = [];
    this.onFilterChange();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStatusClass(status: CapaStatus): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  isOverdue(capa: Capa): boolean {
    return capa.status !== CapaStatus.CLOSED && new Date(capa.dueDate) < new Date();
  }
}
