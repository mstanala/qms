import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const API_BASE_URL = 'http://localhost:8082/api/v1';

interface ApiPage<T> {
  content?: T[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  recordType?: string;
  recordId?: string;
  recordNumber?: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="notifications-page">
      <div class="page-title">
        <div>
          <h1>Notifications</h1>
          <p>Review system alerts, assigned tasks, approvals, and reminders.</p>
        </div>
        <div class="title-actions">
          <button mat-stroked-button type="button" (click)="load()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
          <button mat-raised-button color="primary" type="button" (click)="markAllAsRead()" [disabled]="!unreadCount">
            <mat-icon>done_all</mat-icon>
            Mark All Read
          </button>
        </div>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="summary-strip">
        <div class="summary">
          <strong>{{ notifications.length }}</strong>
          <span>Total loaded</span>
        </div>
        <div class="summary unread">
          <strong>{{ unreadCount }}</strong>
          <span>Unread</span>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="notification-list" *ngIf="notifications.length; else empty">
            <button
              class="notification-row"
              type="button"
              *ngFor="let notification of notifications; trackBy: trackById"
              [class.unread]="!notification.isRead"
              (click)="openNotification(notification)">
              <mat-icon>{{ icon(notification) }}</mat-icon>
              <div class="notification-main">
                <div class="row-head">
                  <strong>{{ notification.title }}</strong>
                  <span class="priority" [class.high]="isHighPriority(notification)">{{ formatLabel(notification.priority) }}</span>
                </div>
                <span>{{ notification.message }}</span>
                <small *ngIf="notification.recordNumber">
                  {{ formatLabel(notification.recordType || '') }} - {{ notification.recordNumber }}
                </small>
              </div>
              <div class="notification-meta">
                <time>{{ notification.createdAt | date:'dd-MMM-yyyy HH:mm' }}</time>
                <span>{{ notification.isRead ? 'Read' : 'Unread' }}</span>
              </div>
            </button>
          </div>
          <ng-template #empty>
            <div class="empty">
              <mat-icon>notifications_off</mat-icon>
              <span>No notifications found</span>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .notifications-page { max-width: 1100px; margin: 0 auto; }
    .page-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .title-actions { display: flex; gap: 8px; align-items: center; }
    button mat-icon { margin-right: 6px; }
    .summary-strip { display: grid; grid-template-columns: repeat(2, minmax(0, 180px)); gap: 10px; margin: 0 0 14px; }
    .summary { border: 1px solid #d8dee8; border-radius: 8px; background: #fff; padding: 12px 14px; display: flex; flex-direction: column; }
    .summary strong { color: #1B3A4B; font-size: 24px; line-height: 1; }
    .summary span { color: #667085; font-size: 12px; margin-top: 4px; }
    .summary.unread strong { color: #ED8B00; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .notification-list { display: grid; }
    .notification-row { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: start; border: 0; border-bottom: 1px solid #eef2f6; background: #fff; text-align: left; padding: 13px 4px; cursor: pointer; }
    .notification-row:hover { background: #f8fafc; }
    .notification-row:last-child { border-bottom: 0; }
    .notification-row.unread { background: #fffaf2; }
    .notification-row mat-icon { color: #2C5F7C; margin-top: 2px; }
    .notification-row.unread mat-icon { color: #ED8B00; }
    .notification-main { display: flex; flex-direction: column; min-width: 0; gap: 3px; }
    .row-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .row-head strong { color: #1f2937; font-size: 14px; }
    .notification-main span { color: #475467; font-size: 13px; }
    .notification-main small { color: #667085; font-size: 12px; }
    .priority { color: #667085; background: #eef2f6; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .priority.high { color: #b42318; background: #ffebee; }
    .notification-meta { text-align: right; display: flex; flex-direction: column; gap: 3px; white-space: nowrap; }
    .notification-meta time { color: #1f2937; font-size: 12px; }
    .notification-meta span { color: #98a2b3; font-size: 11px; }
    .empty { display: grid; place-items: center; gap: 8px; padding: 42px; color: #667085; }
    @media (max-width: 760px) {
      .page-title { flex-direction: column; }
      .notification-row { grid-template-columns: 28px 1fr; }
      .notification-meta { grid-column: 2; text-align: left; }
    }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  isLoading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.http.get<ApiPage<NotificationItem>>(`${API_BASE_URL}/notifications`, {
      params: { page: '0', size: '50', sort: 'createdAt,desc' },
    }).subscribe({
      next: (page) => {
        this.notifications = page.content || [];
        this.unreadCount = this.notifications.filter((item) => !item.isRead).length;
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Unable to load notifications', 'Dismiss', { duration: 3500 });
        this.isLoading = false;
      },
    });
  }

  markAllAsRead(): void {
    this.http.patch<void>(`${API_BASE_URL}/notifications/read-all`, {}).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Unable to mark notifications as read', 'Dismiss', { duration: 3500 }),
    });
  }

  openNotification(notification: NotificationItem): void {
    const navigate = () => {
      const url = this.urlFor(notification);
      if (url) this.router.navigateByUrl(url);
    };

    if (notification.isRead) {
      navigate();
      return;
    }

    this.http.patch<void>(`${API_BASE_URL}/notifications/${notification.id}/read`, {}).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        navigate();
      },
      error: () => this.snackBar.open('Unable to mark notification as read', 'Dismiss', { duration: 3500 }),
    });
  }

  trackById(_index: number, notification: NotificationItem): string {
    return notification.id;
  }

  icon(notification: NotificationItem): string {
    if (notification.notificationType === 'APPROVAL_REQUIRED') return 'how_to_reg';
    if (notification.notificationType === 'TASK_ASSIGNED') return 'assignment';
    if (notification.notificationType === 'OVERDUE_ALERT' || notification.notificationType === 'ESCALATION') return 'warning';
    if (notification.notificationType === 'REMINDER') return 'schedule';
    return notification.isRead ? 'notifications_none' : 'notifications';
  }

  isHighPriority(notification: NotificationItem): boolean {
    return notification.priority === 'HIGH' || notification.priority === 'URGENT';
  }

  formatLabel(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
  }

  private urlFor(notification: NotificationItem): string | null {
    if (!notification.recordType || !notification.recordId) return null;
    if (notification.recordType === 'CAPA') return `/capa/detail/${notification.recordId}`;
    if (notification.recordType === 'DEVIATION') return `/deviations/detail/${notification.recordId}`;
    if (notification.recordType === 'CHANGE_CONTROL') return `/change-control/detail/${notification.recordId}`;
    if (notification.recordType === 'DOCUMENT') return `/documents/detail/${notification.recordId}`;
    return null;
  }
}
