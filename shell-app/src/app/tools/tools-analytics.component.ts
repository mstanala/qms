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

interface ChartRow {
  label: string;
  value: number;
  percent: number;
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
          <mat-card-content><ng-container *ngTemplateOutlet="bars; context: { rows: toRows(capaMetrics?.byPriority) }"></ng-container></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Deviation by Classification</mat-card-title></mat-card-header>
          <mat-card-content><ng-container *ngTemplateOutlet="bars; context: { rows: toRows(deviationMetrics?.byClassification) }"></ng-container></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Change by Classification</mat-card-title></mat-card-header>
          <mat-card-content><ng-container *ngTemplateOutlet="bars; context: { rows: toRows(changeMetrics?.byClassification) }"></ng-container></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Open vs Closed</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="summary-list">
              <div><span>CAPA</span><strong>{{ capaMetrics?.openCapas || 0 }} open / {{ capaMetrics?.closedCapas || 0 }} closed</strong></div>
              <div><span>Deviation</span><strong>{{ deviationMetrics?.openDeviations || 0 }} open / {{ deviationMetrics?.closedDeviations || 0 }} closed</strong></div>
              <div><span>Change Control</span><strong>{{ changeMetrics?.openChangeRequests || 0 }} open / {{ changeMetrics?.closedChangeRequests || 0 }} closed</strong></div>
            </div>
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

      <ng-template #bars let-rows="rows">
        <div class="bars" *ngIf="rows.length; else noData">
          <div class="bar-row" *ngFor="let row of rows">
            <div class="bar-label"><span>{{ formatLabel(row.label) }}</span><strong>{{ row.value }}</strong></div>
            <div class="bar-track"><div class="bar-fill" [style.width.%]="row.percent"></div></div>
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
    .bars { display: grid; gap: 12px; }
    .bar-label { display: flex; justify-content: space-between; color: #344054; font-size: 12px; margin-bottom: 4px; }
    .bar-track { height: 8px; background: #edf2f7; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: #2C5F7C; border-radius: 999px; }
    .summary-list { display: grid; gap: 10px; }
    .summary-list div { display: flex; justify-content: space-between; gap: 12px; padding: 10px; border-radius: 6px; background: #f8fafc; }
    .summary-list span { color: #667085; font-size: 12px; }
    .summary-list strong { color: #1B3A4B; font-size: 13px; }
    .search-form { display: grid; gap: 12px; }
    .record-types { display: flex; flex-wrap: wrap; gap: 16px; }
    .search-actions { display: flex; }
    .search-result { margin-top: 14px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; gap: 8px; align-items: baseline; }
    .search-result strong { color: #1B3A4B; font-size: 22px; }
    .search-result span, .no-data { color: #667085; font-size: 12px; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1000px) { .analytics-grid { grid-template-columns: 1fr; } }
  `],
})
export class ToolsAnalyticsComponent implements OnInit {
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

  toRows(source: Record<string, number> | undefined | null): ChartRow[] {
    const entries = Object.entries(source || {});
    const max = Math.max(...entries.map(([, value]) => value), 1);
    return entries.map(([label, value]) => ({ label, value, percent: Math.max((value / max) * 100, value > 0 ? 6 : 0) }));
  }

  formatLabel(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
