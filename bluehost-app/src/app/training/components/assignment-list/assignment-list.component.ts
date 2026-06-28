import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TrainingService } from '../../services/training.service';
import { TrainingAssignment, AssignmentStatus } from '../../models/training.model';

@Component({
  selector: 'trn-assignment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="list-page">
      <div class="list-header">
        <h2>Training Assignments</h2>
        <div class="header-stats">
          <span class="stat"><span class="stat-val ok">{{ completedCount }}</span> Completed</span>
          <span class="stat"><span class="stat-val">{{ pendingCount }}</span> Pending</span>
          <span class="stat"><span class="stat-val warn">{{ overdueCount }}</span> Overdue</span>
        </div>
      </div>
      <div class="filters-bar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search assignments..." [(ngModel)]="searchTerm" (input)="applyFilters()" />
        </div>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="selectedStatuses" multiple (selectionChange)="applyFilters()">
            <mat-option *ngFor="let s of statusOptions" [value]="s">{{ formatEnum(s) }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Curriculum</th><th>Trainee</th><th>Status</th><th>Reason</th><th>Priority</th><th>Assigned By</th><th>Assigned</th><th>Due</th><th>Completed</th><th>Score</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of filteredAssignments" class="clickable" [routerLink]="['../curricula', a.curriculumId]">
              <td><span class="cur-num">{{ a.curriculumNumber }}</span><br /><span class="cur-title">{{ a.curriculumTitle }}</span></td>
              <td>{{ a.trainee.displayName }}</td>
              <td><span class="status-badge" [ngClass]="a.status.toLowerCase()">{{ formatEnum(a.status) }}</span></td>
              <td>{{ formatEnum(a.reason) }}</td>
              <td><span class="priority-badge" [ngClass]="a.priority.toLowerCase()">{{ a.priority }}</span></td>
              <td>{{ a.assignedBy.displayName }}</td>
              <td>{{ a.assignedDate | date:'mediumDate' }}</td>
              <td [class.overdue]="isOverdue(a)">{{ a.dueDate | date:'mediumDate' }}</td>
              <td>{{ a.completedDate ? (a.completedDate | date:'mediumDate') : '-' }}</td>
              <td>{{ a.score ?? '-' }}</td>
            </tr>
            <tr *ngIf="filteredAssignments.length === 0"><td colspan="10" class="empty">No assignments found.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .list-page { max-width: 1400px; margin: 0 auto; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .list-header h2 { font-size: 18px; font-weight: 700; color: #1B3A4B; }
    .header-stats { display: flex; gap: 16px; }
    .stat { font-size: 12px; color: #888; }
    .stat-val { font-size: 16px; font-weight: 700; color: #1B3A4B; margin-right: 4px; }
    .stat-val.ok { color: #2e7d32; }
    .stat-val.warn { color: #c62828; }
    .filters-bar { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .search-wrap { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d0d5dd; border-radius: 4px; padding: 0 10px; height: 40px; flex: 1; min-width: 200px; }
    .search-wrap mat-icon { font-size: 18px; color: #888; }
    .search-wrap input { border: none; outline: none; font-size: 13px; width: 100%; background: none; }
    .filter-field { width: 160px; height: 40px; }
    ::ng-deep .filter-field .mat-mdc-form-field-wrapper { margin: 0; padding: 0; }
    ::ng-deep .filter-field .mdc-text-field { height: 40px; }
    ::ng-deep .filter-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { background: #fafbfc; padding: 10px 12px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; color: #333; }
    .data-table tr.clickable { cursor: pointer; }
    .data-table tr.clickable:hover { background: #f8f9fb; }
    .cur-num { font-weight: 600; color: #00897b; font-size: 11px; }
    .cur-title { font-size: 11px; color: #555; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.assigned { background: #e3f2fd; color: #1565c0; }
    .status-badge.in_progress { background: #fff3e0; color: #e65100; }
    .status-badge.overdue { background: #ffebee; color: #c62828; }
    .status-badge.waived { background: #eceff1; color: #546e7a; }
    .status-badge.expired { background: #fce4ec; color: #880e4f; }
    .priority-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #e3f2fd; color: #1565c0; }
    .priority-badge.low { background: #f5f5f5; color: #666; }
    .overdue { color: #c62828; font-weight: 600; }
    .empty { text-align: center; color: #888; padding: 24px; }
  `],
})
export class AssignmentListComponent implements OnInit {
  allAssignments: TrainingAssignment[] = [];
  filteredAssignments: TrainingAssignment[] = [];
  searchTerm = '';
  selectedStatuses: string[] = [];
  statusOptions = Object.values(AssignmentStatus);

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainingService.getAssignments().subscribe(a => { this.allAssignments = a; this.filteredAssignments = a; });
  }

  get completedCount(): number { return this.allAssignments.filter(a => a.status === 'COMPLETED').length; }
  get pendingCount(): number { return this.allAssignments.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS').length; }
  get overdueCount(): number { return this.allAssignments.filter(a => a.status === 'OVERDUE').length; }

  applyFilters(): void {
    this.filteredAssignments = this.allAssignments.filter(a => {
      if (this.searchTerm) {
        const s = this.searchTerm.toLowerCase();
        if (!a.curriculumTitle.toLowerCase().includes(s) && !a.trainee.displayName.toLowerCase().includes(s) && !a.curriculumNumber.toLowerCase().includes(s)) return false;
      }
      if (this.selectedStatuses.length && !this.selectedStatuses.includes(a.status)) return false;
      return true;
    });
  }

  formatEnum(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
  isOverdue(a: TrainingAssignment): boolean { return a.status !== 'COMPLETED' && a.status !== 'WAIVED' && new Date(a.dueDate) < new Date(); }
}
