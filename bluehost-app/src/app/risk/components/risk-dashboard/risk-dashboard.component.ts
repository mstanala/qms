import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { RiskService } from '../../services/risk.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-risk-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatGridListModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Risk Management Dashboard</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="../registers/create" [disabled]="!canCreateRisk">
            <mat-icon>add</mat-icon> New Risk Register
          </button>
          <button mat-stroked-button routerLink="../matrix">
            <mat-icon>grid_on</mat-icon> Risk Matrix
          </button>
        </div>
      </div>

      <div class="kpi-cards">
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['totalRegisters'] || 0 }}</div>
            <div class="kpi-label">Total Registers</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['totalAssessments'] || 0 }}</div>
            <div class="kpi-label">Risk Assessments</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card warning">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['unacceptableRisks'] || 0 }}</div>
            <div class="kpi-label">Unacceptable Risks</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ getHighRiskCount() }}</div>
            <div class="kpi-label">High/Critical Risks</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dashboard-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Risks by Level</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="risk-level-bars">
              <div class="bar-item" *ngFor="let item of riskLevelData">
                <span class="bar-label">{{ item.level }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="item.percentage" [class]="'level-' + item.level.toLowerCase()"></div>
                </div>
                <span class="bar-value">{{ item.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Registers by Type</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="type-list">
              <div class="type-item" *ngFor="let item of registerTypeData">
                <span class="type-label">{{ item.type }}</span>
                <span class="type-count">{{ item.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Registers by Methodology</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="type-list">
              <div class="type-item" *ngFor="let item of methodologyData">
                <span class="type-label">{{ item.methodology }}</span>
                <span class="type-count">{{ item.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quick-actions">
              <button mat-stroked-button routerLink="../registers" class="action-btn">
                <mat-icon>list</mat-icon> View All Registers
              </button>
              <button mat-stroked-button routerLink="../matrix" class="action-btn">
                <mat-icon>grid_on</mat-icon> Risk Matrix View
              </button>
              <button mat-stroked-button routerLink="../registers/create" class="action-btn" [disabled]="!canCreateRisk">
                <mat-icon>add_circle</mat-icon> New FMEA Assessment
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .dashboard-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .header-actions { display: flex; gap: 12px; }
    .kpi-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { text-align: center; }
    .kpi-card.warning { border-left: 4px solid #f44336; }
    .kpi-value { font-size: 36px; font-weight: 700; color: #1976d2; }
    .kpi-card.warning .kpi-value { color: #f44336; }
    .kpi-label { font-size: 14px; color: #666; margin-top: 4px; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 16px; }
    .chart-card { min-height: 200px; }
    .risk-level-bars { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; }
    .bar-item { display: flex; align-items: center; gap: 12px; }
    .bar-label { width: 80px; font-size: 13px; font-weight: 500; }
    .bar-track { flex: 1; height: 24px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .bar-fill.level-critical { background: #d32f2f; }
    .bar-fill.level-high { background: #f57c00; }
    .bar-fill.level-medium { background: #fbc02d; }
    .bar-fill.level-low { background: #388e3c; }
    .bar-value { width: 30px; text-align: right; font-weight: 600; }
    .type-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .type-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #f9f9f9; border-radius: 4px; }
    .type-label { font-size: 14px; }
    .type-count { font-weight: 600; color: #1976d2; }
    .quick-actions { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .action-btn { justify-content: flex-start; }
  `],
})
export class RiskDashboardComponent implements OnInit {
  metrics: Record<string, unknown> | null = null;
  riskLevelData: { level: string; count: number; percentage: number }[] = [];
  registerTypeData: { type: string; count: number }[] = [];
  methodologyData: { methodology: string; count: number }[] = [];
  canCreateRisk = hasStoredPermission('RISK', 'CREATE', 'risk_register');

  constructor(private riskService: RiskService) {}

  ngOnInit(): void {
    this.riskService.getDashboard().subscribe((data) => {
      this.metrics = data;
      this.processRiskLevels(data['byRiskLevel'] as [string, number][] || []);
      this.processRegisterTypes(data['registersByType'] as [string, number][] || []);
      this.processMethodology(data['registersByMethodology'] as [string, number][] || []);
    });
  }

  getHighRiskCount(): number {
    return this.riskLevelData
      .filter((d) => d.level === 'CRITICAL' || d.level === 'HIGH')
      .reduce((sum, d) => sum + d.count, 0);
  }

  private processRiskLevels(data: [string, number][]): void {
    const total = data.reduce((sum, [, count]) => sum + count, 0) || 1;
    this.riskLevelData = data.map(([level, count]) => ({
      level,
      count,
      percentage: (count / total) * 100,
    }));
  }

  private processRegisterTypes(data: [string, number][]): void {
    this.registerTypeData = data.map(([type, count]) => ({ type, count }));
  }

  private processMethodology(data: [string, number][]): void {
    this.methodologyData = data.map(([methodology, count]) => ({ methodology, count }));
  }
}
