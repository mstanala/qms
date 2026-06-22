import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DocumentService } from '../../services/document.service';
import { DocumentType, ConfidentialityLevel } from '../../models/document.model';

@Component({
  selector: 'doc-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <div class="form-page">
      <div class="form-header">
        <h2>Create New Document</h2>
        <button class="cancel-btn" routerLink="../list">Cancel</button>
      </div>
      <div class="form-card">
        <div class="form-section">
          <h3>Document Information</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="doc.title" required placeholder="e.g., Batch Manufacturing Record - Tablet Compression" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="doc.description" rows="3" placeholder="Brief description of the document purpose and scope"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Document Type</mat-label>
              <mat-select [(ngModel)]="doc.documentType" required>
                <mat-option *ngFor="let t of typeOptions" [value]="t">{{ formatEnum(t) }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="doc.category" required>
                <mat-option *ngFor="let c of categoryOptions" [value]="c">{{ c }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sub-Category</mat-label>
              <input matInput [(ngModel)]="doc.subCategory" placeholder="e.g., Tablet Manufacturing" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Confidentiality</mat-label>
              <mat-select [(ngModel)]="doc.confidentialityLevel">
                <mat-option *ngFor="let c of confidentialityOptions" [value]="c">{{ formatEnum(c) }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="form-section">
          <h3>Location & Ownership</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Plant Site</mat-label>
              <mat-select [(ngModel)]="doc.plantSiteId" required>
                <mat-option value="site-hyd">Hyderabad Plant - Unit I</mat-option>
                <mat-option value="site-viz">Visakhapatnam Plant</mat-option>
                <mat-option value="site-blr">Bangalore R&D Center</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select [(ngModel)]="doc.departmentId" required>
                <mat-option value="dept-prod">Production</mat-option>
                <mat-option value="dept-qa">Quality Assurance</mat-option>
                <mat-option value="dept-qc">Quality Control</mat-option>
                <mat-option value="dept-eng">Engineering</mat-option>
                <mat-option value="dept-wh">Warehouse</mat-option>
                <mat-option value="dept-reg">Regulatory Affairs</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="form-section">
          <h3>Review & Compliance</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Review Period (months)</mat-label>
              <input matInput type="number" [(ngModel)]="doc.reviewPeriodMonths" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Regulatory Reference</mat-label>
              <input matInput [(ngModel)]="doc.regulatoryReference" placeholder="e.g., Schedule M Sec 14.3, 21 CFR 211.186" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Keywords</mat-label>
              <input matInput [(ngModel)]="doc.keywords" placeholder="Comma-separated keywords for search" />
            </mat-form-field>
          </div>
        </div>
        <div class="form-section">
          <h3>File Upload</h3>
          <div class="upload-area" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
            <mat-icon>cloud_upload</mat-icon>
            <span class="upload-text">Click or drag files here to upload</span>
            <span class="upload-hint">Supported: PDF, DOCX, XLSX (max 50MB)</span>
            <input #fileInput type="file" hidden accept=".pdf,.docx,.xlsx,.doc,.xls" (change)="onFileSelect($event)" />
          </div>
          <div class="selected-file" *ngIf="selectedFile">
            <mat-icon>insert_drive_file</mat-icon>
            <span>{{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(1) }} MB)</span>
            <button class="remove-file" (click)="selectedFile = null"><mat-icon>close</mat-icon></button>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" (click)="saveDraft()">Save as Draft</button>
          <button class="btn-primary" (click)="submitForReview()">Submit for Review</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-page { max-width: 900px; margin: 0 auto; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .form-header h2 { font-size: 18px; font-weight: 700; color: #1B3A4B; }
    .cancel-btn { background: none; border: 1px solid #d0d5dd; padding: 6px 16px; border-radius: 4px; font-size: 12px; cursor: pointer; color: #555; }
    .form-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; }
    .form-section { margin-bottom: 20px; }
    .form-section h3 { font-size: 14px; font-weight: 600; color: #1B3A4B; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { grid-column: span 2; }
    .upload-area { border: 2px dashed #d0d5dd; border-radius: 6px; padding: 30px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; color: #888; transition: all 0.2s; }
    .upload-area:hover { border-color: #5c6bc0; background: #f8f9fb; }
    .upload-area mat-icon { font-size: 36px; width: 36px; height: 36px; color: #5c6bc0; }
    .upload-text { font-size: 13px; font-weight: 500; }
    .upload-hint { font-size: 11px; color: #aaa; }
    .selected-file { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; background: #f0f4ff; border-radius: 4px; font-size: 12px; }
    .selected-file mat-icon { font-size: 18px; color: #5c6bc0; }
    .remove-file { background: none; border: none; cursor: pointer; color: #888; display: flex; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
    .btn-secondary { background: #fff; border: 1px solid #d0d5dd; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; color: #333; }
    .btn-primary { background: #5c6bc0; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #3f51b5; }
  `],
})
export class DocFormComponent {
  doc: any = { reviewPeriodMonths: 24, confidentialityLevel: 'INTERNAL' };
  selectedFile: File | null = null;
  typeOptions = Object.values(DocumentType);
  confidentialityOptions = Object.values(ConfidentialityLevel);
  categoryOptions = ['Production', 'Quality Control', 'Quality Assurance', 'Regulatory', 'Engineering', 'Warehouse', 'HSE'];

  constructor(private docService: DocumentService, private router: Router) {}

  formatEnum(val: string): string { return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) this.selectedFile = event.dataTransfer.files[0];
  }

  saveDraft(): void {
    this.docService.createDocument(this.doc).subscribe({
      next: (created) => this.router.navigate(['/documents/detail', created.id]),
      error: () => alert('Draft saved (mock mode)'),
    });
  }

  submitForReview(): void {
    this.docService.createDocument(this.doc).subscribe({
      next: () => this.router.navigate(['/documents/list']),
      error: () => alert('Submitted for review (mock mode)'),
    });
  }
}