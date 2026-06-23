import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { AuthService, AuthUser } from './auth/auth.service';
import { ProfileApiService, SearchResult } from './profile/profile-api.service';

const API_BASE_URL = 'http://localhost:8082/api/v1';

interface ApiPage<T> {
  content?: T[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  recordType: string;
  recordId: string;
  recordNumber: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

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
    <router-outlet *ngIf="isLoginRoute"></router-outlet>

    <div class="vault-app" *ngIf="!isLoginRoute">
      <!-- ═══ TITLE BAR ═══ -->
      <div class="title-bar">
        <div class="title-bar-left">
          <mat-icon class="app-logo">verified</mat-icon>
          <span class="app-name">Mlabs Quality</span>
          <span class="app-divider">|</span>
          <span class="app-module">{{ activeModuleLabel }}</span>
        </div>
        <div class="title-bar-center">
          <div class="search-shell">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input
                type="text"
                placeholder="Search records, documents, actions..."
                [value]="searchTerm"
                (input)="onSearchInput(inputValue($event))"
                (focus)="showSearchPanel = searchTerm.length >= 2"
                (keydown.enter)="openSearchResult(searchResults[0])"
                (keydown.escape)="closeSearch()" />
              <button class="clear-search" type="button" *ngIf="searchTerm" (click)="closeSearch()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="search-panel" *ngIf="showSearchPanel">
              <div class="search-state" *ngIf="isSearching">Searching...</div>
              <button class="search-result" type="button" *ngFor="let result of searchResults" (mousedown)="openSearchResult(result)">
                <mat-icon>{{ searchIcon(result.type) }}</mat-icon>
                <span class="result-main">
                  <strong>{{ result.title }}</strong>
                  <small>{{ result.type }}<ng-container *ngIf="result.number"> · {{ result.number }}</ng-container><ng-container *ngIf="result.status"> · {{ formatStatus(result.status) }}</ng-container></small>
                </span>
              </button>
              <div class="search-state" *ngIf="!isSearching && searchTerm.length >= 2 && searchResults.length === 0">No results found</div>
              <div class="search-state" *ngIf="searchTerm.length < 2">Type at least 2 characters</div>
            </div>
          </div>
        </div>
        <div class="title-bar-right">
          <button class="tb-btn" matTooltip="Notifications" (click)="openNotifications()">
            <mat-icon [matBadge]="notificationBadge" matBadgeSize="small" matBadgeColor="warn">notifications_none</mat-icon>
          </button>
          <button class="tb-btn" matTooltip="Help">
            <mat-icon>help_outline</mat-icon>
          </button>
          <div class="user-pill" [matMenuTriggerFor]="userMenu">
            <div class="user-avatar">{{ userInitials }}</div>
            <span class="user-name">{{ currentUser?.displayName || currentUser?.username || 'User' }}</span>
            <mat-icon class="user-caret">expand_more</mat-icon>
          </div>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <strong>{{ currentUser?.displayName || currentUser?.username || 'User' }}</strong>
              <span>{{ currentUser?.email || 'Signed in' }}</span>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/profile/me"><mat-icon>person</mat-icon><span>My Profile</span></button>
            <button mat-menu-item routerLink="/profile/preferences"><mat-icon>settings</mat-icon><span>Preferences</span></button>
            <button mat-menu-item routerLink="/profile/activity"><mat-icon>history</mat-icon><span>Activity Log</span></button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()"><mat-icon>exit_to_app</mat-icon><span>Sign Out</span></button>
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
          <button mat-menu-item routerLink="/documents/create"><mat-icon>note_add</mat-icon>New Document</button>
          <button mat-menu-item routerLink="/training/curricula/create"><mat-icon>note_add</mat-icon>New Training Curriculum</button>
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
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/documents/list"><mat-icon>list</mat-icon>All Documents</button>
          <button mat-menu-item routerLink="/training/curricula"><mat-icon>list</mat-icon>All Training Curricula</button>
          <button mat-menu-item routerLink="/training/assignments"><mat-icon>list</mat-icon>Training Assignments</button>
          <button mat-menu-item routerLink="/training/my-training"><mat-icon>list</mat-icon>My Training</button>
        </mat-menu>

        <button class="menu-item" [matMenuTriggerFor]="toolsMenu" [disabled]="!canAccessTools">Tools</button>
        <mat-menu #toolsMenu="matMenu">
          <button mat-menu-item routerLink="/tools/reports" [disabled]="!canViewReports">
            <mat-icon>assessment</mat-icon>Reports
          </button>
          <button mat-menu-item routerLink="/tools/analytics" [disabled]="!canViewReports">
            <mat-icon>bar_chart</mat-icon>Analytics
          </button>
          <button mat-menu-item routerLink="/tools/audit-trail" [disabled]="!canViewAuditTrail">
            <mat-icon>fact_check</mat-icon>Audit Trail Viewer
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/tools/import-export" [disabled]="!canImportExport">
            <mat-icon>import_export</mat-icon>Import / Export
          </button>
        </mat-menu>

        <button class="menu-item" [matMenuTriggerFor]="adminMenu" [disabled]="!canAccessAdmin">Admin</button>
        <mat-menu #adminMenu="matMenu">
          <button mat-menu-item routerLink="/admin/users" [disabled]="!canManageUsers">
            <mat-icon>people</mat-icon>User Management
          </button>
          <button mat-menu-item routerLink="/admin/roles" [disabled]="!canConfigureAdmin">
            <mat-icon>admin_panel_settings</mat-icon>Roles & Permissions
          </button>
          <button mat-menu-item routerLink="/admin/configuration" [disabled]="!canConfigureAdmin">
            <mat-icon>tune</mat-icon>System Configuration
          </button>
          <button mat-menu-item routerLink="/admin/compliance" [disabled]="!canConfigureAdmin">
            <mat-icon>security</mat-icon>Compliance Settings
          </button>
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
          <span>Dashboard</span>
        </a>
        <button class="mod-tab mod-tab-dropdown" [matMenuTriggerFor]="qualityEventsMenu"
                [class.active]="isQualityEventsActive()">
          <mat-icon>event_note</mat-icon>
          <span>Quality Events</span>
          <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
        </button>
        <mat-menu #qualityEventsMenu="matMenu" class="quality-events-dropdown">
          <button mat-menu-item routerLink="/deviations">
            <mat-icon>report_problem</mat-icon>
            <span>Deviations</span>
          </button>
          <button mat-menu-item routerLink="/capa">
            <mat-icon>assignment_turned_in</mat-icon>
            <span>CAPA</span>
          </button>
          <button mat-menu-item routerLink="/change-control">
            <mat-icon>swap_horiz</mat-icon>
            <span>Change Controls</span>
          </button>
          <button mat-menu-item routerLink="/complaint">
            <mat-icon>feedback</mat-icon>
            <span>Complaints</span>
          </button>
        </mat-menu>
        <a class="mod-tab" routerLink="/documents" routerLinkActive="active">
          <mat-icon>description</mat-icon>
          <span>Document Mgmt</span>
        </a>
        <a class="mod-tab" routerLink="/training" routerLinkActive="active">
          <mat-icon>school</mat-icon>
          <span>Training Mgmt</span>
        </a>
        <a class="mod-tab" routerLink="/risk" routerLinkActive="active">
          <mat-icon>warning_amber</mat-icon>
          <span>Risk Mgmt</span>
        </a>
        <button class="mod-tab mod-tab-dropdown" [matMenuTriggerFor]="auditsActionsMenu"
                [class.active]="isAuditsActionsActive()">
          <mat-icon>fact_check</mat-icon>
          <span>Audits & Actions</span>
          <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
        </button>
        <mat-menu #auditsActionsMenu="matMenu">
          <button mat-menu-item routerLink="/audit">
            <mat-icon>fact_check</mat-icon>
            <span>Audit Management</span>
          </button>
          <button mat-menu-item routerLink="/supplier">
            <mat-icon>local_shipping</mat-icon>
            <span>Suppliers</span>
          </button>
          <button mat-menu-item routerLink="/nonconformance">
            <mat-icon>block</mat-icon>
            <span>Nonconformance</span>
          </button>
          <button mat-menu-item routerLink="/equipment">
            <mat-icon>precision_manufacturing</mat-icon>
            <span>Equipment</span>
          </button>
        </mat-menu>
        <div class="tab-spacer"></div>
        <div class="tab-actions">
          <button class="quick-action-btn" [matMenuTriggerFor]="quickCreate" matTooltip="Quick Create">
            <mat-icon>add</mat-icon> New
          </button>
          <mat-menu #quickCreate="matMenu">
            <button mat-menu-item routerLink="/capa/create"><mat-icon>assignment_turned_in</mat-icon>New CAPA</button>
            <button mat-menu-item routerLink="/deviations/create"><mat-icon>report_problem</mat-icon>New Deviation</button>
            <button mat-menu-item routerLink="/change-control/create"><mat-icon>swap_horiz</mat-icon>New Change Request</button>
            <button mat-menu-item routerLink="/documents/create"><mat-icon>description</mat-icon>New Document</button>
            <button mat-menu-item routerLink="/training/curricula/create"><mat-icon>school</mat-icon>New Curriculum</button>
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
          <span class="status-item">Session: {{ authService.isAuthenticated() ? 'Active' : 'Signed out' }}</span>
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

    .title-bar-center { flex: 1; display: flex; justify-content: center; position: relative; }
    .search-shell { position: relative; width: 420px; max-width: 100%; }
    .search-box {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.12); border-radius: 4px;
      padding: 0 8px 0 10px; width: 100%;
    }
    .search-box mat-icon { font-size: 16px; width: 16px; height: 16px; color: rgba(255,255,255,0.5); }
    .search-box input {
      background: none; border: none; outline: none; color: #fff;
      font-size: 12px; padding: 5px 0; width: 100%;
    }
    .search-box input::placeholder { color: rgba(255,255,255,0.4); }
    .clear-search {
      border: 0; background: transparent; color: rgba(255,255,255,0.6);
      width: 20px; height: 20px; padding: 0; display: grid; place-items: center; cursor: pointer;
    }
    .clear-search mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .search-panel {
      position: absolute; z-index: 30; top: 30px; left: 0; right: 0;
      background: #fff; border: 1px solid #d8dee8; border-radius: 6px;
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.22); overflow: hidden;
    }
    .search-result {
      width: 100%; display: flex; align-items: center; gap: 10px; border: 0;
      background: #fff; padding: 10px 12px; cursor: pointer; text-align: left;
      border-bottom: 1px solid #eef2f6;
    }
    .search-result:hover { background: #f8fafc; }
    .search-result mat-icon { color: #2C5F7C; font-size: 18px; width: 18px; height: 18px; }
    .result-main { display: flex; flex-direction: column; min-width: 0; }
    .result-main strong { color: #1f2937; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .result-main small { color: #667085; font-size: 11px; }
    .search-state { color: #667085; font-size: 12px; padding: 12px; }

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
      display: flex; align-items: center; height: 34px; padding: 0 10px;
      background: #234E5F; flex-shrink: 0;
    }
    .menu-item {
      background: none; border: none; color: rgba(255,255,255,0.85);
      font-size: 13.5px; font-weight: 400; padding: 5px 14px; cursor: pointer; border-radius: 3px;
      letter-spacing: 0.01em;
    }
    .menu-item:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .menu-item:disabled { color: rgba(255,255,255,0.35); cursor: default; }
    .menu-item:disabled:hover { background: none; color: rgba(255,255,255,0.35); }

    /* ── MODULE TABS ── */
    .module-tabs {
      display: flex; align-items: stretch; height: 42px; padding: 0 12px;
      background: #fff; border-bottom: 1px solid #d0d5dd; flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      overflow-x: auto; overflow-y: hidden;
    }
    .module-tabs::-webkit-scrollbar { height: 4px; }
    .module-tabs::-webkit-scrollbar-thumb { background: #c7d0d9; border-radius: 999px; }
    .mod-tab {
      display: flex; align-items: center; gap: 6px; padding: 0 16px;
      font-size: 13.5px; font-weight: 500; color: #475569; text-decoration: none;
      border-bottom: 2px solid transparent; cursor: pointer;
      transition: all 0.15s; white-space: nowrap; flex: 0 0 auto;
      letter-spacing: 0.01em;
    }
    .mod-tab mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .mod-tab:hover { color: #1B3A4B; background: rgba(44,95,124,0.04); }
    .mod-tab:hover mat-icon { color: #2C5F7C; }
    .mod-tab.active {
      color: #1B3A4B; border-bottom-color: #ED8B00; font-weight: 600;
      background: rgba(237,139,0,0.04);
    }
    .mod-tab.active mat-icon { color: #1B3A4B; }
    .mod-tab.disabled-tab { color: #bbb; cursor: default; pointer-events: none; }
    .mod-tab-dropdown { border: none; background: none; font-family: inherit; }
    .mod-tab-dropdown .dropdown-arrow { font-size: 18px; width: 18px; height: 18px; margin-left: -2px; color: #94a3b8; transition: color 0.15s; }
    .mod-tab-dropdown:hover .dropdown-arrow { color: #1B3A4B; }
    .mod-tab-dropdown.active .dropdown-arrow { color: #ED8B00; }
    .tab-spacer { flex: 1 0 12px; }
    .tab-actions { display: flex; align-items: center; flex: 0 0 auto; }
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
export class AppComponent implements OnDestroy {
  title = 'QMS Pharma';
  activeModuleLabel = 'Dashboard';
  currentTime = '';
  currentUser: AuthUser | null = null;
  isLoginRoute = false;
  unreadNotificationCount = 0;
  notifications: NotificationItem[] = [];
  canAccessAdmin = false;
  canManageUsers = false;
  canConfigureAdmin = false;
  canAccessTools = false;
  canViewReports = false;
  canViewAuditTrail = false;
  canImportExport = false;
  searchTerm = '';
  searchResults: SearchResult[] = [];
  isSearching = false;
  showSearchPanel = false;
  private searchInput$ = new Subject<string>();
  private searchSubscription: Subscription;

  constructor(
    private router: Router,
    public authService: AuthService,
    private http: HttpClient,
    private profileApi: ProfileApiService
  ) {
    this.updateTime();
    this.updateRouteState(this.router.url);
    setInterval(() => this.updateTime(), 60000);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        this.updateRouteState(url);
      });

    this.searchSubscription = this.searchInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap((term) => {
        this.isSearching = term.length >= 2;
        this.showSearchPanel = term.length >= 2;
      }),
      switchMap((term) => term.length >= 2
        ? this.profileApi.search(term).pipe(catchError(() => of({ results: [], total: 0 })))
        : of({ results: [], total: 0 }))
    ).subscribe((response) => {
      this.searchResults = response.results || [];
      this.isSearching = false;
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  get notificationBadge(): string {
    return this.unreadNotificationCount > 0 ? this.unreadNotificationCount.toString() : '';
  }

  get userInitials(): string {
    const name = this.currentUser?.displayName || this.currentUser?.username || 'User';
    return name
      .split(/[.\s]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.notifications = [];
    this.unreadNotificationCount = 0;
    this.canAccessAdmin = false;
    this.canManageUsers = false;
    this.canConfigureAdmin = false;
    this.canAccessTools = false;
    this.canViewReports = false;
    this.canViewAuditTrail = false;
    this.canImportExport = false;
    this.router.navigate(['/login']);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    if (value.length < 2) {
      this.searchResults = [];
      this.isSearching = false;
    }
    this.searchInput$.next(value);
  }

  closeSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showSearchPanel = false;
    this.isSearching = false;
  }

  openSearchResult(result?: SearchResult): void {
    if (!result?.url) return;
    this.router.navigateByUrl(result.url);
    this.closeSearch();
  }

  searchIcon(type: string): string {
    if (type === 'CAPA') return 'assignment_turned_in';
    if (type === 'DEVIATION') return 'report_problem';
    if (type === 'CHANGE_CONTROL') return 'swap_horiz';
    if (type === 'DOCUMENT') return 'description';
    return 'task_alt';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  isQualityEventsActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/deviations') || url.startsWith('/capa') || url.startsWith('/change-control') || url.startsWith('/complaint');
  }

  isAuditsActionsActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/audit') || url.startsWith('/supplier') || url.startsWith('/nonconformance') || url.startsWith('/equipment');
  }

  notificationIcon(notification: NotificationItem): string {
    if (notification.priority === 'HIGH' || notification.priority === 'URGENT') return 'warning';
    if (notification.notificationType === 'APPROVAL_REQUIRED') return 'how_to_reg';
    if (notification.notificationType === 'TASK_ASSIGNED') return 'assignment';
    return notification.isRead ? 'notifications_none' : 'notifications';
  }

  openNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  private updateRouteState(url: string): void {
    this.isLoginRoute = url.startsWith('/login');
    this.currentUser = this.authService.getUser();
    if (!this.isLoginRoute && this.authService.isAuthenticated()) {
      this.refreshAdminAccess();
      this.loadNotifications();
    }

    if (url.startsWith('/capa')) this.activeModuleLabel = 'CAPA';
    else if (url.startsWith('/deviations')) this.activeModuleLabel = 'Deviations';
    else if (url.startsWith('/change-control')) this.activeModuleLabel = 'Change Control';
    else if (url.startsWith('/documents')) this.activeModuleLabel = 'Documents Management';
    else if (url.startsWith('/training')) this.activeModuleLabel = 'Training Mgmt';
    else if (url.startsWith('/risk')) this.activeModuleLabel = 'Risk Mgmt';
    else if (url.startsWith('/audit')) this.activeModuleLabel = 'Audits';
    else if (url.startsWith('/supplier')) this.activeModuleLabel = 'Suppliers';
    else if (url.startsWith('/complaint')) this.activeModuleLabel = 'Complaints';
    else if (url.startsWith('/nonconformance')) this.activeModuleLabel = 'Nonconformance';
    else if (url.startsWith('/equipment')) this.activeModuleLabel = 'Equipment';
    else if (url.startsWith('/admin')) this.activeModuleLabel = 'Administration';
    else if (url.startsWith('/tools')) this.activeModuleLabel = 'Tools';
    else if (url.startsWith('/profile')) this.activeModuleLabel = 'My Account';
    else if (url.startsWith('/notifications')) this.activeModuleLabel = 'Notifications';
    else this.activeModuleLabel = 'Dashboard';
  }

  private updateTime(): void {
    this.currentTime = new Date().toLocaleString('en-US', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  private loadNotifications(): void {
    this.http
      .get<ApiPage<NotificationItem>>(`${API_BASE_URL}/notifications`, {
        params: { page: '0', size: '5', sort: 'createdAt,desc' },
      })
      .subscribe({
        next: (page) => {
          this.notifications = page.content || [];
        },
        error: () => {
          this.notifications = [];
        },
      });

    this.http
      .get<{ count: number }>(`${API_BASE_URL}/notifications/unread-count`)
      .subscribe({
        next: (response) => {
          this.unreadNotificationCount = response.count || 0;
        },
        error: () => {
          this.unreadNotificationCount = 0;
        },
      });
  }

  private refreshAdminAccess(): void {
    this.authService.ensureSessionContext().subscribe((user) => {
      this.currentUser = user;
      this.canAccessAdmin = this.authService.hasAdminAccess();
      this.canManageUsers = this.authService.hasPermission('ADMIN', 'READ', 'user') ||
        this.authService.hasPermission('ADMIN', 'CREATE', 'user') ||
        this.authService.hasPermission('ADMIN', 'UPDATE', 'user') ||
        this.currentUser?.userType === 'SYSTEM_ADMIN';
      this.canConfigureAdmin = this.authService.hasPermission('ADMIN', 'CONFIGURE', 'system') ||
        this.authService.hasPermission('ADMIN', 'CONFIGURE', 'workflow') ||
        this.currentUser?.userType === 'SYSTEM_ADMIN';
      this.canViewReports = this.authService.hasPermission('REPORT', 'READ') ||
        this.authService.hasPermission('REPORT', 'EXPORT') ||
        this.currentUser?.userType === 'SYSTEM_ADMIN';
      this.canViewAuditTrail = this.authService.hasPermission('ADMIN', 'READ', 'audit_trail') ||
        this.currentUser?.userType === 'SYSTEM_ADMIN';
      this.canImportExport = this.authService.hasPermission('REPORT', 'EXPORT') ||
        this.authService.hasPermission('CAPA', 'EXPORT') ||
        this.authService.hasPermission('DEVIATION', 'EXPORT') ||
        this.authService.hasPermission('CHANGE_CONTROL', 'EXPORT') ||
        this.currentUser?.userType === 'SYSTEM_ADMIN';
      this.canAccessTools = this.canViewReports || this.canViewAuditTrail || this.canImportExport;
    });
  }
}
