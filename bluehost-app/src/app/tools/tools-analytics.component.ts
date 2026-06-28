import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import {
  CapaMetrics,
  ChangeControlMetrics,
  DeviationMetrics,
  SearchResponse,
  ToolsApiService,
} from './tools-api.service';

interface PieSlice {
  label: string;
  value: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
}

@Component({
  selector: 'app-tools-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="tools-page">
      <div class="page-title">
        <div>
          <h1>Analytics</h1>
          <p>Backend quality metrics and advanced search workspace.</p>
        </div>
        <button mat-raised-button color="primary" (click)="loadAnalytics()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="analytics-grid">
        <mat-card>
          <mat-card-header><mat-card-title>CAPA by Priority</mat-card-title></mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { slices: toPieSlices(capaMetrics?.byPriority), total: totalValue(capaMetrics?.byPriority) }"></ng-container>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Deviation by Classification</mat-card-title></mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { slices: toPieSlices(deviationMetrics?.byClassification), total: totalValue(deviationMetrics?.byClassification) }"></ng-container>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Change by Classification</mat-card-title></mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { slices: toPieSlices(changeMetrics?.byClassification), total: totalValue(changeMetrics?.byClassification) }"></ng-container>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Open vs Closed</mat-card-title></mat-card-header>
          <mat-card-content>
            <ng-container *ngTemplateOutlet="pieChart; context: { slices: toPieSlices(openClosedMetrics()), total: totalValue(openClosedMetrics()) }"></ng-container>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="search-card">
        <mat-card-header>
          <mat-card-title>Advanced Search</mat-card-title>
          <mat-card-subtitle>POST /api/v1/search/advanced</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="searchForm" (ngSubmit)="runAdvancedSearch()" class="search-form">
            <mat-form-field appearance="outline">
              <mat-label>Query</mat-label>
              <input matInput formControlName="query" />
            </mat-form-field>
            <div class="record-types">
              <mat-checkbox [checked]="isTypeSelected('CAPA')" (change)="toggleType('CAPA', $event.checked)">CAPA</mat-checkbox>
              <mat-checkbox [checked]="isTypeSelected('DEVIATION')" (change)="toggleType('DEVIATION', $event.checked)">Deviation</mat-checkbox>
              <mat-checkbox [checked]="isTypeSelected('CHANGE_CONTROL')" (change)="toggleType('CHANGE_CONTROL', $event.checked)">Change Control</mat-checkbox>
            </div>
            <div class="search-actions">
              <button mat-raised-button color="primary" type="submit">
                <mat-icon>search</mat-icon>
                Search
              </button>
            </div>
          </form>
          <div class="search-result" *ngIf="searchResult">
            <strong>{{ searchResult.total || 0 }}</strong>
            <span>results returned from backend search</span>
          </div>
        </mat-card-content>
      </mat-card>

      <ng-template #pieChart let-slices="slices" let-total="total">
        <div class="pie-layout" *ngIf="slices.length; else noData">
          <div class="pie-wrap">
            <svg class="pie-chart" viewBox="0 0 220 220" role="img" aria-label="Analytics pie chart">
              <path *ngFor="let slice of slices; trackBy: trackSlice" class="pie-slice" [attr.d]="slice.path" [attr.fill]="slice.color"></path>
              <text
                *ngFor="let slice of slices; trackBy: trackSlice"
                class="slice-number"
                [attr.x]="slice.labelX"
                [attr.y]="slice.labelY"
                text-anchor="middle"
                dominant-baseline="central">{{ slice.value }}</text>
            </svg>
            <div class="pie-total">
              <span>Total</span>
              <strong>{{ total }}</strong>
            </div>
          </div>
          <div class="pie-legend">
            <div class="legend-row" *ngFor="let slice of slices; trackBy: trackSlice">
              <span class="legend-color" [style.background]="slice.color"></span>
              <span class="legend-label">{{ formatLabel(slice.label) }}</span>
              <strong>{{ slice.value }}</strong>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template #noData><div class="no-data">No metric data available</div></ng-template>
    </section>
  `,
  styles: [`
    .tools-page { max-width: 1440px; margin: 0 auto; }
    .page-title { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 16px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .analytics-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 14px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    mat-card-title { font-size: 16px; color: #1B3A4B; letter-spacing: 0; }
    .pie-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: center; gap: 18px; min-height: 236px; }
    .pie-wrap { position: relative; width: 220px; height: 220px; }
    .pie-chart { width: 220px; height: 220px; display: block; overflow: visible; }
    .pie-slice { stroke: #fff; stroke-width: 2.5; filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.08)); }
    .slice-number {
      fill: #fff; font-size: 13px; font-weight: 700; paint-order: stroke;
      stroke: rgba(15, 23, 42, 0.42); stroke-width: 3px; letter-spacing: 0;
    }
    .pie-total {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      display: grid; place-items: center; width: 74px; height: 74px; border-radius: 50%;
      background: #fff; border: 1px solid #d8dee8; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
      pointer-events: none;
    }
    .pie-total span { color: #667085; font-size: 10px; text-transform: uppercase; letter-spacing: 0; }
    .pie-total strong { color: #1B3A4B; font-size: 20px; line-height: 1; }
    .pie-legend { display: grid; gap: 8px; align-content: center; }
    .legend-row {
      display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; align-items: center; gap: 8px;
      padding: 8px 10px; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 6px;
      color: #344054; font-size: 12px;
    }
    .legend-color { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(15, 23, 42, 0.08); }
    .legend-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .legend-row strong { color: #1B3A4B; font-size: 13px; }
    .search-form { display: grid; gap: 12px; }
    .record-types { display: flex; flex-wrap: wrap; gap: 16px; }
    .search-actions { display: flex; }
    .search-result { margin-top: 14px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; gap: 8px; align-items: baseline; }
    .search-result strong { color: #1B3A4B; font-size: 22px; }
    .search-result span, .no-data { color: #667085; font-size: 12px; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1000px) { .analytics-grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) {
      .pie-layout { grid-template-columns: 1fr; justify-items: center; }
      .pie-legend { width: 100%; }
    }
  `],
})
export class ToolsAnalyticsComponent implements OnInit {
  private readonly pieColors = ['#2C5F7C', '#ED8B00', '#388E3C', '#7B1FA2', '#C62828', '#00897B', '#5C6BC0', '#6D4C41'];

  capaMetrics: CapaMetrics | null = null;
  deviationMetrics: DeviationMetrics | null = null;
  changeMetrics: ChangeControlMetrics | null = null;
  searchResult: SearchResponse | null = null;
  isLoading = false;

  searchForm = this.fb.group({
    query: [''],
    recordTypes: [['CAPA', 'DEVIATION', 'CHANGE_CONTROL'] as string[]],
  });

  constructor(
    private fb: FormBuilder,
    private api: ToolsApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    forkJoin({
      capa: this.api.getCapaMetrics(),
      deviation: this.api.getDeviationMetrics(),
      change: this.api.getChangeControlMetrics(),
    }).subscribe({
      next: ({ capa, deviation, change }) => {
        this.capaMetrics = capa;
        this.deviationMetrics = deviation;
        this.changeMetrics = change;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load analytics', 'Dismiss', { duration: 4000 });
      },
    });
  }

  runAdvancedSearch(): void {
    const raw = this.searchForm.getRawValue();
    this.api.advancedSearch({
      query: raw.query || '',
      recordTypes: raw.recordTypes || [],
      page: 0,
      size: 20,
    }).subscribe({
      next: (result) => this.searchResult = result,
      error: () => this.snackBar.open('Unable to run advanced search', 'Dismiss', { duration: 4000 }),
    });
  }

  isTypeSelected(type: string): boolean {
    return (this.searchForm.value.recordTypes || []).includes(type);
  }

  toggleType(type: string, checked: boolean): void {
    const current = this.searchForm.value.recordTypes || [];
    const next = checked ? Array.from(new Set([...current, type])) : current.filter((item) => item !== type);
    this.searchForm.patchValue({ recordTypes: next });
  }

  toPieSlices(source: Record<string, number> | undefined | null): PieSlice[] {
    const entries = Object.entries(source || {}).filter(([, value]) => value > 0);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (!total) return [];

    let currentAngle = -90;
    return entries.map(([label, value], index) => {
      const span = (value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + (span >= 360 ? 359.99 : span);
      const midAngle = startAngle + span / 2;
      currentAngle += span;
      return {
        label,
        value,
        color: this.pieColors[index % this.pieColors.length],
        path: this.describeSlice(110, 110, 96, startAngle, endAngle),
        labelX: this.polarToCartesian(110, 110, 58, midAngle).x,
        labelY: this.polarToCartesian(110, 110, 58, midAngle).y,
      };
    });
  }

  openClosedMetrics(): Record<string, number> {
    return {
      'CAPA Open': this.capaMetrics?.openCapas || 0,
      'CAPA Closed': this.capaMetrics?.closedCapas || 0,
      'Deviation Open': this.deviationMetrics?.openDeviations || 0,
      'Deviation Closed': this.deviationMetrics?.closedDeviations || 0,
      'Change Open': this.changeMetrics?.openChangeRequests || 0,
      'Change Closed': this.changeMetrics?.closedChangeRequests || 0,
    };
  }

  totalValue(source: Record<string, number> | undefined | null): number {
    return Object.values(source || {}).reduce((sum, value) => sum + value, 0);
  }

  trackSlice(_: number, slice: PieSlice): string {
    return slice.label;
  }

  formatLabel(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private describeSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
    const start = this.polarToCartesian(cx, cy, radius, startAngle);
    const end = this.polarToCartesian(cx, cy, radius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  }

  private polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = angleInDegrees * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  }
}
