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
import { TrainingService } from '../../services/training.service';
import { TrainingCategory, TrainingType } from '../../models/training.model';

@Component({
  selector: 'trn-curriculum-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <div class="form-page">
      <div class="form-header">
        <h2>Create New Training Curriculum</h2>
        <button class="cancel-btn" routerLink="../curricula">Cancel</button>
      </div>
      <div class="form-card">
        <div class="form-section">
          <h3>Curriculum Information</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="cur.title" required placeholder="e.g., GMP Fundamentals for Manufacturing Personnel" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="cur.description" rows="3" placeholder="Training objective, scope, and target audience"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="cur.category" required>
                <mat-option *ngFor="let c of categoryOptions" [value]="c">{{ formatEnum(c) }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Training Type</mat-label>
              <mat-select [(ngModel)]="cur.trainingType" required>
                <mat-option *ngFor="let t of typeOptions" [value]="t">{{ formatEnum(t) }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Duration (hours)</mat-label>
              <input matInput type="number" [(ngModel)]="cur.durationHours" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Validity (months)</mat-label>
              <input matInput type="number" [(ngModel)]="cur.validityMonths" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Passing Score (%)</mat-label>
              <input matInput type="number" [(ngModel)]="cur.passingScore" placeholder="e.g., 80" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Regulatory Reference</mat-label>
              <input matInput [(ngModel)]="cur.regulatoryReference" placeholder="e.g., Schedule M Part I Sec 3" />
            </mat-form-field>
          </div>
        </div>
        <div class="form-section">
          <h3>Location & Ownership</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Plant Site</mat-label>
              <mat-select [(ngModel)]="cur.plantSiteId" required>
                <mat-option value="site-hyd">Hyderabad Plant - Unit I</mat-option>
                <mat-option value="site-viz">Visakhapatnam Plant</mat-option>
                <mat-option value="site-blr">Bangalore R&D Center</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select [(ngModel)]="cur.departmentId" required>
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
          <h3>Related Document</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Related Document Number</mat-label>
              <input matInput [(ngModel)]="cur.relatedDocumentNumber" placeholder="e.g., SOP-2025-001 (links training to controlled document)" />
            </mat-form-field>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" (click)="saveDraft()">Save as Draft</button>
          <button class="btn-primary" (click)="activate()">Activate Curriculum</button>
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
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
    .btn-secondary { background: #fff; border: 1px solid #d0d5dd; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; color: #333; }
    .btn-primary { background: #00897b; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #00695c; }
  `],
})
export class CurriculumFormComponent {
  cur: any = { durationHours: 4, validityMonths: 12 };
  categoryOptions = Object.values(TrainingCategory);
  typeOptions = Object.values(TrainingType);

  constructor(private trainingService: TrainingService, private router: Router) {}

  formatEnum(val: string): string { return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

  saveDraft(): void {
    this.trainingService.createCurriculum(this.cur).subscribe({
      next: (created) => this.router.navigate(['/training/curricula', created.id]),
      error: () => alert('Draft saved (mock mode)'),
    });
  }

  activate(): void {
    this.cur.status = 'ACTIVE';
    this.trainingService.createCurriculum(this.cur).subscribe({
      next: () => this.router.navigate(['/training/curricula']),
      error: () => alert('Curriculum activated (mock mode)'),
    });
  }
}