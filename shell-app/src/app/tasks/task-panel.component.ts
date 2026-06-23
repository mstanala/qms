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
        <mat-icon [matBadge]="tasks.length || ''" matBadgeSize="small"
                  matBadgeColor="warn" [matBadgeHidden]="tasks.length === 0">
          {{ collapsed ? 'chevron_right' : 'chevron_left' }}
        </mat-icon>
      </div>

      <div class="panel-content" *ngIf="!collapsed">
        <div class="panel-header">
          <div class="panel-title">
            <mat-icon>assignment</mat-icon>
            <span>My Tasks</span>
            <span class="task-count" *ngIf="tasks.length">{{ tasks.length }}</span>
          </div>
          <button class="refresh-btn" (click)="loadTasks()" matTooltip="Refresh">
            <mat-icon [class.spinning]="loading">refresh</mat-icon>
          </button>
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

          <!-- Deviations -->
          <div class="sidebar-section" *ngIf="countByType('DEVIATION')">
            <div class="sidebar-section-title">Deviations ({{ countByType('DEVIATION') }})</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByType('DEVIATION')" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge rt-deviation">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim">
                <mat-icon>person_add</mat-icon>
              </button>
              <button type="button" class="claim-btn unclaim" *ngIf="task.assignee && isMyTask(task)" (click)="unclaimTask(task, $event)" matTooltip="Release">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
          </div>

          <!-- CAPA -->
          <div class="sidebar-section" *ngIf="countByType('CAPA')">
            <div class="sidebar-section-title">CAPA ({{ countByType('CAPA') }})</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByType('CAPA')" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge rt-capa">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim">
                <mat-icon>person_add</mat-icon>
              </button>
              <button type="button" class="claim-btn unclaim" *ngIf="task.assignee && isMyTask(task)" (click)="unclaimTask(task, $event)" matTooltip="Release">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
          </div>

          <!-- Change Control -->
          <div class="sidebar-section" *ngIf="countByType('CHANGE_CONTROL')">
            <div class="sidebar-section-title">Change Control ({{ countByType('CHANGE_CONTROL') }})</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByType('CHANGE_CONTROL')" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge rt-change_control">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim">
                <mat-icon>person_add</mat-icon>
              </button>
              <button type="button" class="claim-btn unclaim" *ngIf="task.assignee && isMyTask(task)" (click)="unclaimTask(task, $event)" matTooltip="Release">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
          </div>

          <!-- Documents -->
          <div class="sidebar-section" *ngIf="countByType('DOCUMENT')">
            <div class="sidebar-section-title">Documents ({{ countByType('DOCUMENT') }})</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByType('DOCUMENT')" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge rt-document">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim">
                <mat-icon>person_add</mat-icon>
              </button>
            </div>
          </div>

          <!-- Training -->
          <div class="sidebar-section" *ngIf="countByType('TRAINING')">
            <div class="sidebar-section-title">Training ({{ countByType('TRAINING') }})</div>
            <div class="sidebar-item-row" *ngFor="let task of getTasksByType('TRAINING')" [class.overdue]="isOverdue(task)">
              <button type="button" class="sidebar-item" (click)="openTask(task)">
                <span class="sidebar-item-label">{{ task.taskName || 'Task' }}</span>
                <span class="sidebar-item-badge rt-training">{{ task.recordNumber || '—' }}</span>
              </button>
              <button type="button" class="claim-btn" *ngIf="!task.assignee" (click)="claimTask(task, $event)" matTooltip="Claim">
                <mat-icon>person_add</mat-icon>
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
    .task-panel {
      width: 210px;
      min-width: 210px;
      background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: width 200ms ease, min-width 200ms ease;
      overflow: hidden;
    }
    .task-panel.collapsed {
      width: 28px;
      min-width: 28px;
    }

    .panel-toggle {
      position: absolute;
      top: 6px;
      right: 2px;
      z-index: 2;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .panel-toggle:hover { background: #f1f5f9; }
    .panel-toggle mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
    .collapsed .panel-toggle { right: 50%; transform: translateX(50%); top: 10px; }

    .panel-content {
      display: flex;
      flex-direction: column;
      height: 100%;
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
    .refresh-btn {
      border: none;
      background: none;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      color: #94a3b8;
    }
    .refresh-btn:hover { background: #f1f5f9; color: #475569; }
    .refresh-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ── Sidebar Sections (matches Deviation detail sidebar) ── */
    .sidebar-sections {
      flex: 1;
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
      padding: 1px 4px;
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

    .sidebar-item-row {
      display: flex;
      align-items: center;
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