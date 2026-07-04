import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupplierService } from '../../services/supplier.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard">
      <div class="header">
        <h1>Supplier Quality Dashboard</h1>
        <div class="actions">
          <button mat-raised-button color="primary" routerLink="../create" [disabled]="!canCreateSupplier"><mat-icon>add</mat-icon> New Supplier</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>list</mat-icon> All Suppliers</button>
        </div>
      </div>
      <div class="kpi-row">
        <mat-card class="kpi"><mat-card-content><div class="val primary">{{ metrics['totalSuppliers'] || 0 }}</div><div class="lbl">Total Suppliers</div></mat-card-content></mat-card>
        <mat-card class="kpi" *ngFor="let s of statusBreakdown">
          <mat-card-content><div class="val" [style.color]="getStatusColor(s[0])">{{ s[1] }}</div><div class="lbl">{{ formatLabel(s[0]) }}</div></mat-card-content>
        </mat-card>
      </div>
      <div class="section-row">
        <mat-card>
          <mat-card-header><mat-card-title>By Type</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="bar-list">
              <div *ngFor="let t of typeBreakdown" class="bar-item">
                <span class="bar-label">{{ formatLabel(t[0]) }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="getPercent(t[1], totalFrom(typeBreakdown))" style="background:#1976d2"></div></div>
                <span class="bar-val">{{ t[1] }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>By Category</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="bar-list">
              <div *ngFor="let c of categoryBreakdown" class="bar-item">
                <span class="bar-label">{{ c[0] | titlecase }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="getPercent(c[1], totalFrom(categoryBreakdown))" [style.background]="getCatColor(c[0])"></div></div>
                <span class="bar-val">{{ c[1] }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard{padding:24px} .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px}
    .header h1{margin:0;font-size:22px} .actions{display:flex;gap:8px}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px}
    .kpi{text-align:center} .val{font-size:36px;font-weight:700} .val.primary{color:#1976d2} .lbl{font-size:13px;color:#666;margin-top:4px}
    .section-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
    .bar-list{padding-top:8px} .bar-item{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .bar-label{width:140px;font-size:13px;text-align:right;flex-shrink:0} .bar-track{flex:1;height:20px;background:#eee;border-radius:4px;overflow:hidden}
    .bar-fill{height:100%;border-radius:4px;transition:width .3s} .bar-val{width:30px;font-size:13px;font-weight:600}
  `],
})
export class SupplierDashboardComponent implements OnInit {
  metrics: Record<string, unknown> = {};
  statusBreakdown: [string, number][] = [];
  typeBreakdown: [string, number][] = [];
  categoryBreakdown: [string, number][] = [];
  canCreateSupplier = hasStoredPermission('SUPPLIER', 'CREATE', 'supplier');

  constructor(private svc: SupplierService) {}

  ngOnInit(): void {
    this.svc.getDashboard().subscribe(m => {
      this.metrics = m;
      this.statusBreakdown = this.toEntries(m['byStatus']);
      this.typeBreakdown = this.toEntries(m['byType']);
      this.categoryBreakdown = this.toEntries(m['byCategory']);
    });
  }

  private toEntries(val: unknown): [string, number][] {
    if (Array.isArray(val)) {
      return val
        .filter((row): row is [string, number] => Array.isArray(row) && row.length >= 2)
        .map((row) => [String(row[0]), Number(row[1])]);
    }
    if (!val || typeof val !== 'object') return [];
    return Object.entries(val as Record<string, number>);
  }

  formatLabel(s: string): string { return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  getPercent(v: number, t: number): number { return t > 0 ? (v / t) * 100 : 0; }
  totalFrom(arr: [string, number][]): number { return arr.reduce((s, e) => s + e[1], 0); }
  getStatusColor(s: string): string {
    const m: Record<string, string> = { QUALIFIED: '#4caf50', APPROVED: '#2e7d32', PENDING_QUALIFICATION: '#ff9800', SUSPENDED: '#f44336', DISQUALIFIED: '#d32f2f', CONDITIONALLY_APPROVED: '#ffc107', INACTIVE: '#9e9e9e' };
    return m[s] || '#1976d2';
  }
  getCatColor(c: string): string {
    return ({ CRITICAL: '#f44336', MAJOR: '#ff9800', MINOR: '#4caf50' } as Record<string, string>)[c] || '#1976d2';
  }
}
