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
import { TrainingCurriculum, CurriculumStatus, TrainingCategory } from '../../models/training.model';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'trn-curriculum-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="list-page">
      <div class="list-header">
        <h2>Training Curricula</h2>
        <button class="create-btn" routerLink="create" [disabled]="!canCreateTraining"><mat-icon>add</mat-icon> New Curriculum</button>
      </div>
      <div class="filters-bar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search curricula..." [(ngModel)]="searchTerm" (input)="applyFilters()" />
        </div>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="selectedStatuses" multiple (selectionChange)="applyFilters()">
            <mat-option *ngFor="let s of statusOptions" [value]="s">{{ formatEnum(s) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="selectedCategories" multiple (selectionChange)="applyFilters()">
            <mat-option *ngFor="let c of categoryOptions" [value]="c">{{ formatEnum(c) }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Curriculum #</th><th>Title</th><th>Category</th><th>Type</th><th>Status</th><th>Duration</th><th>Validity</th><th>Owner</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filteredCurricula" [routerLink]="[c.id]" class="clickable">
              <td class="cur-num">{{ c.curriculumNumber }}</td>
              <td>{{ c.title }}</td>
              <td>{{ formatEnum(c.category) }}</td>
              <td>{{ formatEnum(c.trainingType) }}</td>
              <td><span class="status-badge" [ngClass]="c.status.toLowerCase()">{{ formatEnum(c.status) }}</span></td>
              <td>{{ c.durationHours }}h</td>
              <td>{{ c.validityMonths }}m</td>
              <td>{{ c.owner?.displayName }}</td>
            </tr>
            <tr *ngIf="filteredCurricula.length === 0"><td colspan="8" class="empty">No curricula found matching your criteria.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .list-page { max-width: 1400px; margin: 0 auto; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .list-header h2 { font-size: 18px; font-weight: 700; color: #1B3A4B; }
    .create-btn { display: flex; align-items: center; gap: 4px; background: #00897b; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .create-btn:hover { background: #00695c; }
    .create-btn:disabled { background: #cbd5e1; color: #64748b; cursor: default; }
    .create-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .filters-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .search-wrap { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d0d5dd; border-radius: 4px; padding: 0 10px; height: 40px; flex: 1; min-width: 200px; }
    .search-wrap mat-icon { font-size: 18px; color: #888; }
    .search-wrap input { border: none; outline: none; font-size: 13px; width: 100%; background: none; }
    .filter-field { width: 150px; }
    ::ng-deep .filter-field .mat-mdc-form-field-wrapper { margin: 0; padding: 0; }
    ::ng-deep .filter-field .mdc-text-field { height: 40px; }
    .table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { background: #fafbfc; padding: 10px 12px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; color: #333; }
    .data-table tr.clickable { cursor: pointer; }
    .data-table tr.clickable:hover { background: #f8f9fb; }
    .cur-num { font-weight: 600; color: #00897b; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .status-badge.draft { background: #f5f5f5; color: #666; }
    .status-badge.under_revision { background: #fff3e0; color: #e65100; }
    .status-badge.retired { background: #efebe9; color: #795548; }
    .empty { text-align: center; color: #888; padding: 24px; }
  `],
})
export class CurriculumListComponent implements OnInit {
  allCurricula: TrainingCurriculum[] = [];
  filteredCurricula: TrainingCurriculum[] = [];
  searchTerm = '';
  selectedStatuses: string[] = [];
  selectedCategories: string[] = [];
  statusOptions = Object.values(CurriculumStatus);
  categoryOptions = Object.values(TrainingCategory);
  canCreateTraining = hasStoredPermission('TRAINING', 'CREATE', 'training_record');

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainingService.getCurricula().subscribe(c => { this.allCurricula = c; this.filteredCurricula = c; });
  }

  applyFilters(): void {
    this.filteredCurricula = this.allCurricula.filter(c => {
      if (this.searchTerm) {
        const s = this.searchTerm.toLowerCase();
        if (!c.title.toLowerCase().includes(s) && !c.curriculumNumber.toLowerCase().includes(s)) return false;
      }
      if (this.selectedStatuses.length && !this.selectedStatuses.includes(c.status)) return false;
      if (this.selectedCategories.length && !this.selectedCategories.includes(c.category)) return false;
      return true;
    });
  }

  formatEnum(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
}
