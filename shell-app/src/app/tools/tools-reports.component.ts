import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import {
  CapaMetrics,
  ChangeControlMetrics,
  DashboardOverview,
  DeviationMetrics,
  ToolsApiService,
} from './tools-api.service';

@Component({
  selector: 'app-tools-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="tools-page">
      <div class="page-title">
        <div>
          <h1>Reports</h1>
          <p>Operational report snapshots generated from backend dashboard APIs.</p>
        </div>
        <button mat-raised-button color="primary" (click)="loadReports()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="report-grid" *ngIf="overview">
        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>Executive Quality Summary</mat-card-title>
            <mat-card-subtitle>GET /api/v1/dashboard/overview</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="kpi-grid">
              <div><strong>{{ overview.openCapas }}</strong><span>Open CAPAs</span></div>
              <div><strong>{{ overview.openDeviations }}</strong><span>Open Deviations</span></div>
              <div><strong>{{ overview.openChangeRequests }}</strong><span>Open Changes</span></div>
              <div><strong>{{ totalOverdue }}</strong><span>Total Overdue</span></div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button (click)="exportJson('executive-quality-summary', overview)">
              <mat-icon>download</mat-icon>
              JSON
            </button>
            <button mat-stroked-button (click)="exportCsv('executive-quality-summary', flattenObject(overview))">
              <mat-icon>table_view</mat-icon>
              CSV
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>CAPA Performance Report</mat-card-title>
            <mat-card-subtitle>GET /api/v1/dashboard/capa-metrics</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="kpi-grid">
              <div><strong>{{ capaMetrics?.totalCapas || 0 }}</strong><span>Total</span></div>
              <div><strong>{{ capaMetrics?.openCapas || 0 }}</strong><span>Open</span></div>
              <div><strong>{{ capaMetrics?.overdueCapas || 0 }}</strong><span>Overdue</span></div>
              <div><strong>{{ capaMetrics?.closedCapas || 0 }}</strong><span>Closed</span></div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button (click)="exportJson('capa-performance-report', capaMetrics)">
              <mat-icon>download</mat-icon>
              JSON
            </button>
            <button mat-stroked-button (click)="exportMetricCsv('capa-performance-report', capaMetrics)">
              <mat-icon>table_view</mat-icon>
              CSV
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>Deviation Trending Report</mat-card-title>
            <mat-card-subtitle>GET /api/v1/dashboard/deviation-metrics</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="kpi-grid">
              <div><strong>{{ deviationMetrics?.totalDeviations || 0 }}</strong><span>Total</span></div>
              <div><strong>{{ deviationMetrics?.openDeviations || 0 }}</strong><span>Open</span></div>
              <div><strong>{{ deviationMetrics?.overdueDeviations || 0 }}</strong><span>Overdue</span></div>
              <div><strong>{{ deviationMetrics?.closedDeviations || 0 }}</strong><span>Closed</span></div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button (click)="exportJson('deviation-trending-report', deviationMetrics)">
              <mat-icon>download</mat-icon>
              JSON
            </button>
            <button mat-stroked-button (click)="exportMetricCsv('deviation-trending-report', deviationMetrics)">
              <mat-icon>table_view</mat-icon>
              CSV
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>Change Control Performance</mat-card-title>
            <mat-card-subtitle>GET /api/v1/dashboard/change-control-metrics</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="kpi-grid">
              <div><strong>{{ changeMetrics?.totalChangeRequests || 0 }}</strong><span>Total</span></div>
              <div><strong>{{ changeMetrics?.openChangeRequests || 0 }}</strong><span>Open</span></div>
              <div><strong>{{ changeMetrics?.overdueChangeRequests || 0 }}</strong><span>Overdue</span></div>
              <div><strong>{{ changeMetrics?.closedChangeRequests || 0 }}</strong><span>Closed</span></div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button (click)="exportJson('change-control-performance', changeMetrics)">
              <mat-icon>download</mat-icon>
              JSON
            </button>
            <button mat-stroked-button (click)="exportMetricCsv('change-control-performance', changeMetrics)">
              <mat-icon>table_view</mat-icon>
              CSV
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .tools-page { max-width: 1440px; margin: 0 auto; }
    .page-title { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 16px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .report-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    mat-card-title { font-size: 16px; color: #1B3A4B; letter-spacing: 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .kpi-grid div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .kpi-grid strong { display: block; color: #1B3A4B; font-size: 24px; line-height: 1; }
    .kpi-grid span { display: block; margin-top: 6px; color: #667085; font-size: 12px; }
    mat-card-actions { padding: 0 16px 16px; display: flex; gap: 8px; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1000px) { .report-grid { grid-template-columns: 1fr; } .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  `],
})
export class ToolsReportsComponent implements OnInit {
  overview: DashboardOverview | null = null;
  capaMetrics: CapaMetrics | null = null;
  deviationMetrics: DeviationMetrics | null = null;
  changeMetrics: ChangeControlMetrics | null = null;
  isLoading = false;

  constructor(private api: ToolsApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadReports();
  }

  get totalOverdue(): number {
    if (!this.overview) return 0;
    return this.overview.overdueCapas + this.overview.overdueDeviations + this.overview.overdueChangeRequests;
  }

  loadReports(): void {
    this.isLoading = true;
    forkJoin({
      overview: this.api.getDashboardOverview(),
      capa: this.api.getCapaMetrics(),
      deviation: this.api.getDeviationMetrics(),
      change: this.api.getChangeControlMetrics(),
    }).subscribe({
      next: ({ overview, capa, deviation, change }) => {
        this.overview = overview;
        this.capaMetrics = capa;
        this.deviationMetrics = deviation;
        this.changeMetrics = change;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load reports', 'Dismiss', { duration: 4000 });
      },
    });
  }

  exportJson(fileName: string, data: unknown): void {
    this.download(fileName, 'json', JSON.stringify(data || {}, null, 2), 'application/json');
  }

  exportCsv(fileName: string, rows: Record<string, unknown>[]): void {
    const headers = Object.keys(rows[0] || {});
    const body = [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n');
    this.download(fileName, 'csv', body, 'text/csv');
  }

  exportMetricCsv(fileName: string, data: unknown): void {
    this.exportCsv(fileName, this.flattenObject(data || {}));
  }

  flattenObject(data: unknown): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
          rows.push({ metric: `${key}.${childKey}`, value: childValue });
        });
      } else {
        rows.push({ metric: key, value });
      }
    });
    return rows;
  }

  private download(fileName: string, extension: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
