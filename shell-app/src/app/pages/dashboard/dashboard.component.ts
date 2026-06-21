import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dash">
      <!-- KPI Strip -->
      <div class="kpi-strip">
        <div class="kpi" routerLink="/capa">
          <div class="kpi-val">5</div>
          <div class="kpi-lbl">Open CAPAs</div>
          <div class="kpi-bar capa"></div>
        </div>
        <div class="kpi">
          <div class="kpi-val warn">2</div>
          <div class="kpi-lbl">Overdue</div>
          <div class="kpi-bar overdue"></div>
        </div>
        <div class="kpi" routerLink="/deviations">
          <div class="kpi-val">5</div>
          <div class="kpi-lbl">Open Deviations</div>
          <div class="kpi-bar dev"></div>
        </div>
        <div class="kpi" routerLink="/change-control">
          <div class="kpi-val">4</div>
          <div class="kpi-lbl">Active Changes</div>
          <div class="kpi-bar cc"></div>
        </div>
        <div class="kpi">
          <div class="kpi-val">3</div>
          <div class="kpi-lbl">Pending Reviews</div>
          <div class="kpi-bar review"></div>
        </div>
        <div class="kpi">
          <div class="kpi-val ok">2</div>
          <div class="kpi-lbl">Closed (Month)</div>
          <div class="kpi-bar closed"></div>
        </div>
      </div>

      <!-- Main Panel Grid -->
      <div class="panels">
        <!-- Module Launcher -->
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
              <div class="mod-count">5 open</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <a class="mod-item" routerLink="/deviations">
              <div class="mod-icon dev"><mat-icon>report_problem</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Deviation Management</span>
                <span class="mod-desc">Track deviations from processes</span>
              </div>
              <div class="mod-count">5 open</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <a class="mod-item" routerLink="/change-control">
              <div class="mod-icon cc"><mat-icon>swap_horiz</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Change Control</span>
                <span class="mod-desc">Manage system & process changes</span>
              </div>
              <div class="mod-count">4 active</div>
              <mat-icon class="mod-arrow">chevron_right</mat-icon>
            </a>
            <div class="mod-item disabled">
              <div class="mod-icon doc"><mat-icon>description</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Document Control</span>
                <span class="mod-desc">SOPs & controlled documents</span>
              </div>
              <span class="mod-soon">Phase 2</span>
            </div>
            <div class="mod-item disabled">
              <div class="mod-icon trn"><mat-icon>school</mat-icon></div>
              <div class="mod-info">
                <span class="mod-name">Training Management</span>
                <span class="mod-desc">Track training & compliance</span>
              </div>
              <span class="mod-soon">Phase 2</span>
            </div>
          </div>
        </div>

        <!-- My Tasks -->
        <div class="panel tasks-panel">
          <div class="panel-head">
            <mat-icon>task_alt</mat-icon>
            <span>My Tasks</span>
            <span class="head-badge">4</span>
          </div>
          <div class="task-list">
            <div class="task-row">
              <mat-icon class="task-icon urgent">error</mat-icon>
              <div class="task-info">
                <span class="task-title">Review CAPA-2025-001 root cause</span>
                <span class="task-meta">CAPA · High Priority · Investigation</span>
              </div>
            </div>
            <div class="task-row">
              <mat-icon class="task-icon pending">pending</mat-icon>
              <div class="task-info">
                <span class="task-title">Approve DEV-2025-023 investigation</span>
                <span class="task-meta">Deviation · Critical · Investigation</span>
              </div>
            </div>
            <div class="task-row">
              <mat-icon class="task-icon pending">pending</mat-icon>
              <div class="task-info">
                <span class="task-title">Impact assessment for CC-2025-018</span>
                <span class="task-meta">Change Control · Implementation</span>
              </div>
            </div>
            <div class="task-row">
              <mat-icon class="task-icon pending">pending</mat-icon>
              <div class="task-info">
                <span class="task-title">Effectiveness check CAPA-2025-004</span>
                <span class="task-meta">CAPA · Effectiveness Check</span>
              </div>
            </div>
            <div class="task-row">
              <mat-icon class="task-icon info">info</mat-icon>
              <div class="task-info">
                <span class="task-title">Close CAPA-2025-005 pending closure</span>
                <span class="task-meta">CAPA · Pending Closure</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="panel activity-panel">
          <div class="panel-head">
            <mat-icon>history</mat-icon>
            <span>Recent Activity</span>
          </div>
          <div class="activity-list">
            <div class="activity-row">
              <div class="act-time">10:42 AM</div>
              <div class="act-dot capa"></div>
              <div class="act-text"><strong>Priya Sharma</strong> initiated CAPA-2025-003</div>
            </div>
            <div class="activity-row">
              <div class="act-time">09:15 AM</div>
              <div class="act-dot dev"></div>
              <div class="act-text"><strong>Rajesh Kumar</strong> investigating DEV-2025-023</div>
            </div>
            <div class="activity-row">
              <div class="act-time">Yesterday</div>
              <div class="act-dot cc"></div>
              <div class="act-text"><strong>Kavitha Reddy</strong> disposition DEV-2025-024</div>
            </div>
            <div class="activity-row">
              <div class="act-time">Yesterday</div>
              <div class="act-dot capa"></div>
              <div class="act-text"><strong>Venkat Rao</strong> updated CAPA-2025-001 actions</div>
            </div>
            <div class="activity-row">
              <div class="act-time">Earlier</div>
              <div class="act-dot dev"></div>
              <div class="act-text"><strong>Lakshmi Devi</strong> reviewing DEV-2025-026</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
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
            <button class="qa-btn disabled" disabled>
              <mat-icon>assessment</mat-icon>
              <span>Run Report</span>
            </button>
            <button class="qa-btn disabled" disabled>
              <mat-icon>download</mat-icon>
              <span>Export Data</span>
            </button>
            <button class="qa-btn disabled" disabled>
              <mat-icon>fact_check</mat-icon>
              <span>Audit Trail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1400px; margin: 0 auto; }

    /* KPI Strip */
    .kpi-strip {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px;
    }
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

    /* Panels */
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

    /* Module List */
    .module-list { display: flex; flex-direction: column; }
    .mod-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      border-bottom: 1px solid #f5f5f5; cursor: pointer; text-decoration: none; color: inherit;
    }
    .mod-item:last-child { border-bottom: none; }
    .mod-item:not(.disabled):hover { background: #f8f9fb; }
    .mod-item.disabled { opacity: 0.45; cursor: default; }
    .mod-icon {
      width: 32px; height: 32px; border-radius: 6px; display: flex;
      align-items: center; justify-content: center;
    }
    .mod-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    .mod-icon.capa { background: #2C5F7C; }
    .mod-icon.dev { background: #ED8B00; }
    .mod-icon.cc { background: #1B3A4B; }
    .mod-icon.doc { background: #9e9e9e; }
    .mod-icon.trn { background: #9e9e9e; }
    .mod-info { flex: 1; display: flex; flex-direction: column; }
    .mod-name { font-size: 13px; font-weight: 600; color: #333; }
    .mod-desc { font-size: 11px; color: #888; }
    .mod-count { font-size: 11px; font-weight: 600; color: #2C5F7C; }
    .mod-arrow { font-size: 16px; width: 16px; height: 16px; color: #ccc; }
    .mod-soon { font-size: 10px; color: #aaa; font-style: italic; }

    /* Task List */
    .task-list { display: flex; flex-direction: column; }
    .task-row {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 9px 14px; border-bottom: 1px solid #f5f5f5;
    }
    .task-row:last-child { border-bottom: none; }
    .task-icon { font-size: 16px; width: 16px; height: 16px; margin-top: 2px; }
    .task-icon.urgent { color: #c62828; }
    .task-icon.pending { color: #ED8B00; }
    .task-icon.info { color: #2C5F7C; }
    .task-info { flex: 1; display: flex; flex-direction: column; }
    .task-title { font-size: 12px; font-weight: 500; color: #333; }
    .task-meta { font-size: 10px; color: #999; margin-top: 1px; }
    .overdue-text { color: #c62828; font-weight: 600; }

    /* Activity */
    .activity-list { display: flex; flex-direction: column; }
    .activity-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-bottom: 1px solid #f5f5f5;
    }
    .activity-row:last-child { border-bottom: none; }
    .act-time { font-size: 10px; color: #aaa; min-width: 56px; }
    .act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .act-dot.capa { background: #2C5F7C; }
    .act-dot.dev { background: #ED8B00; }
    .act-dot.cc { background: #1B3A4B; }
    .act-text { font-size: 12px; color: #555; }
    .act-text strong { color: #333; }

    /* Quick Actions */
    .quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; }
    .qa-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 14px 8px; cursor: pointer; color: #2C5F7C;
    }
    .qa-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .qa-btn span { font-size: 11px; font-weight: 500; }
    .qa-btn:not(.disabled):hover { background: #ED8B00; color: #fff; border-color: #ED8B00; }
    .qa-btn.disabled { opacity: 0.4; cursor: default; }

    @media (max-width: 900px) {
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
      .panels { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent {}
