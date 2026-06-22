import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const API_BASE_URL = 'http://localhost:8082/api/v1';

interface DashboardResponse {
  openCapas: number;
  openDeviations: number;
  openChangeRequests: number;
  overdueCapas: number;
  overdueDeviations: number;
  overdueChangeRequests: number;
  pendingReviews: number;
  capasByStatus: Record<string, number>;
  deviationsByStatus: Record<string, number>;
  changeRequestsByStatus: Record<string, number>;
}

interface StatusRow {
  label: string;
  count: number;
  module: 'capa' | 'dev' | 'cc';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dash">
      <div class="error-banner" *ngIf="loadError">
        <mat-icon>error</mat-icon>
        <span>{{ loadError }}</span>
      </div>

      <div class="kpi-strip">
        <div class="kpi" routerLink="/capa">
          <div class="kpi-val">{{ dashboard?.openCapas ?? 0 }}</div>
          <div class="kpi-lbl">Open CAPAs</div>
          <div class="kpi-bar capa"></div>
        </div>
        <div class="kpi">
          <div class="kpi-val warn">{{ totalOverdue }}</div>
          <div class="kpi-lbl">Overdue</div>
          <div class="kpi-bar overdue"></div>
        </div>
        <div class="kpi" routerLink="/deviations">
          <div class="kpi-val">{{ dashboard?.openDeviations ?? 0 }}</div>
          <div class="kpi-lbl">Open Deviations</div>
          <div class="kpi-bar dev"></div>
        </div>
        <div class="kpi" routerLink="/change-control">
          <div class="kpi-val">{{ dashboard?.openChangeRequests ?? 0 }}</div>
          <div class="kpi-lbl">Active Changes</div>
          <div class="kpi-bar cc"></div>
        </div>
        <div class="kpi">
          <div class="kpi-val">{{ dashboard?.pendingReviews ?? 0 }}</div>
          <div class="kpi-lbl">Pending Reviews</div>
          <div class="kpi-bar review"></div>
        </div>
        <div class="kpi">
          <div class="kpi-val ok">{{ totalOpen }}</div>
          <div class="kpi-lbl">Total Open</div>
          <div class="kpi-bar closed"></div>
        </div>
      </div>

      <div class="panels">
        <div class="panel modules-panel">
          <div class="panel-head">
            <mat-icon>apps</mat-icon>
            <span>Quality Modules</span>
          </div>
          <div class="module-list">
            <a class="mod-item" routerLink="/capa">
              <div class="mod-icon capa"><mat-icon>assignment_turned_in</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">CAPA Management</span>
                <span class="mod-desc">Corrective & Preventive Actions</span>
              </div>
              <div class="mod-count">{{ dashboard?.openCapas ?? 0 }} open</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <a class="mod-item" routerLink="/deviations">
              <div class="mod-icon dev"><mat-icon>report_problem</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Deviation Management</span>
                <span class="mod-desc">Track deviations from processes</span>
              </div>
              <div class="mod-count">{{ dashboard?.openDeviations ?? 0 }} open</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <a class="mod-item" routerLink="/change-control">
              <div class="mod-icon cc"><mat-icon>swap_horiz</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Change Control</span>
                <span class="mod-desc">Manage system & process changes</span>
              </div>
              <div class="mod-count">{{ dashboard?.openChangeRequests ?? 0 }} active</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <a class="mod-item" routerLink="/documents">
              <div class="mod-icon doc"><mat-icon>description</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Document Control</span>
                <span class="mod-desc">SOPs & controlled documents</span>
              </div>
              <div class="mod-count">Manage</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <a class="mod-item" routerLink="/training">
              <div class="mod-icon trn"><mat-icon>school</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Training Management</span>
                <span class="mod-desc">Track training & compliance</span>
              </div>
              <div class="mod-count">Manage</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
          </div>
        </div>

        <div class="panel queue-panel">
          <div class="panel-head">
            <mat-icon>priority_high</mat-icon>
            <span>Overdue Queue</span>
            <span class="head-badge">{{ totalOverdue }}</span>
          </div>
          <div class="task-list">
            <a class="task-row" routerLink="/capa/list">
              <mat-icon class="task-icon urgent">assignment_late</mat-icon>
              <div class="task-info">
                <span class="task-title">{{ dashboard?.overdueCapas ?? 0 }} overdue CAPAs</span>
                <span class="task-meta">From backend CAPA due-date metrics</span>
              </div>
            </a>
            <a class="task-row" routerLink="/deviations/list">
              <mat-icon class="task-icon pending">report_problem</mat-icon>
              <div class="task-info">
                <span class="task-title">{{ dashboard?.overdueDeviations ?? 0 }} overdue deviations</span>
                <span class="task-meta">From backend deviation closure metrics</span>
              </div>
            </a>
            <a class="task-row" routerLink="/change-control/list">
              <mat-icon class="task-icon info">swap_horiz</mat-icon>
              <div class="task-info">
                <span class="task-title">{{ dashboard?.overdueChangeRequests ?? 0 }} overdue change requests</span>
                <span class="task-meta">From backend implementation target metrics</span>
              </div>
            </a>
          </div>
        </div>

        <div class="panel activity-panel">
          <div class="panel-head">
            <mat-icon>query_stats</mat-icon>
            <span>Status Distribution</span>
          </div>
          <div class="activity-list">
            <div class="empty-state" *ngIf="statusRows.length === 0 && !isLoading">No open quality records</div>
            <div class="activity-row" *ngFor="let item of statusRows">
              <div class="act-module">{{ moduleLabel(item.module) }}</div>
              <div class="act-dot" [ngClass]="item.module"></div>
              <div class="act-text"><strong>{{ item.count }}</strong> {{ formatStatus(item.label) }}</div>
            </div>
          </div>
        </div>

        <div class="panel quick-panel">
          <div class="panel-head">
            <mat-icon>bolt</mat-icon>
            <span>Quick Actions</span>
          </div>
          <div class="quick-grid">
            <button class="qa-btn" routerLink="/capa/create">
              <mat-icon>add_circle</mat-icon>
              <span>New CAPA</span>
            </button>
            <button class="qa-btn" routerLink="/deviations/create">
              <mat-icon>add_circle</mat-icon>
              <span>New Deviation</span>
            </button>
            <button class="qa-btn" routerLink="/change-control/create">
              <mat-icon>add_circle</mat-icon>
              <span>New Change Request</span>
            </button>
            <button class="qa-btn" routerLink="/capa/list">
              <mat-icon>assignment_turned_in</mat-icon>
              <span>CAPA Register</span>
            </button>
            <button class="qa-btn" routerLink="/deviations/list">
              <mat-icon>report_problem</mat-icon>
              <span>Deviation Register</span>
            </button>
            <button class="qa-btn" routerLink="/change-control/list">
              <mat-icon>swap_horiz</mat-icon>
              <span>Change Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1400px; margin: 0 auto; }
    .error-banner {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
      background: #ffebee; color: #b42318; border: 1px solid #ffcdd2;
      padding: 10px 12px; border-radius: 6px; font-size: 13px;
    }
    .error-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .kpi-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 12px 14px; cursor: pointer; position: relative; overflow: hidden;
    }
    .kpi:hover { border-color: #2C5F7C; }
    .kpi-val { font-size: 26px; font-weight: 700; color: #1B3A4B; }
    .kpi-val.warn { color: #c62828; }
    .kpi-val.ok { color: #2e7d32; }
    .kpi-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    .kpi-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
    .kpi-bar.capa { background: #2C5F7C; }
    .kpi-bar.overdue { background: #c62828; }
    .kpi-bar.dev { background: #ED8B00; }
    .kpi-bar.cc { background: #1B3A4B; }
    .kpi-bar.review { background: #7b1fa2; }
    .kpi-bar.closed { background: #388e3c; }
    .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .panel {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .panel-head {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px; font-size: 12px; font-weight: 600; color: #1B3A4B;
      border-bottom: 1px solid #eee; background: #fafbfc;
    }
    .panel-head mat-icon { font-size: 16px; width: 16px; height: 16px; color: #2C5F7C; }
    .head-badge {
      background: #ED8B00; color: #fff; font-size: 10px; font-weight: 700;
      padding: 1px 7px; border-radius: 10px; margin-left: auto;
    }
    .module-list, .task-list, .activity-list { display: flex; flex-direction: column; }
    .mod-item, .task-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      border-bottom: 1px solid #f5f5f5; cursor: pointer; text-decoration: none; color: inherit;
    }
    .mod-item:last-child, .task-row:last-child { border-bottom: none; }
    .mod-item:not(.disabled):hover, .task-row:hover { background: #f8f9fb; }
    .mod-item.disabled { opacity: 0.45; cursor: default; }
    .mod-icon {
      width: 32px; height: 32px; border-radius: 6px; display: flex;
      align-items: center; justify-content: center;
    }
    .mod-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    .mod-icon.capa { background: #2C5F7C; }
    .mod-icon.dev { background: #ED8B00; }
    .mod-icon.cc { background: #1B3A4B; }
    .mod-icon.doc { background: #5c6bc0; }
    .mod-icon.trn { background: #00897b; }
    .mod-info, .task-info { flex: 1; display: flex; flex-direction: column; }
    .mod-name, .task-title { font-size: 13px; font-weight: 600; color: #333; }
    .mod-desc, .task-meta { font-size: 11px; color: #888; }
    .mod-count { font-size: 11px; font-weight: 600; color: #2C5F7C; }
    .mod-arrow { font-size: 16px; width: 16px; height: 16px; color: #ccc; }
    .mod-soon { font-size: 10px; color: #aaa; font-style: italic; }
    .task-icon { font-size: 18px; width: 18px; height: 18px; }
    .task-icon.urgent { color: #c62828; }
    .task-icon.pending { color: #ED8B00; }
    .task-icon.info { color: #2C5F7C; }
    .activity-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-bottom: 1px solid #f5f5f5;
    }
    .activity-row:last-child { border-bottom: none; }
    .act-module { font-size: 10px; color: #777; min-width: 42px; font-weight: 700; }
    .act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .act-dot.capa { background: #2C5F7C; }
    .act-dot.dev { background: #ED8B00; }
    .act-dot.cc { background: #1B3A4B; }
    .act-text { font-size: 12px; color: #555; }
    .act-text strong { color: #333; }
    .empty-state { padding: 18px 14px; color: #888; font-size: 12px; }
    .quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; }
    .qa-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 14px 8px; cursor: pointer; color: #2C5F7C;
    }
    .qa-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .qa-btn span { font-size: 11px; font-weight: 500; }
    .qa-btn:hover { background: #ED8B00; color: #fff; border-color: #ED8B00; }
    @media (max-width: 900px) {
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
      .panels { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardResponse | null = null;
  statusRows: StatusRow[] = [];
  isLoading = false;
  loadError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get totalOverdue(): number {
    return (this.dashboard?.overdueCapas ?? 0)
      + (this.dashboard?.overdueDeviations ?? 0)
      + (this.dashboard?.overdueChangeRequests ?? 0);
  }

  get totalOpen(): number {
    return (this.dashboard?.openCapas ?? 0)
      + (this.dashboard?.openDeviations ?? 0)
      + (this.dashboard?.openChangeRequests ?? 0);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  moduleLabel(module: StatusRow['module']): string {
    if (module === 'capa') return 'CAPA';
    if (module === 'dev') return 'DEV';
    return 'CC';
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.loadError = '';

    this.http.get<DashboardResponse>(`${API_BASE_URL}/dashboard/overview`).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.statusRows = [
          ...this.toStatusRows(dashboard.capasByStatus, 'capa'),
          ...this.toStatusRows(dashboard.deviationsByStatus, 'dev'),
          ...this.toStatusRows(dashboard.changeRequestsByStatus, 'cc'),
        ].sort((a, b) => b.count - a.count);
        this.isLoading = false;
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.isLoading = false;
          return;
        }

        this.loadError = 'Unable to load dashboard metrics from backend';
        this.isLoading = false;
      },
    });
  }

  private toStatusRows(source: Record<string, number> | undefined, module: StatusRow['module']): StatusRow[] {
    return Object.entries(source || {}).map(([label, count]) => ({ label, count, module }));
  }
}
