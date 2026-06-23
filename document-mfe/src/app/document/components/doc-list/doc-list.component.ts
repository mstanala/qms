import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { DocumentService } from '../../services/document.service';
import { QmsDocument, DocumentStatus, DocumentType, DocumentListFilter } from '../../models/document.model';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'doc-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule],
  template: `
    <div class="list-page">
      <div class="list-header">
        <h2>Document Register</h2>
        <button class="create-btn" routerLink="../create" [disabled]="!canCreateDocument"><mat-icon>add</mat-icon> New Document</button>
      </div>
      <div class="filters-bar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search documents..." [(ngModel)]="searchTerm" (input)="applyFilters()" />
        </div>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="selectedStatuses" multiple (selectionChange)="applyFilters()">
            <mat-option *ngFor="let s of statusOptions" [value]="s">{{ formatEnum(s) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="selectedTypes" multiple (selectionChange)="applyFilters()">
            <mat-option *ngFor="let t of typeOptions" [value]="t">{{ formatEnum(t) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="selectedCategory" (selectionChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            <mat-option *ngFor="let c of categoryOptions" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Doc Number</th><th>Title</th><th>Type</th><th>Status</th><th>Version</th><th>Owner</th><th>Effective Date</th><th>Next Review</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of filteredDocs" [routerLink]="['../detail', doc.id]" class="clickable">
              <td class="doc-num">{{ doc.documentNumber }}</td>
              <td>{{ doc.title }}</td>
              <td>{{ formatEnum(doc.documentType) }}</td>
              <td><span class="status-badge" [ngClass]="doc.status.toLowerCase()">{{ formatEnum(doc.status) }}</span></td>
              <td>v{{ doc.currentVersion }}</td>
              <td>{{ doc.owner?.displayName }}</td>
              <td>{{ doc.effectiveDate | date:'mediumDate' }}</td>
              <td [class.overdue]="isReviewOverdue(doc)">{{ doc.nextReviewDate | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="filteredDocs.length === 0"><td colspan="8" class="empty">No documents found matching your criteria.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .list-page { max-width: 1400px; margin: 0 auto; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .list-header h2 { font-size: 18px; font-weight: 700; color: #1B3A4B; }
    .create-btn { display: flex; align-items: center; gap: 4px; background: #5c6bc0; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .create-btn:hover { background: #3f51b5; }
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
    .doc-num { font-weight: 600; color: #5c6bc0; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
    .status-badge.effective { background: #e8f5e9; color: #2e7d32; }
    .status-badge.draft { background: #f5f5f5; color: #666; }
    .status-badge.under_review { background: #fff3e0; color: #e65100; }
    .status-badge.pending_review { background: #fff3e0; color: #e65100; }
    .status-badge.pending_approval { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.approved { background: #e8eaf6; color: #3949ab; }
    .status-badge.superseded { background: #efebe9; color: #795548; }
    .status-badge.obsolete { background: #ffebee; color: #c62828; }
    .status-badge.archived { background: #eceff1; color: #546e7a; }
    .overdue { color: #c62828; font-weight: 600; }
    .empty { text-align: center; color: #888; padding: 24px; }
  `],
})
export class DocListComponent implements OnInit {
  allDocs: QmsDocument[] = [];
  filteredDocs: QmsDocument[] = [];
  searchTerm = '';
  selectedStatuses: string[] = [];
  selectedTypes: string[] = [];
  selectedCategory = '';
  statusOptions = Object.values(DocumentStatus);
  typeOptions = Object.values(DocumentType);
  categoryOptions = ['Production', 'Quality Control', 'Quality Assurance', 'Regulatory', 'Engineering', 'Warehouse', 'HSE'];
  canCreateDocument = hasStoredPermission('DOCUMENT', 'CREATE', 'document');

  constructor(private docService: DocumentService) {}

  ngOnInit(): void {
    this.docService.getDocuments().subscribe(docs => { this.allDocs = docs; this.filteredDocs = docs; });
  }

  applyFilters(): void {
    this.filteredDocs = this.allDocs.filter(d => {
      if (this.searchTerm) {
        const s = this.searchTerm.toLowerCase();
        if (!d.title.toLowerCase().includes(s) && !d.documentNumber.toLowerCase().includes(s)) return false;
      }
      if (this.selectedStatuses.length && !this.selectedStatuses.includes(d.status)) return false;
      if (this.selectedTypes.length && !this.selectedTypes.includes(d.documentType)) return false;
      if (this.selectedCategory && d.category !== this.selectedCategory) return false;
      return true;
    });
  }

  formatEnum(val: string): string { return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  isReviewOverdue(doc: QmsDocument): boolean { return doc.nextReviewDate ? new Date(doc.nextReviewDate) < new Date() : false; }
}
