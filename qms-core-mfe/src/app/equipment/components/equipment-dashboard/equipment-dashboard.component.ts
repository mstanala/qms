import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EquipmentService } from '../../services/equipment.service';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'qms-equipment-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Equipment & Calibration Dashboard</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="../create" [disabled]="!canCreateEquipment"><mat-icon>add</mat-icon> New Equipment</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>list</mat-icon> All Equipment</button>
        </div>
      </div>
      <div class="kpi-cards">
        <mat-card class="kpi-card"><mat-card-content><div class="kpi-value">{{ metric('totalEquipment') }}</div><div class="kpi-label">Total Equipment</div></mat-card-content></mat-card>
        <mat-card class="kpi-card"><mat-card-content><div class="kpi-value">{{ statusCount('ACTIVE') }}</div><div class="kpi-label">Active</div></mat-card-content></mat-card>
        <mat-card class="kpi-card warning"><mat-card-content><div class="kpi-value">{{ metric('calibrationOverdue') }}</div><div class="kpi-label">Calibration Overdue</div></mat-card-content></mat-card>
        <mat-card class="kpi-card"><mat-card-content><div class="kpi-value">{{ calibrationStatus('SCHEDULED') }}</div><div class="kpi-label">Scheduled Calibrations</div></mat-card-content></mat-card>
      </div>
    </div>
  `,
  styles: [`.dashboard-container{padding:24px}.dashboard-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;gap:12px;flex-wrap:wrap}.dashboard-header h1{margin:0;font-size:24px}.header-actions{display:flex;gap:12px}.kpi-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}.kpi-card{text-align:center}.kpi-card.warning{border-left:4px solid #f44336}.kpi-value{font-size:36px;font-weight:700;color:#1976d2}.kpi-card.warning .kpi-value{color:#f44336}.kpi-label{font-size:14px;color:#666;margin-top:4px}`],
})
export class EquipmentDashboardComponent implements OnInit {
  metrics: Record<string, unknown> = {};
  canCreateEquipment = hasStoredPermission('EQUIPMENT', 'CREATE', 'equipment');

  constructor(private equipmentService: EquipmentService) {}

  ngOnInit(): void {
    this.equipmentService.getDashboard().subscribe((metrics) => this.metrics = metrics);
  }

  metric(key: string): number {
    return Number(this.metrics[key] ?? 0);
  }

  statusCount(status: string): number {
    return this.groupCount('byStatus', status);
  }

  calibrationStatus(status: string): number {
    return this.groupCount('calibrationsByStatus', status);
  }

  private groupCount(group: string, key: string): number {
    const rows = this.metrics[group] as Array<Record<string, unknown> | unknown[]> | undefined;
    const match = rows?.find((row) => Array.isArray(row) ? row[0] === key : row['status'] === key || row['key'] === key);
    if (Array.isArray(match)) return Number(match[1] ?? 0);
    return Number(match?.['count'] ?? 0);
  }
}
