import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DeviationService } from '../../services/deviation.service';
import { DeviationDashboardMetrics } from '../../models/deviation.model';

@Component({
  selector: 'dev-dashboard',
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
    <div class="deviation-dashboard">
      <div class="page-header">
        <div class="header-left">
          <h1>Deviations</h1>
          <p class="subtitle">Track and investigate deviations from approved processes</p>
        </div>
        <div class="header-actions">
          <button class="vault-create-btn" routerLink="../create">
            + Create
          </button>
        </div>
      </div>

      <div class="metrics-row" *ngIf="metrics">
        <mat-card class="metric-card">
          <div class="metric-icon-wrapper open">
            <mat-icon>report_problem</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalOpen }}</span>
            <span class="metric-label">Open Deviations</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon-wrapper critical-bg">
            <mat-icon>error</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.criticalOpen }}</span>
            <span class="metric-label">Critical Open</span>
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
          <div class="metric-icon-wrapper reported">
            <mat-icon>add_circle</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.totalReportedThisMonth }}</span>
            <span class="metric-label">Reported This Month</span>
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
          <div class="metric-icon-wrapper capa-rate">
            <mat-icon>swap_horiz</mat-icon>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ metrics.capaConversionRate }}%</span>
            <span class="metric-label">CAPA Conversion</span>
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

        <!-- By Status -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Status</mat-card-title>
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
                  [value]="getPercentage(item.count, getMaxStatus())"
                  color="primary">
                </mat-progress-bar>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- By Category -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Category</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="category-list">
              <div class="category-item" *ngFor="let item of metrics.byCategory">
                <span class="cat-name">{{ formatCategory(item.category) }}</span>
                <div class="cat-bar-container">
                  <div class="cat-bar" [style.width.%]="getPercentage(item.count, getMaxCategory())"></div>
                </div>
                <span class="cat-count">{{ item.count }}</span>
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
                  <div class="trend-bar reported" [style.width.%]="item.reported * 10"></div>
                  <div class="trend-bar closed" [style.width.%]="item.closed * 10"></div>
                </div>
                <span class="trend-values">{{ item.reported }} / {{ item.closed }}</span>
              </div>
              <div class="trend-legend">
                <span class="legend-item"><span class="legend-dot reported"></span> Reported</span>
                <span class="legend-item"><span class="legend-dot closed"></span> Closed</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
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
                View All Deviations
              </button>
              <button mat-stroked-button routerLink="../create" class="action-btn">
                <mat-icon>add</mat-icon>
                Report Deviation
              </button>
              <button mat-stroked-button class="action-btn" disabled>
                <mat-icon>assessment</mat-icon>
                Trend Analysis Report
              </button>
              <button mat-stroked-button class="action-btn" disabled>
                <mat-icon>download</mat-icon>
                Export Register
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .deviation-dashboard {
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

    .subtitle { color: #666; margin-top: 4px; font-size: 14px; }

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

    .metric-icon-wrapper.open { background: rgba(237,139,0,0.12); color: #ED8B00; }
    .metric-icon-wrapper.critical-bg { background: #ffebee; color: #c62828; }
    .metric-icon-wrapper.overdue { background: #fce4ec; color: #c62828; }
    .metric-icon-wrapper.reported { background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .metric-icon-wrapper.closed { background: #e8f5e9; color: #388e3c; }
    .metric-icon-wrapper.capa-rate { background: rgba(44,95,124,0.1); color: #2C5F7C; }

    .metric-body { display: flex; flex-direction: column; }
    .metric-value { font-size: 22px; font-weight: 700; color: #333; }
    .metric-label { font-size: 12px; color: #666; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card { padding: 8px; }
    .chart-card.wide { grid-column: 1 / -1; }

    .classification-grid {
      display: flex;
      justify-content: space-around;
      padding: 20px 0;
    }

    .classification-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .class-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      color: white;
    }

    .class-circle.critical { background: #c62828; }
    .class-circle.major { background: #ED8B00; }
    .class-circle.minor { background: #2C5F7C; }

    .class-label { font-size: 12px; font-weight: 500; color: #666; }

    .status-bars { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }

    .status-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .status-name { color: #555; }
    .status-count { font-weight: 600; color: #333; }

    .category-list, .department-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px 0;
    }

    .category-item, .dept-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cat-name, .dept-name {
      font-size: 13px;
      color: #555;
      min-width: 110px;
    }

    .cat-bar-container, .dept-bar-container {
      flex: 1;
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
    }

    .cat-bar {
      height: 100%;
      background: #ED8B00;
      border-radius: 4px;
    }

    .dept-bar {
      height: 100%;
      background: #2C5F7C;
      border-radius: 4px;
    }

    .cat-count, .dept-count {
      font-weight: 600;
      font-size: 13px;
      min-width: 24px;
      text-align: right;
    }

    .trend-chart { padding: 8px 0; }

    .trend-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .trend-month { font-size: 13px; color: #666; min-width: 36px; }

    .trend-bars {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .trend-bar { height: 6px; border-radius: 3px; }
    .trend-bar.reported { background: #ED8B00; }
    .trend-bar.closed { background: #66bb6a; }

    .trend-values { font-size: 11px; color: #888; min-width: 44px; text-align: right; }

    .trend-legend {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: #666;
    }

    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
    .legend-dot.reported { background: #ED8B00; }
    .legend-dot.closed { background: #66bb6a; }

    .actions-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding: 8px 0;
    }

    .action-btn { display: flex; align-items: center; gap: 8px; }

    @media (max-width: 768px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; }
    }
  `],
})
export class DeviationDashboardComponent implements OnInit {
  metrics: DeviationDashboardMetrics | null = null;

  constructor(private deviationService: DeviationService) {}

  ngOnInit(): void {
    this.deviationService.getDashboardMetrics().subscribe((data) => {
      this.metrics = data;
    });
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getPercentage(count: number, max: number): number {
    return max > 0 ? (count / max) * 100 : 0;
  }

  getMaxStatus(): number {
    return Math.max(...(this.metrics?.byStatus.map((s) => s.count) || [1]));
  }

  getMaxCategory(): number {
    return Math.max(...(this.metrics?.byCategory.map((c) => c.count) || [1]));
  }

  getMaxDept(): number {
    return Math.max(...(this.metrics?.byDepartment.map((d) => d.count) || [1]));
  }
}
