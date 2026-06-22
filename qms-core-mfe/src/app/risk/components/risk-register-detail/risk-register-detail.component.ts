import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { RiskService, RiskRegister, RiskAssessment } from '../../services/risk.service';

@Component({
  selector: 'qms-risk-register-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatChipsModule, MatTableModule, MatMenuModule
  ],
  template: `
    <div class="detail-container" *ngIf="register">
      <div class="detail-header">
        <div class="header-info">
          <h1>{{ register.title }}</h1>
          <div class="header-meta">
            <mat-chip>{{ register.registerNumber }}</mat-chip>
            <mat-chip [class]="'status-' + register.status.toLowerCase()">{{ register.status }}</mat-chip>
            <mat-chip>{{ register.riskType }}</mat-chip>
            <mat-chip>{{ register.methodology }}</mat-chip>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button [matMenuTriggerFor]="statusMenu" color="primary">
            <mat-icon>swap_horiz</mat-icon> Change Status
          </button>
          <mat-menu #statusMenu="matMenu">
            <button mat-menu-item (click)="changeStatus('ACTIVE')">Active</button>
            <button mat-menu-item (click)="changeStatus('UNDER_REVIEW')">Under Review</button>
            <button mat-menu-item (click)="changeStatus('APPROVED')">Approved</button>
            <button mat-menu-item (click)="changeStatus('CLOSED')">Closed</button>
          </mat-menu>
          <button mat-stroked-button routerLink="../../registers">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Overview">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item"><span class="label">Description</span><span>{{ register.description }}</span></div>
                  <div class="info-item"><span class="label">Scope</span><span>{{ register.scope }}</span></div>
                  <div class="info-item"><span class="label">Priority</span><span>{{ register.priority }}</span></div>
                  <div class="info-item"><span class="label">Review Frequency</span><span>{{ register.reviewFrequencyMonths }} months</span></div>
                  <div class="info-item"><span class="label">Created</span><span>{{ register.createdAt | date:'medium' }}</span></div>
                  <div class="info-item"><span class="label">Last Updated</span><span>{{ register.updatedAt | date:'medium' }}</span></div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Assessments ({{ assessments.length }})">
          <div class="tab-content">
            <table mat-table [dataSource]="assessments" class="assessment-table">
              <ng-container matColumnDef="assessmentNumber">
                <th mat-header-cell *matHeaderCellDef>Assessment #</th>
                <td mat-cell *matCellDef="let row">{{ row.assessmentNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="hazardDescription">
                <th mat-header-cell *matHeaderCellDef>Hazard</th>
                <td mat-cell *matCellDef="let row">{{ row.hazardDescription }}</td>
              </ng-container>
              <ng-container matColumnDef="initialRiskLevel">
                <th mat-header-cell *matHeaderCellDef>Initial Risk</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [class]="'level-' + (row.initialRiskLevel || '').toLowerCase()">{{ row.initialRiskLevel }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="residualRiskLevel">
                <th mat-header-cell *matHeaderCellDef>Residual Risk</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip *ngIf="row.residualRiskLevel" [class]="'level-' + row.residualRiskLevel.toLowerCase()">{{ row.residualRiskLevel }}</mat-chip>
                  <span *ngIf="!row.residualRiskLevel">—</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">{{ row.status }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="assessmentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: assessmentColumns;"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .detail-container { padding: 24px; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-info h1 { margin: 0 0 8px; }
    .header-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; }
    .tab-content { padding: 24px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { display: flex; flex-direction: column; }
    .info-item .label { font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; }
    .assessment-table { width: 100%; }
    .status-draft { background: #e0e0e0 !important; }
    .status-active { background: #c8e6c9 !important; }
    .status-under_review { background: #fff9c4 !important; }
    .status-approved { background: #bbdefb !important; }
    .level-critical { background: #d32f2f !important; color: white !important; }
    .level-high { background: #f57c00 !important; color: white !important; }
    .level-medium { background: #fbc02d !important; }
    .level-low { background: #388e3c !important; color: white !important; }
  `],
})
export class RiskRegisterDetailComponent implements OnInit {
  register: RiskRegister | null = null;
  assessments: RiskAssessment[] = [];
  assessmentColumns = ['assessmentNumber', 'hazardDescription', 'initialRiskLevel', 'residualRiskLevel', 'status'];

  constructor(
    private route: ActivatedRoute,
    private riskService: RiskService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.riskService.getRegister(id).subscribe((r) => (this.register = r));
    this.riskService.listAssessments(id).subscribe((a) => (this.assessments = a));
  }

  changeStatus(status: string): void {
    if (!this.register) return;
    this.riskService.transitionRegisterStatus(this.register.id, status).subscribe((r) => {
      this.register = r;
    });
  }
}
