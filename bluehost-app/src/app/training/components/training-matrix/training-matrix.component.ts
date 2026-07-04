import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TrainingService } from '../../services/training.service';
import { TrainingMatrix } from '../../models/training.model';

interface MatrixRow {
  jobRoleName: string;
  curricula: { curriculumNumber: string; curriculumTitle: string; mandatory: boolean; frequencyMonths?: number }[];
}

@Component({
  selector: 'trn-training-matrix',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="matrix-page">
      <div class="page-header">
        <h2>Training Matrix</h2>
        <div class="filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Department</mat-label>
            <mat-select [(ngModel)]="selectedDepartment" (selectionChange)="applyFilter()">
              <mat-option value="">All Departments</mat-option>
              <mat-option *ngFor="let d of departments" [value]="d">{{ d }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <div class="matrix-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="role-col">Job Role</th>
              <th *ngFor="let h of curriculumHeaders" class="cur-col">
                <div class="cur-header">{{ h.number }}<br /><span class="cur-name">{{ h.title }}</span></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of matrixRows">
              <td class="role-name">{{ row.jobRoleName }}</td>
              <td *ngFor="let h of curriculumHeaders" class="cell" [class.required]="!!getCellData(row.jobRoleName, h.number)">
                <ng-container *ngIf="getCellData(row.jobRoleName, h.number); let cell">
                  <mat-icon class="check-icon" [class.mandatory]="cell.mandatory">{{ cell.mandatory ? 'check_circle' : 'radio_button_checked' }}</mat-icon>
                  <span class="freq" *ngIf="cell.frequencyMonths">{{ cell.frequencyMonths }}m</span>
                </ng-container>
                <span class="na" *ngIf="!getCellData(row.jobRoleName, h.number)">-</span>
              </td>
            </tr>
            <tr *ngIf="matrixRows.length === 0"><td [attr.colspan]="curriculumHeaders.length + 1" class="empty">No training matrix data available</td></tr>
          </tbody>
        </table>
      </div>

      <div class="legend">
        <div class="legend-item"><mat-icon class="check-icon mandatory">check_circle</mat-icon><span>Mandatory</span></div>
        <div class="legend-item"><mat-icon class="check-icon">radio_button_checked</mat-icon><span>Recommended</span></div>
        <div class="legend-item"><span class="freq-example">12m</span><span>Retraining frequency</span></div>
      </div>
    </div>
  `,
  styles: [`
    .matrix-page { max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .page-header h2 { font-size: 18px; font-weight: 700; color: #1B3A4B; }
    .filter-field { width: 180px; }
    ::ng-deep .filter-field .mat-mdc-form-field-wrapper { margin: 0; padding: 0; }
    ::ng-deep .filter-field .mdc-text-field { height: 40px; }
    .matrix-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow-x: auto; }
    .matrix-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .matrix-table th { background: #fafbfc; padding: 10px 8px; text-align: center; font-weight: 600; color: #555; border-bottom: 2px solid #e5e7eb; }
    .matrix-table th.role-col { text-align: left; min-width: 160px; }
    .cur-col { min-width: 100px; }
    .cur-header { font-size: 10px; font-weight: 700; color: #00897b; }
    .cur-name { font-size: 9px; font-weight: 400; color: #888; }
    .matrix-table td { padding: 10px 8px; border-bottom: 1px solid #f5f5f5; text-align: center; }
    .role-name { text-align: left; font-weight: 600; color: #1B3A4B; }
    .check-icon { font-size: 18px; width: 18px; height: 18px; color: #00897b; }
    .check-icon.mandatory { color: #2e7d32; }
    .freq { display: block; font-size: 9px; color: #888; margin-top: 2px; }
    .na { color: #ddd; }
    .legend { display: flex; gap: 20px; margin-top: 12px; padding: 10px 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #555; }
    .freq-example { font-size: 10px; color: #888; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    .empty { text-align: center; color: #888; padding: 24px; }
  `],
})
export class TrainingMatrixComponent implements OnInit {
  allMatrixData: TrainingMatrix[] = [];
  filteredData: TrainingMatrix[] = [];
  matrixRows: MatrixRow[] = [];
  curriculumHeaders: { number: string; title: string }[] = [];
  departments: string[] = [];
  selectedDepartment = '';

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainingService.getMatrix().subscribe(data => {
      this.allMatrixData = data;
      this.departments = [...new Set(data.map(d => d.departmentName))];
      this.buildMatrix(data);
    });
  }

  applyFilter(): void {
    const filtered = this.selectedDepartment
      ? this.allMatrixData.filter(d => d.departmentName === this.selectedDepartment)
      : this.allMatrixData;
    this.buildMatrix(filtered);
  }

  private buildMatrix(data: TrainingMatrix[]): void {
    this.filteredData = data;
    this.curriculumHeaders = [...new Map(data.map(d => [d.curriculumNumber, { number: d.curriculumNumber, title: d.curriculumTitle }])).values()];
    const roleMap = new Map<string, TrainingMatrix[]>();
    data.forEach(d => {
      if (!roleMap.has(d.jobRoleName)) roleMap.set(d.jobRoleName, []);
      roleMap.get(d.jobRoleName)!.push(d);
    });
    this.matrixRows = Array.from(roleMap.entries()).map(([name, items]) => ({
      jobRoleName: name,
      curricula: items.map(i => ({ curriculumNumber: i.curriculumNumber, curriculumTitle: i.curriculumTitle, mandatory: i.mandatory, frequencyMonths: i.frequencyMonths })),
    }));
  }

  getCellData(roleName: string, curNumber: string): { mandatory: boolean; frequencyMonths?: number } | null {
    const entry = this.filteredData.find(d => d.jobRoleName === roleName && d.curriculumNumber === curNumber);
    return entry ? { mandatory: entry.mandatory, frequencyMonths: entry.frequencyMonths } : null;
  }
}