import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CapaService } from '../../services/capa.service';
import { CapaDashboardMetrics } from '../../models/capa.model';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'capa-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="capa-dashboard">
      <div class="page-header">
        <div class="header-left">
          <h1>CAPA Management</h1>
          <p class="subtitle">Corrective and Preventive Actions Dashboard</p>
        </div>
        <div class="header-actions">
          <button class="vault-create-btn" routerLink="../create" [disabled]="!canCreateCapa">
            + Create
          </button>
        </div>
      </div>

      <div class="quick-actions">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="actions-grid">
              <button mat-stroked-button routerLink="../list" class="action-btn">
                <mat-icon>list</mat-icon>
                View All CAPAs
              </button>
              <button mat-stroked-button routerLink="../create" class="action-btn" [disabled]="!canCreateCapa">
                <mat-icon>add</mat-icon>
                New CAPA
              </button>
              <button mat-stroked-button class="action-btn" disabled>
                <mat-icon>assessment</mat-icon>
                Generate Report
              </button>
              <button mat-stroked-button class="action-btn" disabled>
                <mat-icon>download</mat-icon>
                Export Data
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="metrics-row" *ngIf="metrics">
        <mat-card class="metric-card highlight-card">
          <div class="metric-icon-wrapper critical">
            <mat-icon>warning_amber</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalOpen }}</span>
            <span class="metric-label">Open CAPAs</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper overdue">
            <mat-icon>schedule</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalOverdue }}</span>
            <span class="metric-label">Overdue</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper initiated">
            <mat-icon>add_circle</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalInitiatedThisMonth }}</span>
            <span class="metric-label">Initiated This Month</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper closed">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalClosedThisMonth }}</span>
            <span class="metric-label">Closed This Month</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper avg">
            <mat-icon>timer</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.avgClosureTimeDays }}d</span>
            <span class="metric-label">Avg. Closure Time</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper effectiveness">
            <mat-icon>verified</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.effectivenessRate }}%</span>
            <span class="metric-label">Effectiveness Rate</span>
          </div>
        </mat-card>
      </div>

      <div class="dashboard-grid" *ngIf="metrics">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>CAPA by Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-bars">
              <div class="status-bar-item" *ngFor="let item of metrics.byStatus">
                <div class="status-bar-label">
                  <span class="status-name">{{ formatStatus(item.status) }}</span>
                  <span class="status-count">{{ item.count }}</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="getStatusPercentage(item.count)"
                  [color]="getStatusColor(item.status)">
                </mat-progress-bar>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>CAPA by Priority</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="priority-grid">
              <div class="priority-item" *ngFor="let item of metrics.byPriority">
                <div class="priority-circle" [ngClass]="item.priority.toLowerCase()">
                  {{ item.count }}
                </div>
                <span class="priority-label">{{ item.priority }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>CAPA by Department</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="department-list">
              <div class="department-item" *ngFor="let item of metrics.byDepartment">
                <span class="dept-name">{{ item.department }}</span>
                <div class="dept-bar-container">
                  <div class="dept-bar" [style.width.%]="getDeptPercentage(item.count)"></div>
                </div>
                <span class="dept-count">{{ item.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Monthly Trend</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="trend-chart">
              <div class="trend-row" *ngFor="let item of metrics.trendData">
                <span class="trend-month">{{ item.month }}</span>
                <div class="trend-bars">
                  <div class="trend-bar initiated" [style.width.%]="item.initiated * 12"></div>
                  <div class="trend-bar closed" [style.width.%]="item.closed * 12"></div>
                </div>
              </div>
              <div class="trend-legend">
                <span class="legend-item"><span class="legend-dot initiated"></span> Initiated</span>
                <span class="legend-item"><span class="legend-dot closed"></span> Closed</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .capa-dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 22px;
      font-weight: 600;
      color: #2C5F7C;
      margin: 0;
    }

    .vault-create-btn { background: #ED8B00; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .vault-create-btn:hover { background: #D4760A; }
    .vault-create-btn:disabled { background: #cbd5e1; color: #64748b; cursor: default; }

    .subtitle {
      color: #666;
      margin-top: 4px;
      font-size: 14px;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 12px;
    }

    .metric-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon-wrapper.critical { background: rgba(237,139,0,0.12); color: #ED8B00; }
    .metric-icon-wrapper.overdue { background: #ffebee; color: #c62828; }
    .metric-icon-wrapper.initiated { background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .metric-icon-wrapper.closed { background: #e8f5e9; color: #388e3c; }
    .metric-icon-wrapper.avg { background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .metric-icon-wrapper.effectiveness { background: rgba(44,95,124,0.1); color: #2C5F7C; }

    .metric-body {
      display: flex;
      flex-direction: column;
    }

    .metric-value {
      font-size: 22px;
      font-weight: 700;
      color: #333;
    }

    .metric-label {
      font-size: 12px;
      color: #666;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card {
      padding: 8px;
    }

    .status-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }

    .status-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .status-name { color: #555; }
    .status-count { font-weight: 600; color: #333; }

    .priority-grid {
      display: flex;
      justify-content: space-around;
      padding: 16px 0;
    }

    .priority-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .priority-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: white;
    }

    .priority-circle.critical { background: #c62828; }
    .priority-circle.high { background: #ED8B00; }
    .priority-circle.medium { background: #2C5F7C; }
    .priority-circle.low { background: #388e3c; }

    .priority-label {
      font-size: 12px;
      font-weight: 500;
      color: #666;
    }

    .department-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }

    .department-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dept-name {
      font-size: 13px;
      color: #555;
      min-width: 120px;
    }

    .dept-bar-container {
      flex: 1;
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
    }

    .dept-bar {
      height: 100%;
      background: #2C5F7C;
      border-radius: 4px;
    }

    .dept-count {
      font-weight: 600;
      font-size: 13px;
      min-width: 24px;
      text-align: right;
    }

    .trend-chart {
      padding: 8px 0;
    }

    .trend-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .trend-month {
      font-size: 13px;
      color: #666;
      min-width: 36px;
    }

    .trend-bars {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .trend-bar {
      height: 6px;
      border-radius: 3px;
    }

    .trend-bar.initiated { background: #ED8B00; }
    .trend-bar.closed { background: #66bb6a; }

    .trend-legend {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: #666;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .legend-dot.initiated { background: #ED8B00; }
    .legend-dot.closed { background: #66bb6a; }

    .quick-actions {
      margin-bottom: 24px;
    }

    .actions-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding: 8px 0;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
    }
  `],
})
export class CapaDashboardComponent implements OnInit {
  metrics: CapaDashboardMetrics | null = null;
  canCreateCapa = hasStoredPermission('CAPA', 'CREATE', 'capa_record');

  constructor(private capaService: CapaService) {}

  ngOnInit(): void {
    this.capaService.getDashboardMetrics().subscribe((data) => {
      this.metrics = data;
    });
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStatusPercentage(count: number): number {
    const max = Math.max(...(this.metrics?.byStatus.map((s) => s.count) || [1]));
    return (count / max) * 100;
  }

  getStatusColor(status: string): string {
    if (status === 'CLOSED') return 'accent';
    return 'primary';
  }

  getDeptPercentage(count: number): number {
    const max = Math.max(...(this.metrics?.byDepartment.map((d) => d.count) || [1]));
    return (count / max) * 100;
  }
}
