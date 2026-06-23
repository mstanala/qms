import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChangeControlService } from '../../services/change-control.service';
import { ChangeControlDashboardMetrics } from '../../models/change-control.model';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'cc-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="cc-dashboard">
      <div class="page-header">
        <div class="header-left">
          <h1>Change Control</h1>
          <p class="subtitle">Manage and track changes to validated systems, processes, and documents</p>
        </div>
        <div class="header-actions">
          <button class="vault-create-btn" routerLink="../create" [disabled]="!canCreateChange">
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
                <mat-icon>list_alt</mat-icon>
                View All Changes
              </button>
              <button mat-stroked-button routerLink="../create" class="action-btn" [disabled]="!canCreateChange">
                <mat-icon>add_circle</mat-icon>
                New Change Request
              </button>
              <button mat-stroked-button class="action-btn" disabled>
                <mat-icon>assessment</mat-icon>
                Cycle Time Report
              </button>
              <button mat-stroked-button class="action-btn" disabled>
                <mat-icon>download</mat-icon>
                Export Register
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="metrics-row" *ngIf="metrics">
        <mat-card class="metric-card">
          <div class="metric-icon-wrapper open">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalOpen }}</span>
            <span class="metric-label">Open Changes</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper approval">
            <mat-icon>how_to_reg</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalPendingApproval }}</span>
            <span class="metric-label">Pending Approval</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper implementation">
            <mat-icon>build</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalInImplementation }}</span>
            <span class="metric-label">In Implementation</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper overdue">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalOverdue }}</span>
            <span class="metric-label">Overdue</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper submitted">
            <mat-icon>upload_file</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalSubmittedThisMonth }}</span>
            <span class="metric-label">Submitted This Month</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper rate">
            <mat-icon>thumb_up</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.approvalRate }}%</span>
            <span class="metric-label">Approval Rate</span>
          </div>
        </mat-card>
      </div>

      <div class="dashboard-grid" *ngIf="metrics">
        <!-- By Classification -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Classification</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="classification-grid">
              <div class="classification-item" *ngFor="let item of metrics.byClassification">
                <div class="class-circle" [ngClass]="item.classification.toLowerCase()">
                  {{ item.count }}
                </div>
                <span class="class-label">{{ item.classification }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- By Priority -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Priority</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="priority-bars">
              <div class="priority-bar-item" *ngFor="let item of metrics.byPriority">
                <div class="priority-label">
                  <span class="priority-dot" [ngClass]="item.priority.toLowerCase()"></span>
                  <span class="priority-name">{{ item.priority }}</span>
                  <span class="priority-count">{{ item.count }}</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="getPercentage(item.count, getMaxPriority())"
                  [color]="item.priority === 'URGENT' ? 'warn' : 'primary'">
                </mat-progress-bar>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- By Type -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Change Type</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="type-list">
              <div class="type-item" *ngFor="let item of metrics.byType">
                <span class="type-name">{{ formatType(item.type) }}</span>
                <div class="type-bar-container">
                  <div class="type-bar" [style.width.%]="getPercentage(item.count, getMaxType())"></div>
                </div>
                <span class="type-count">{{ item.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- By Department -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Department</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="department-list">
              <div class="dept-item" *ngFor="let item of metrics.byDepartment">
                <span class="dept-name">{{ item.department }}</span>
                <div class="dept-bar-container">
                  <div class="dept-bar" [style.width.%]="getPercentage(item.count, getMaxDept())"></div>
                </div>
                <span class="dept-count">{{ item.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Monthly Trend -->
        <mat-card class="chart-card wide">
          <mat-card-header>
            <mat-card-title>Monthly Trend</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="trend-chart">
              <div class="trend-row" *ngFor="let item of metrics.trendData">
                <span class="trend-month">{{ item.month }}</span>
                <div class="trend-bars">
                  <div class="trend-bar submitted" [style.width.%]="item.submitted * 10"></div>
                  <div class="trend-bar closed" [style.width.%]="item.closed * 10"></div>
                  <div class="trend-bar rejected" [style.width.%]="item.rejected * 10"></div>
                </div>
                <span class="trend-values">{{ item.submitted }}/{{ item.closed }}/{{ item.rejected }}</span>
              </div>
              <div class="trend-legend">
                <span class="legend-item"><span class="legend-dot submitted"></span> Submitted</span>
                <span class="legend-item"><span class="legend-dot closed"></span> Closed</span>
                <span class="legend-item"><span class="legend-dot rejected"></span> Rejected</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .cc-dashboard { max-width: 1400px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { color: #666; margin-top: 4px; font-size: 14px; }
    .vault-create-btn { background: #ED8B00; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .vault-create-btn:hover { background: #D4760A; }

    .metrics-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }

    .metric-card { display: flex; align-items: center; padding: 16px; gap: 12px; }

    .metric-icon-wrapper { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .metric-icon-wrapper.open { background: rgba(237,139,0,0.12); color: #ED8B00; }
    .metric-icon-wrapper.approval { background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .metric-icon-wrapper.implementation { background: #e8f5e9; color: #388e3c; }
    .metric-icon-wrapper.overdue { background: #ffebee; color: #c62828; }
    .metric-icon-wrapper.submitted { background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .metric-icon-wrapper.rate { background: rgba(44,95,124,0.1); color: #2C5F7C; }

    .metric-body { display: flex; flex-direction: column; }
    .metric-value { font-size: 22px; font-weight: 700; color: #333; }
    .metric-label { font-size: 12px; color: #666; }

    .dashboard-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .chart-card { padding: 8px; }
    .chart-card.wide { grid-column: 1 / -1; }

    .classification-grid { display: flex; justify-content: space-around; padding: 20px 0; }
    .classification-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .class-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: white; }
    .class-circle.critical { background: #c62828; }
    .class-circle.major { background: #ED8B00; }
    .class-circle.minor { background: #2C5F7C; }
    .class-label { font-size: 12px; font-weight: 500; color: #666; }

    .priority-bars { display: flex; flex-direction: column; gap: 12px; padding: 12px 0; }
    .priority-label { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .priority-dot { width: 10px; height: 10px; border-radius: 50%; }
    .priority-dot.urgent { background: #c62828; }
    .priority-dot.high { background: #ED8B00; }
    .priority-dot.medium { background: #2C5F7C; }
    .priority-dot.low { background: #388e3c; }
    .priority-name { font-size: 13px; color: #555; flex: 1; }
    .priority-count { font-weight: 600; font-size: 13px; }

    .type-list, .department-list { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
    .type-item, .dept-item { display: flex; align-items: center; gap: 12px; }
    .type-name, .dept-name { font-size: 13px; color: #555; min-width: 100px; }
    .type-bar-container, .dept-bar-container { flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
    .type-bar { height: 100%; background: #ED8B00; border-radius: 4px; }
    .dept-bar { height: 100%; background: #2C5F7C; border-radius: 4px; }
    .type-count, .dept-count { font-weight: 600; font-size: 13px; min-width: 24px; text-align: right; }

    .trend-chart { padding: 8px 0; }
    .trend-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .trend-month { font-size: 13px; color: #666; min-width: 36px; }
    .trend-bars { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .trend-bar { height: 6px; border-radius: 3px; }
    .trend-bar.submitted { background: #ED8B00; }
    .trend-bar.closed { background: #66bb6a; }
    .trend-bar.rejected { background: #ef5350; }
    .trend-values { font-size: 11px; color: #888; min-width: 55px; text-align: right; }

    .trend-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; color: #666; }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
    .legend-dot.submitted { background: #ED8B00; }
    .legend-dot.closed { background: #66bb6a; }
    .legend-dot.rejected { background: #ef5350; }

    .quick-actions { margin-bottom: 24px; }
    .actions-grid { display: flex; gap: 12px; flex-wrap: wrap; padding: 8px 0; }
    .action-btn { display: flex; align-items: center; gap: 8px; }
    .vault-create-btn:disabled { background: #cbd5e1; color: #64748b; cursor: default; }

    @media (max-width: 768px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; }
    }
  `],
})
export class CcDashboardComponent implements OnInit {
  metrics: ChangeControlDashboardMetrics | null = null;
  canCreateChange = hasStoredPermission('CHANGE_CONTROL', 'CREATE', 'change_request');

  constructor(private ccService: ChangeControlService) {}

  ngOnInit(): void {
    this.ccService.getDashboardMetrics().subscribe((data) => {
      this.metrics = data;
    });
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getPercentage(count: number, max: number): number {
    return max > 0 ? (count / max) * 100 : 0;
  }

  getMaxPriority(): number {
    return Math.max(...(this.metrics?.byPriority.map((p) => p.count) || [1]));
  }

  getMaxType(): number {
    return Math.max(...(this.metrics?.byType.map((t) => t.count) || [1]));
  }

  getMaxDept(): number {
    return Math.max(...(this.metrics?.byDepartment.map((d) => d.count) || [1]));
  }
}
