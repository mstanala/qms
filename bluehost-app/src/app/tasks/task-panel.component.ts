import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { TaskInboxService, TaskInboxItem } from './task-inbox.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'qms-task-panel',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatBadgeModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="task-panel" [class.collapsed]="collapsed">
      <div class="panel-toggle" (click)="collapsed = !collapsed"
           [matTooltip]="collapsed ? 'Show My Tasks' : 'Hide Task Panel'">
        <mat-icon class="toggle-icon">
          {{ collapsed ? 'chevron_right' : 'chevron_left' }}
        </mat-icon>
        <span class="toggle-badge" *ngIf="tasks.length">{{ tasks.length }}</span>
      </div>

      <div class="panel-content" *ngIf="!collapsed">
        <div class="panel-header">
          <div class="panel-title">
            <mat-icon>assignment</mat-icon>
            <span>My Tasks</span>
            <span class="task-count" *ngIf="tasks.length">{{ tasks.length }}</span>
          </div>
        </div>

        <div class="sidebar-sections" *ngIf="!loading">
          <!-- Pending Approvals -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pending Approvals</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByCategory('approval')" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Approval' }}</span>
                <span class="sidebar-item-badge" [ngClass]="'rt-' + task.recordType.toLowerCase()">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim task">
                <mat-icon>person_add</mat-icon>
              </button>
              <button type="button" class="claim-btn unclaim" *ngIf="task.assignee && isMyTask(task)" (click)="unclaimTask(task, $event)" matTooltip="Release task">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
            <div class="sidebar-empty" *ngIf="getTasksByCategory('approval').length === 0">None</div>
          </div>

          <!-- Dynamic sections for all record types -->
          <div class="sidebar-section" *ngFor="let rt of recordTypes">
            <div class="sidebar-section-title">{{ getRecordTypeLabel(rt) }} ({{ countByType(rt) }})</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByType(rt)" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge" [ngClass]="'rt-' + rt.toLowerCase()">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim">
                <mat-icon>person_add</mat-icon>
              </button>
              <button type="button" class="claim-btn unclaim" *ngIf="task.assignee && isMyTask(task)" (click)="unclaimTask(task, $event)" matTooltip="Release">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
          </div>

          <!-- Overdue Tasks -->
          <div class="sidebar-section" *ngIf="getOverdueTasks().length">
            <div class="sidebar-section-title overdue-title">Overdue ({{ getOverdueTasks().length }})</div>
            <div class="sidebar-item-row overdue" *ngFor="let task of getOverdueTasks()">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge" [ngClass]="'rt-' + task.recordType.toLowerCase()">{{ task.recordNumber || '—' }}</span>
              </button>
            </div>
          </div>

          <!-- Empty -->
          <div class="empty-state" *ngIf="tasks.length === 0">
            <mat-icon>check_circle_outline</mat-icon>
            <span>No pending tasks</span>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <mat-spinner diameter="20"></mat-spinner>
          <span>Loading...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-self: stretch;
      min-height: 0;
    }

    .task-panel {
      width: 248px;
      min-width: 248px;
      height: 100%;
      min-height: 0;
      background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: width 200ms ease, min-width 200ms ease;
      overflow: hidden;
    }
    .task-panel.collapsed {
      width: 32px;
      min-width: 32px;
    }

    .panel-toggle {
      position: absolute;
      top: 14px;
      right: 8px;
      z-index: 15;
      cursor: pointer;
      width: 24px;
      height: 24px;
      padding: 0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .panel-toggle:hover { background: #f1f5f9; }
    .panel-toggle .toggle-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      color: #64748b;
    }
    .toggle-badge {
      position: absolute;
      top: -7px;
      right: -3px;
      min-width: 16px;
      height: 16px;
      line-height: 16px;
      padding: 0 4px;
      border-radius: 999px;
      background: #ef4444;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      pointer-events: none;
      box-sizing: border-box;
    }
    .collapsed .panel-toggle { right: 6px; top: 7px; }
    .collapsed .toggle-badge {
      right: 1px;
    }

    .panel-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .panel-title {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      color: #1B3A4B;
    }
    .panel-title mat-icon { font-size: 16px; width: 16px; height: 16px; color: #2C5F7C; }
    .task-count {
      background: #ef4444;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 8px;
      min-width: 16px;
      text-align: center;
    }
    /* ── Sidebar Sections (matches Deviation detail sidebar) ── */
    .sidebar-sections {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 2px 0;
    }

    .sidebar-section {
      padding: 0;
    }

    .sidebar-section-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 10px 3px;
      border-top: 1px solid #f1f5f9;
    }
    .sidebar-section:first-child .sidebar-section-title {
      border-top: none;
    }
    .sidebar-section-title.overdue-title {
      color: #dc2626;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      border: none;
      background: none;
      padding: 4px 10px 4px 16px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background 80ms;
      gap: 4px;
    }
    .sidebar-item:hover {
      background: #f0f7ff;
    }
    .sidebar-item-label {
      font-size: 11px;
      font-weight: 500;
      color: #334155;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }
    .sidebar-item:hover .sidebar-item-label {
      color: #1B3A4B;
    }

    .sidebar-item-badge {
      font-size: 9px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .rt-deviation { background: #fef3c7; color: #92400e; }
    .rt-capa { background: #dbeafe; color: #1e40af; }
    .rt-change_control { background: #e9d5ff; color: #6b21a8; }
    .rt-document { background: #d1fae5; color: #065f46; }
    .rt-training { background: #fed7aa; color: #9a3412; }
    .rt-system { background: #f1f5f9; color: #64748b; }
    .rt-complaint { background: #fce4ec; color: #880e4f; }
    .rt-risk_register { background: #fff3e0; color: #e65100; }
    .rt-supplier { background: #e0f2f1; color: #004d40; }
    .rt-equipment { background: #e8eaf6; color: #283593; }
    .rt-audit { background: #f3e5f5; color: #6a1b9a; }
    .rt-nonconformance { background: #ffebee; color: #b71c1c; }

    .sidebar-item-row {
      display: flex;
      align-items: center;
      padding-right: 5px;
      box-sizing: border-box;
    }
    .sidebar-item-row .sidebar-item {
      flex: 1;
      min-width: 0;
    }
    .sidebar-item-row.overdue {
      border-left: 2px solid #ef4444;
    }
    .sidebar-item-row.overdue .sidebar-item {
      padding-left: 14px;
    }

    .claim-btn {
      border: none;
      background: none;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .claim-btn:hover {
      background: #dbeafe;
      color: #2563eb;
    }
    .claim-btn.unclaim:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    .claim-btn mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .sidebar-empty {
      font-size: 10px;
      color: #94a3b8;
      padding: 3px 10px 3px 16px;
      font-style: italic;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 12px;
      color: #94a3b8;
      gap: 6px;
    }
    .empty-state mat-icon { font-size: 28px; width: 28px; height: 28px; color: #d1d5db; }
    .empty-state span { font-size: 11px; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 12px;
      gap: 8px;
    }
    .loading-state span { font-size: 11px; color: #94a3b8; }
  `],
})
export class TaskPanelComponent implements OnInit, OnDestroy {
  tasks: TaskInboxItem[] = [];
  recordTypes: string[] = [];
  loading = false;
  collapsed = false;
  private pollSub?: Subscription;

  private static readonly APPROVAL_KEYWORDS = ['approv', 'review', 'sign', 'verify', 'close'];

  constructor(
    public taskService: TaskInboxService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.pollSub = this.taskService.startPolling(this.getCandidateGroups()).subscribe();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getMyTasks(this.getCandidateGroups()).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.recordTypes = Array.from(new Set(tasks.map(t => t.recordType)));
        this.loading = false;
      },
      error: () => {
        this.tasks = [];
        this.loading = false;
      },
    });
  }

  openTask(task: TaskInboxItem): void {
    const route = this.taskService.getRecordRoute(task);
    this.router.navigateByUrl(route);
  }

  isOverdue(task: TaskInboxItem): boolean {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  }

  countByType(type: string): number {
    return this.tasks.filter(t => t.recordType === type).length;
  }

  getTasksByCategory(category: string): TaskInboxItem[] {
    if (category === 'approval') {
      return this.tasks.filter(t => {
        const name = (t.taskName || '').toLowerCase();
        return TaskPanelComponent.APPROVAL_KEYWORDS.some(kw => name.includes(kw));
      });
    }
    return [];
  }

  getTasksByType(type: string): TaskInboxItem[] {
    return this.tasks.filter(t => t.recordType === type);
  }

  getRecordTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'DEVIATION': 'Deviations',
      'CAPA': 'CAPA',
      'CHANGE_CONTROL': 'Change Control',
      'DOCUMENT': 'Documents',
      'TRAINING': 'Training',
      'COMPLAINT': 'Complaints',
      'RISK_REGISTER': 'Risk Management',
      'SUPPLIER': 'Suppliers',
      'EQUIPMENT': 'Equipment',
      'AUDIT': 'Audits',
      'NONCONFORMANCE': 'Nonconformances',
    };
    return labels[type] || type.replace(/_/g, ' ');
  }

  getOverdueTasks(): TaskInboxItem[] {
    return this.tasks.filter(t => this.isOverdue(t));
  }

  isMyTask(task: TaskInboxItem): boolean {
    const userId = this.authService.getUser()?.id;
    return !!userId && task.assignee === userId;
  }

  claimTask(task: TaskInboxItem, event: Event): void {
    event.stopPropagation();
    this.taskService.claimTask(task.taskId).subscribe({
      next: () => {
        task.assignee = this.authService.getUser()?.id || null;
        this.loadTasks();
      },
      error: () => {},
    });
  }

  unclaimTask(task: TaskInboxItem, event: Event): void {
    event.stopPropagation();
    this.taskService.unclaimTask(task.taskId).subscribe({
      next: () => {
        task.assignee = null;
        this.loadTasks();
      },
      error: () => {},
    });
  }

  private getCandidateGroups(): string[] {
    return this.authService.getRoleCodes();
  }
}
