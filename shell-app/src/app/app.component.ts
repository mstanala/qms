import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <div class="vault-app">
      <!-- ═══ TITLE BAR ═══ -->
      <div class="title-bar">
        <div class="title-bar-left">
          <mat-icon class="app-logo">verified</mat-icon>
          <span class="app-name">Secure QMS</span>
          <span class="app-divider">|</span>
          <span class="app-module">{{ activeModuleLabel }}</span>
        </div>
        <div class="title-bar-center">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Search records, documents, actions..." />
          </div>
        </div>
        <div class="title-bar-right">
          <button class="tb-btn" matTooltip="Notifications" [matMenuTriggerFor]="notifMenu">
            <mat-icon [matBadge]="'3'" matBadgeSize="small" matBadgeColor="warn">notifications_none</mat-icon>
          </button>
          <mat-menu #notifMenu="matMenu" class="notif-menu">
            <div class="notif-header">Notifications</div>
            <button mat-menu-item><mat-icon>warning</mat-icon><span>CAPA-2025-008 overdue</span></button>
            <button mat-menu-item><mat-icon>check_circle</mat-icon><span>DEV-2025-003 approved</span></button>
            <button mat-menu-item><mat-icon>assignment</mat-icon><span>CC-2025-005 needs review</span></button>
          </mat-menu>
          <button class="tb-btn" matTooltip="Help">
            <mat-icon>help_outline</mat-icon>
          </button>
          <div class="user-pill" [matMenuTriggerFor]="userMenu">
            <div class="user-avatar">QA</div>
            <span class="user-name">QA Admin</span>
            <mat-icon class="user-caret">expand_more</mat-icon>
          </div>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <strong>QA Admin</strong>
              <span>qa.admin&#64;pharma.com</span>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item><mat-icon>person</mat-icon><span>My Profile</span></button>
            <button mat-menu-item><mat-icon>settings</mat-icon><span>Preferences</span></button>
            <button mat-menu-item><mat-icon>history</mat-icon><span>Activity Log</span></button>
            <mat-divider></mat-divider>
            <button mat-menu-item><mat-icon>exit_to_app</mat-icon><span>Sign Out</span></button>
          </mat-menu>
        </div>
      </div>

      <!-- ═══ MENU BAR ═══ -->
      <div class="menu-bar">
        <button class="menu-item" [matMenuTriggerFor]="fileMenu">File</button>
        <mat-menu #fileMenu="matMenu">
          <button mat-menu-item routerLink="/capa/create"><mat-icon>note_add</mat-icon>New CAPA</button>
          <button mat-menu-item routerLink="/deviations/create"><mat-icon>note_add</mat-icon>New Deviation</button>
          <button mat-menu-item routerLink="/change-control/create"><mat-icon>note_add</mat-icon>New Change Request</button>
          <mat-divider></mat-divider>
          <button mat-menu-item disabled><mat-icon>print</mat-icon>Print</button>
          <button mat-menu-item disabled><mat-icon>download</mat-icon>Export to PDF</button>
        </mat-menu>

        <button class="menu-item" [matMenuTriggerFor]="viewMenu">View</button>
        <mat-menu #viewMenu="matMenu">
          <button mat-menu-item routerLink="/dashboard"><mat-icon>dashboard</mat-icon>Overview Dashboard</button>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/capa/list"><mat-icon>list</mat-icon>All CAPAs</button>
          <button mat-menu-item routerLink="/deviations/list"><mat-icon>list</mat-icon>All Deviations</button>
          <button mat-menu-item routerLink="/change-control/list"><mat-icon>list</mat-icon>All Change Controls</button>
        </mat-menu>

        <button class="menu-item" [matMenuTriggerFor]="toolsMenu">Tools</button>
        <mat-menu #toolsMenu="matMenu">
          <button mat-menu-item disabled><mat-icon>assessment</mat-icon>Reports</button>
          <button mat-menu-item disabled><mat-icon>bar_chart</mat-icon>Analytics</button>
          <button mat-menu-item disabled><mat-icon>fact_check</mat-icon>Audit Trail Viewer</button>
          <mat-divider></mat-divider>
          <button mat-menu-item disabled><mat-icon>import_export</mat-icon>Import / Export</button>
        </mat-menu>

        <button class="menu-item" [matMenuTriggerFor]="adminMenu">Admin</button>
        <mat-menu #adminMenu="matMenu">
          <button mat-menu-item disabled><mat-icon>people</mat-icon>User Management</button>
          <button mat-menu-item disabled><mat-icon>admin_panel_settings</mat-icon>Roles & Permissions</button>
          <button mat-menu-item disabled><mat-icon>tune</mat-icon>System Configuration</button>
          <button mat-menu-item disabled><mat-icon>security</mat-icon>Compliance Settings</button>
        </mat-menu>

        <button class="menu-item" [matMenuTriggerFor]="helpMenu">Help</button>
        <mat-menu #helpMenu="matMenu">
          <button mat-menu-item disabled><mat-icon>menu_book</mat-icon>Documentation</button>
          <button mat-menu-item disabled><mat-icon>school</mat-icon>Training Materials</button>
          <mat-divider></mat-divider>
          <button mat-menu-item disabled><mat-icon>info</mat-icon>About Vault Quality</button>
        </mat-menu>
      </div>

      <!-- ═══ MODULE TABS ═══ -->
      <div class="module-tabs">
        <a class="mod-tab" routerLink="/dashboard" routerLinkActive="active"
           [routerLinkActiveOptions]="{exact: true}">
          <mat-icon>dashboard</mat-icon>
          <span>Overview</span>
        </a>
        <a class="mod-tab" routerLink="/capa" routerLinkActive="active">
          <mat-icon>assignment_turned_in</mat-icon>
          <span>CAPA</span>
        </a>
        <a class="mod-tab" routerLink="/deviations" routerLinkActive="active">
          <mat-icon>report_problem</mat-icon>
          <span>Deviations</span>
        </a>
        <a class="mod-tab" routerLink="/change-control" routerLinkActive="active">
          <mat-icon>swap_horiz</mat-icon>
          <span>Change Control</span>
        </a>
        <a class="mod-tab disabled-tab" matTooltip="Coming Soon">
          <mat-icon>description</mat-icon>
          <span>Documents</span>
        </a>
        <a class="mod-tab disabled-tab" matTooltip="Coming Soon">
          <mat-icon>school</mat-icon>
          <span>Training</span>
        </a>
        <div class="tab-spacer"></div>
        <div class="tab-actions">
          <button class="quick-action-btn" [matMenuTriggerFor]="quickCreate" matTooltip="Quick Create">
            <mat-icon>add</mat-icon> New
          </button>
          <mat-menu #quickCreate="matMenu">
            <button mat-menu-item routerLink="/capa/create"><mat-icon>assignment_turned_in</mat-icon>New CAPA</button>
            <button mat-menu-item routerLink="/deviations/create"><mat-icon>report_problem</mat-icon>New Deviation</button>
            <button mat-menu-item routerLink="/change-control/create"><mat-icon>swap_horiz</mat-icon>New Change Request</button>
          </mat-menu>
        </div>
      </div>

      <!-- ═══ BREADCRUMB BAR ═══ -->
      <div class="breadcrumb-bar">
        <div class="breadcrumb-trail">
          <a routerLink="/dashboard" class="bc-link">Home</a>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span class="bc-current">{{ activeModuleLabel }}</span>
        </div>
        <div class="bc-right">
          <span class="env-badge">
            <mat-icon>security</mat-icon>
            21 CFR Part 11
          </span>
          <span class="env-badge env">
            <span class="env-dot"></span>
            Production
          </span>
        </div>
      </div>

      <!-- ═══ MAIN CONTENT ═══ -->
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>

      <!-- ═══ STATUS BAR ═══ -->
      <div class="status-bar">
        <div class="status-left">
          <span class="status-item">
            <span class="status-dot online"></span>
            Connected
          </span>
          <span class="status-sep">|</span>
          <span class="status-item">System: Validated</span>
          <span class="status-sep">|</span>
          <span class="status-item">Session: Active</span>
        </div>
        <div class="status-right">
          <span class="status-item">Vault Quality v1.0.0</span>
          <span class="status-sep">|</span>
          <span class="status-item">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── RESET & SHELL ── */
    :host { display: block; height: 100vh; overflow: hidden; }
    .vault-app { display: flex; flex-direction: column; height: 100vh; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background: #eef1f5; }

    /* ── TITLE BAR ── */
    .title-bar {
      display: flex; align-items: center; height: 40px; padding: 0 10px;
      background: #1B3A4B; color: #fff; gap: 12px; flex-shrink: 0;
      -webkit-app-region: drag;
    }
    .title-bar-left { display: flex; align-items: center; gap: 6px; }
    .app-logo { font-size: 20px; width: 20px; height: 20px; color: #ED8B00; }
    .app-name { font-size: 13px; font-weight: 700; letter-spacing: 0.3px; }
    .app-divider { color: rgba(255,255,255,0.3); margin: 0 2px; }
    .app-module { font-size: 12px; color: rgba(255,255,255,0.7); }

    .title-bar-center { flex: 1; display: flex; justify-content: center; }
    .search-box {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.12); border-radius: 4px;
      padding: 0 10px; width: 360px; max-width: 100%;
    }
    .search-box mat-icon { font-size: 16px; width: 16px; height: 16px; color: rgba(255,255,255,0.5); }
    .search-box input {
      background: none; border: none; outline: none; color: #fff;
      font-size: 12px; padding: 5px 0; width: 100%;
    }
    .search-box input::placeholder { color: rgba(255,255,255,0.4); }

    .title-bar-right { display: flex; align-items: center; gap: 4px; }
    .tb-btn {
      background: none; border: none; color: rgba(255,255,255,0.7);
      cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center;
    }
    .tb-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .tb-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .user-pill {
      display: flex; align-items: center; gap: 6px; cursor: pointer;
      padding: 3px 8px 3px 3px; border-radius: 16px; margin-left: 4px;
    }
    .user-pill:hover { background: rgba(255,255,255,0.1); }
    .user-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: #ED8B00; color: #fff; font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .user-name { font-size: 12px; color: rgba(255,255,255,0.85); }
    .user-caret { font-size: 16px; width: 16px; height: 16px; color: rgba(255,255,255,0.5); }

    .user-menu-header { padding: 12px 16px; display: flex; flex-direction: column; }
    .user-menu-header strong { font-size: 14px; }
    .user-menu-header span { font-size: 12px; color: #888; }
    .notif-header { padding: 10px 16px; font-weight: 600; font-size: 13px; color: #333; border-bottom: 1px solid #eee; }

    /* ── MENU BAR ── */
    .menu-bar {
      display: flex; align-items: center; height: 28px; padding: 0 8px;
      background: #234E5F; flex-shrink: 0;
    }
    .menu-item {
      background: none; border: none; color: rgba(255,255,255,0.8);
      font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 3px;
    }
    .menu-item:hover { background: rgba(255,255,255,0.12); color: #fff; }

    /* ── MODULE TABS ── */
    .module-tabs {
      display: flex; align-items: stretch; height: 36px; padding: 0 8px;
      background: #fff; border-bottom: 1px solid #d0d5dd; flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .mod-tab {
      display: flex; align-items: center; gap: 5px; padding: 0 14px;
      font-size: 12px; font-weight: 500; color: #555; text-decoration: none;
      border-bottom: 2px solid transparent; cursor: pointer;
      transition: all 0.15s;
    }
    .mod-tab mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .mod-tab:hover { color: #1B3A4B; background: rgba(44,95,124,0.04); }
    .mod-tab.active {
      color: #1B3A4B; border-bottom-color: #ED8B00; font-weight: 600;
      background: rgba(237,139,0,0.04);
    }
    .mod-tab.disabled-tab { color: #bbb; cursor: default; pointer-events: none; }
    .tab-spacer { flex: 1; }
    .tab-actions { display: flex; align-items: center; }
    .quick-action-btn {
      display: flex; align-items: center; gap: 4px;
      background: #ED8B00; color: #fff; border: none;
      padding: 4px 12px; border-radius: 3px; font-size: 11px;
      font-weight: 600; cursor: pointer;
    }
    .quick-action-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .quick-action-btn:hover { background: #D4760A; }

    /* ── BREADCRUMB BAR ── */
    .breadcrumb-bar {
      display: flex; align-items: center; justify-content: space-between;
      height: 30px; padding: 0 14px;
      background: #f8f9fb; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .breadcrumb-trail { display: flex; align-items: center; gap: 2px; }
    .bc-link { font-size: 11px; color: #2C5F7C; text-decoration: none; }
    .bc-link:hover { text-decoration: underline; }
    .bc-sep { font-size: 14px; width: 14px; height: 14px; color: #bbb; }
    .bc-current { font-size: 11px; color: #666; font-weight: 500; }
    .bc-right { display: flex; align-items: center; gap: 10px; }
    .env-badge {
      display: flex; align-items: center; gap: 4px;
      font-size: 10px; color: #666; padding: 2px 8px;
      border-radius: 3px; background: rgba(44,95,124,0.06);
    }
    .env-badge mat-icon { font-size: 12px; width: 12px; height: 12px; color: #2C5F7C; }
    .env-dot { width: 6px; height: 6px; border-radius: 50%; background: #4caf50; }

    /* ── CONTENT AREA ── */
    .content-area {
      flex: 1; overflow-y: auto; padding: 16px 20px;
      background: #f0f2f5;
    }

    /* ── STATUS BAR ── */
    .status-bar {
      display: flex; align-items: center; justify-content: space-between;
      height: 22px; padding: 0 12px;
      background: #1B3A4B; color: rgba(255,255,255,0.6);
      font-size: 10px; flex-shrink: 0;
    }
    .status-left, .status-right { display: flex; align-items: center; gap: 6px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 3px; }
    .status-dot.online { background: #4caf50; }
    .status-sep { color: rgba(255,255,255,0.2); }
    .status-item { display: flex; align-items: center; }
  `],
})
export class AppComponent {
  title = 'QMS Pharma';
  activeModuleLabel = 'Overview';
  currentTime = '';

  constructor(private router: Router) {
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        if (url.startsWith('/capa')) this.activeModuleLabel = 'CAPA Management';
        else if (url.startsWith('/deviations')) this.activeModuleLabel = 'Deviation Management';
        else if (url.startsWith('/change-control')) this.activeModuleLabel = 'Change Control';
        else this.activeModuleLabel = 'Overview';
      });
  }

  private updateTime(): void {
    this.currentTime = new Date().toLocaleString('en-US', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
