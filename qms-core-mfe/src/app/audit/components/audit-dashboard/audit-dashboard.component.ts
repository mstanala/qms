import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditService } from '../../services/audit.service';

@Component({
  selector: 'qms-audit-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Audit Management Dashboard</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="../list">
            <mat-icon>list</mat-icon> View Audits
          </button>
          <button mat-stroked-button routerLink="../plans">
            <mat-icon>event_note</mat-icon> Audit Plans
          </button>
        </div>
      </div>

      <div class="kpi-cards">
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['totalAudits'] || 0 }}</div>
            <div class="kpi-label">Total Audits</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['totalPlans'] || 0 }}</div>
            <div class="kpi-label">Audit Plans</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['totalFindings'] || 0 }}</div>
            <div class="kpi-label">Total Findings</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card warning">
          <mat-card-content>
            <div class="kpi-value">{{ metrics?.['overdueAudits'] || 0 }}</div>
            <div class="kpi-label">Overdue</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dashboard-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Audits by Status</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="status-list">
              <div class="status-item" *ngFor="let item of statusData">
                <span>{{ item[0] }}</span><span class="count">{{ item[1] }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Audits by Type</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="status-list">
              <div class="status-item" *ngFor="let item of typeData">
                <span>{{ item[0] }}</span><span class="count">{{ item[1] }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .dashboard-header h1 { margin: 0; font-size: 24px; }
    .header-actions { display: flex; gap: 12px; }
    .kpi-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { text-align: center; }
    .kpi-card.warning { border-left: 4px solid #f44336; }
    .kpi-value { font-size: 36px; font-weight: 700; color: #1976d2; }
    .kpi-card.warning .kpi-value { color: #f44336; }
    .kpi-label { font-size: 14px; color: #666; margin-top: 4px; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .status-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .status-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #f9f9f9; border-radius: 4px; }
    .count { font-weight: 600; color: #1976d2; }
  `],
})
export class AuditDashboardComponent implements OnInit {
  metrics: Record<string, unknown> | null = null;
  statusData: [string, number][] = [];
  typeData: [string, number][] = [];

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.auditService.getDashboard().subscribe((data) => {
      this.metrics = data;
      this.statusData = (data['byStatus'] as [string, number][]) || [];
      this.typeData = (data['byType'] as [string, number][]) || [];
    });
  }
}
