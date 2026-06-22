import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileApiService, UserActivity } from './profile-api.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="activity-page">
      <div class="page-title">
        <div>
          <h1>Activity Log</h1>
          <p>Your recent sign-ins and audited record actions.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <mat-card>
        <mat-card-content>
          <div class="activity-list" *ngIf="activity.length; else empty">
            <button class="activity-row" type="button" *ngFor="let item of activity; trackBy: trackById" (click)="openRecord(item)">
              <mat-icon [class.login]="item.type === 'LOGIN'">{{ icon(item) }}</mat-icon>
              <div class="activity-main">
                <strong>{{ item.action | titlecase }}</strong>
                <span>{{ description(item) }}</span>
              </div>
              <div class="activity-meta">
                <time>{{ item.timestamp | date:'dd-MMM-yyyy HH:mm' }}</time>
                <small>{{ item.ipAddress || 'No IP captured' }}</small>
              </div>
            </button>
          </div>
          <ng-template #empty>
            <div class="empty">
              <mat-icon>history</mat-icon>
              <span>No activity found</span>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .activity-page { max-width: 1100px; margin: 0 auto; }
    .page-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .activity-list { display: grid; }
    .activity-row { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center; border: 0; border-bottom: 1px solid #eef2f6; background: #fff; text-align: left; padding: 12px 4px; cursor: pointer; }
    .activity-row:hover { background: #f8fafc; }
    .activity-row:last-child { border-bottom: 0; }
    .activity-row mat-icon { color: #2C5F7C; }
    .activity-row mat-icon.login { color: #ED8B00; }
    .activity-main { display: flex; flex-direction: column; min-width: 0; }
    .activity-main strong { color: #1f2937; font-size: 13px; }
    .activity-main span { color: #667085; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .activity-meta { text-align: right; display: flex; flex-direction: column; gap: 2px; }
    .activity-meta time { color: #1f2937; font-size: 12px; }
    .activity-meta small { color: #98a2b3; font-size: 11px; }
    .empty { display: grid; place-items: center; gap: 8px; padding: 40px; color: #667085; }
    @media (max-width: 760px) {
      .activity-row { grid-template-columns: 28px 1fr; }
      .activity-meta { grid-column: 2; text-align: left; }
    }
  `],
})
export class ActivityLogComponent implements OnInit {
  activity: UserActivity[] = [];
  isLoading = false;

  constructor(
    private profileApi: ProfileApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.profileApi.getActivity(60).subscribe({
      next: (activity) => {
        this.activity = activity || [];
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Unable to load activity', 'Dismiss', { duration: 3500 });
        this.isLoading = false;
      },
    });
  }

  trackById(_index: number, item: UserActivity): string {
    return item.id;
  }

  icon(item: UserActivity): string {
    if (item.type === 'LOGIN') return item.status === 'SUCCESS' ? 'login' : 'error';
    if (item.action?.includes('CREATED')) return 'add_circle';
    if (item.action?.includes('UPDATED')) return 'edit';
    return 'fact_check';
  }

  description(item: UserActivity): string {
    if (item.type === 'LOGIN') return `${item.status || 'Login'} event`;
    const record = [item.recordType, item.recordNumber].filter(Boolean).join(' - ');
    return item.description || record || 'Record activity';
  }

  openRecord(item: UserActivity): void {
    const url = this.urlFor(item);
    if (url) this.router.navigateByUrl(url);
  }

  private urlFor(item: UserActivity): string | null {
    if (!item.recordId || !item.recordType) return null;
    if (item.recordType === 'CAPA') return `/capa/detail/${item.recordId}`;
    if (item.recordType === 'DEVIATION') return `/deviations/detail/${item.recordId}`;
    if (item.recordType === 'CHANGE_CONTROL') return `/change-control/detail/${item.recordId}`;
    if (item.recordType === 'DOCUMENT') return `/documents/detail/${item.recordId}`;
    return null;
  }
}
