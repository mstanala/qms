import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeviationService } from '../../services/deviation.service';
import { DeviationDashboardMetrics } from '../../models/deviation.model';
import { hasStoredPermission } from '../../../permission.guard';

interface PieRow {
  label: string;
  value: number;
}

interface PieSlice extends PieRow {
  color: string;
  path: string;
  labelX: number;
  labelY: number;
}

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
    MatSnackBarModule,
  ],
  template: `
    <div class="deviation-dashboard">
      <div class="page-header">
        <div class="header-left">
          <h1>Deviations</h1>
          <p class="subtitle">Track and investigate deviations from approved processes</p>
        </div>
        <div class="header-actions">
          <button class="vault-create-btn" routerLink="../create" [disabled]="!canCreateDeviation">
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
                View All Deviations
              </button>
              <button mat-stroked-button routerLink="../create" class="action-btn" [disabled]="!canCreateDeviation">
                <mat-icon>add</mat-icon>
                Report Deviation
              </button>
              <button mat-stroked-button class="action-btn" (click)="downloadTrendReport()" [disabled]="!canReadDeviation || !metrics">
                <mat-icon>assessment</mat-icon>
                Trend Analysis Report
              </button>
              <button mat-stroked-button class="action-btn" (click)="exportRegister()" [disabled]="!canReadDeviation">
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
            <ng-container *ngTemplateOutlet="pieChart; context: { rows: deviationClassificationPieRows() }"></ng-container>
          </mat-card-content>
        </mat-card>

        <!-- By Status -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { rows: deviationStatusPieRows() }"></ng-container>
          </mat-card-content>
        </mat-card>

        <!-- By Category -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Category</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { rows: deviationCategoryPieRows() }"></ng-container>
          </mat-card-content>
        </mat-card>

        <!-- By Department -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>By Department</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { rows: deviationDepartmentPieRows() }"></ng-container>
          </mat-card-content>
        </mat-card>

        <!-- Monthly Trend -->
        <mat-card class="chart-card wide">
          <mat-card-header>
            <mat-card-title>Monthly Trend</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { rows: deviationTrendPieRows() }"></ng-container>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #pieChart let-rows="rows">
        <ng-container *ngIf="toPieSlices(rows) as slices">
          <div class="pie-layout" *ngIf="slices.length; else noChartData">
            <div class="pie-wrap">
              <svg class="pie-chart" viewBox="0 0 220 220" role="img" aria-label="Dashboard pie chart">
                <path
                  *ngFor="let slice of slices; trackBy: trackSlice"
                  class="pie-slice"
                  [attr.d]="slice.path"
                  [attr.fill]="slice.color">
                </path>
                <text
                  *ngFor="let slice of slices; trackBy: trackSlice"
                  class="slice-number"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  [attr.x]="slice.labelX"
                  [attr.y]="slice.labelY">
                  {{ slice.value }}
                </text>
              </svg>
              <div class="pie-total">
                <strong>{{ totalPieValue(rows) }}</strong>
                <span>Total</span>
              </div>
            </div>
            <div class="pie-legend">
              <div class="pie-legend-item" *ngFor="let slice of slices; trackBy: trackSlice">
                <span class="pie-dot" [style.background]="slice.color"></span>
                <span class="pie-name">{{ slice.label }}</span>
                <strong>{{ slice.value }}</strong>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-template>

      <ng-template #noChartData>
        <div class="no-chart-data">No chart data available</div>
      </ng-template>
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
      grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }

    .metric-card {
      position: relative;
      display: grid;
      place-items: center;
      padding: 8px 8px 7px;
      min-height: 58px;
    }

    .metric-icon-wrapper {
      position: absolute;
      top: 7px;
      left: 7px;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon-wrapper mat-icon { font-size: 17px; width: 17px; height: 17px; }

    .metric-icon-wrapper.open { background: rgba(237,139,0,0.12); color: #ED8B00; }
    .metric-icon-wrapper.critical-bg { background: #ffebee; color: #c62828; }
    .metric-icon-wrapper.overdue { background: #fce4ec; color: #c62828; }
    .metric-icon-wrapper.reported { background: rgba(44,95,124,0.1); color: #2C5F7C; }
    .metric-icon-wrapper.closed { background: #e8f5e9; color: #388e3c; }
    .metric-icon-wrapper.capa-rate { background: rgba(44,95,124,0.1); color: #2C5F7C; }

    .metric-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      text-align: center;
      width: 100%;
      min-width: 0;
      padding: 0 18px;
    }
    .metric-value { font-size: 16px; line-height: 1; font-weight: 700; color: #333; }
    .metric-label { font-size: 10px; line-height: 1.15; color: #666; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card { padding: 8px; }
    .chart-card.wide { grid-column: auto; }

    .pie-layout {
      display: grid;
      grid-template-columns: 170px minmax(0, 1fr);
      align-items: center;
      gap: 14px;
      min-height: 196px;
      padding: 8px 0;
    }

    .pie-wrap {
      position: relative;
      width: 170px;
      height: 170px;
      justify-self: center;
    }

    .pie-chart {
      width: 170px;
      height: 170px;
      display: block;
      overflow: visible;
    }

    .pie-slice {
      stroke: #fff;
      stroke-width: 2.5;
      filter: drop-shadow(0 2px 3px rgba(15, 23, 42, 0.14));
    }

    .slice-number {
      fill: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0;
      paint-order: stroke;
      stroke: rgba(15, 23, 42, 0.42);
      stroke-width: 3px;
    }

    .pie-total {
      position: absolute;
      inset: 50% auto auto 50%;
      transform: translate(-50%, -50%);
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: #fff;
      border: 1px solid #d8dee8;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
      display: grid;
      place-items: center;
      align-content: center;
      pointer-events: none;
    }

    .pie-total strong { font-size: 18px; line-height: 1; color: #2C5F7C; }
    .pie-total span { font-size: 10px; color: #64748b; margin-top: 3px; }

    .pie-legend {
      display: grid;
      gap: 8px;
      align-content: center;
      min-width: 0;
    }

    .pie-legend-item {
      display: grid;
      grid-template-columns: 10px minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #475569;
      min-width: 0;
    }

    .pie-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .pie-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-chart-data {
      min-height: 180px;
      display: grid;
      place-items: center;
      color: #64748b;
      font-size: 13px;
      background: #f8fafc;
      border-radius: 6px;
    }

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
      background: var(--qms-button-primary, #ED8B00) !important;
      border-color: var(--qms-button-primary, #ED8B00) !important;
      color: #fff !important;
      --mdc-outlined-button-label-text-color: #fff;
      --mdc-outlined-button-outline-color: var(--qms-button-primary, #ED8B00);
      --mdc-outlined-button-disabled-label-text-color: #64748b;
      --mdc-outlined-button-disabled-outline-color: #cbd5e1;
    }
    .action-btn mat-icon { color: #fff; }
    .action-btn:hover:not(:disabled) {
      background: var(--qms-button-primary-hover, #D4760A) !important;
      border-color: var(--qms-button-primary-hover, #D4760A) !important;
      color: #fff !important;
    }
    .action-btn:disabled {
      background: #cbd5e1 !important;
      border-color: #cbd5e1 !important;
      color: #64748b !important;
      cursor: default;
    }
    .action-btn:disabled mat-icon { color: #64748b; }
    .vault-create-btn:disabled { background: #cbd5e1; color: #64748b; cursor: default; }

    @media (max-width: 1180px) {
      .dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 768px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; }
      .pie-layout { grid-template-columns: 1fr; justify-items: center; }
      .pie-legend { width: 100%; }
    }
  `],
})
export class DeviationDashboardComponent implements OnInit {
  metrics: DeviationDashboardMetrics | null = null;
  canReadDeviation = hasStoredPermission('DEVIATION', 'READ', 'deviation_record');
  canCreateDeviation = hasStoredPermission('DEVIATION', 'CREATE', 'deviation_record');
  private readonly pieColors = ['#2C5F7C', '#ED8B00', '#388E3C', '#7B1FA2', '#C62828', '#00897B', '#5C6BC0', '#6D4C41'];

  constructor(
    private deviationService: DeviationService,
    private snackBar: MatSnackBar
  ) {}

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

  deviationClassificationPieRows(): PieRow[] {
    return (this.metrics?.byClassification || []).map((item) => ({
      label: this.formatStatus(item.classification),
      value: item.count,
    }));
  }

  deviationStatusPieRows(): PieRow[] {
    return (this.metrics?.byStatus || []).map((item) => ({
      label: this.formatStatus(item.status),
      value: item.count,
    }));
  }

  deviationCategoryPieRows(): PieRow[] {
    return (this.metrics?.byCategory || []).map((item) => ({
      label: this.formatCategory(item.category),
      value: item.count,
    }));
  }

  deviationDepartmentPieRows(): PieRow[] {
    return (this.metrics?.byDepartment || []).map((item) => ({
      label: item.department,
      value: item.count,
    }));
  }

  deviationTrendPieRows(): PieRow[] {
    const trendData = this.metrics?.trendData || [];
    return [
      { label: 'Reported', value: trendData.reduce((sum, item) => sum + item.reported, 0) },
      { label: 'Closed', value: trendData.reduce((sum, item) => sum + item.closed, 0) },
    ];
  }

  totalPieValue(rows: PieRow[]): number {
    return rows.reduce((sum, row) => sum + row.value, 0);
  }

  toPieSlices(rows: PieRow[]): PieSlice[] {
    const filteredRows = rows.filter((row) => row.value > 0);
    const total = this.totalPieValue(filteredRows);
    let currentAngle = 0;

    if (!total) return [];

    return filteredRows.map((row, index) => {
      const sweep = row.value === total ? 359.99 : (row.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      const midAngle = startAngle + sweep / 2;
      currentAngle = endAngle;

      return {
        ...row,
        color: this.pieColors[index % this.pieColors.length],
        path: this.describeSlice(110, 110, 96, startAngle, endAngle),
        labelX: this.polarToCartesian(110, 110, 58, midAngle).x,
        labelY: this.polarToCartesian(110, 110, 58, midAngle).y,
      };
    });
  }

  trackSlice(_: number, slice: PieSlice): string {
    return slice.label;
  }

  downloadTrendReport(): void {
    if (!this.metrics) return;
    this.downloadFile(
      'deviation-trend-analysis-report',
      'json',
      JSON.stringify({
        reportTitle: 'Deviation Trend Analysis Report',
        generatedAt: new Date().toISOString(),
        metrics: this.metrics,
      }, null, 2),
      'application/json'
    );
  }

  exportRegister(): void {
    this.deviationService.getDeviations().subscribe({
      next: (rows) => {
        this.downloadFile('deviation-register-export', 'csv', this.toCsv(rows.map((row) => ({
          deviationNumber: row.deviationNumber,
          title: row.title,
          type: row.type,
          classification: row.classification,
          status: row.status,
          category: row.category,
          department: row.department,
          reportedDate: this.formatDate(row.reportedDate),
          targetClosureDate: this.formatDate(row.targetClosureDate),
          assignedTo: row.assignedToName,
          capaRequired: row.capaRequired,
        }))), 'text/csv');
      },
      error: () => this.snackBar.open('Unable to export deviation register', 'Dismiss', { duration: 4000 }),
    });
  }

  private toCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const lines = rows.map((row) => headers.map((header) => this.csvEscape(row[header])).join(','));
    return [headers.join(','), ...lines].join('\n');
  }

  private csvEscape(value: unknown): string {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private formatDate(value?: Date): string {
    return value ? new Date(value).toISOString().slice(0, 10) : '';
  }

  private downloadFile(fileName: string, extension: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private describeSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
    const start = this.polarToCartesian(cx, cy, radius, endAngle);
    const end = this.polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  }

  private polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  }
}
