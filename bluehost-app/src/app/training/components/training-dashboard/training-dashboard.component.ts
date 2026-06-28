import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TrainingService } from '../../services/training.service';
import { TrainingDashboardMetrics, TrainingAssignment, TrainingSession } from '../../models/training.model';
import { hasStoredPermission } from '../../../permission.guard';

@Component({
  selector: 'trn-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dash">
      <div class="kpi-strip">
        <div class="kpi" routerLink="../curricula"><div class="kpi-val">{{ metrics?.totalCurricula ?? 0 }}</div><div class="kpi-lbl">Total Curricula</div><div class="kpi-bar total"></div></div>
        <div class="kpi"><div class="kpi-val ok">{{ metrics?.activeCurricula ?? 0 }}</div><div class="kpi-lbl">Active Curricula</div><div class="kpi-bar active"></div></div>
        <div class="kpi" routerLink="../assignments"><div class="kpi-val">{{ metrics?.totalAssignments ?? 0 }}</div><div class="kpi-lbl">Total Assignments</div><div class="kpi-bar assign"></div></div>
        <div class="kpi"><div class="kpi-val ok">{{ metrics?.completedAssignments ?? 0 }}</div><div class="kpi-lbl">Completed</div><div class="kpi-bar completed"></div></div>
        <div class="kpi"><div class="kpi-val warn">{{ metrics?.overdueAssignments ?? 0 }}</div><div class="kpi-lbl">Overdue</div><div class="kpi-bar overdue"></div></div>
        <div class="kpi"><div class="kpi-val" [class.ok]="(metrics?.complianceRate ?? 0) >= 90" [class.warn]="(metrics?.complianceRate ?? 0) < 80">{{ metrics?.complianceRate ?? 0 }}%</div><div class="kpi-lbl">Compliance Rate</div><div class="kpi-bar compliance"></div></div>
      </div>
      <div class="panels">
        <div class="panel">
          <div class="panel-head"><mat-icon>bar_chart</mat-icon><span>Training by Category</span></div>
          <div class="chart-list">
            <div class="chart-row" *ngFor="let item of metrics?.byCategory || []">
              <span class="chart-label">{{ formatEnum(item.category) }}</span>
              <div class="chart-bar-wrap"><div class="chart-bar" [style.width.%]="barWidth(item.count, maxCategoryCount)"></div></div>
              <span class="chart-count">{{ item.count }}</span>
            </div>
            <div class="empty" *ngIf="!metrics?.byCategory?.length">No data available</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><mat-icon>assessment</mat-icon><span>Department Compliance</span></div>
          <div class="chart-list">
            <div class="chart-row" *ngFor="let item of metrics?.byDepartment || []">
              <span class="chart-label">{{ item.department }}</span>
              <div class="chart-bar-wrap"><div class="chart-bar" [style.width.%]="item.compliance" [class.low]="item.compliance < 80" [class.mid]="item.compliance >= 80 && item.compliance < 90"></div></div>
              <span class="chart-count" [class.warn]="item.compliance < 80">{{ item.compliance }}%</span>
            </div>
            <div class="empty" *ngIf="!metrics?.byDepartment?.length">No data available</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><mat-icon>assignment_late</mat-icon><span>Overdue Assignments</span></div>
          <div class="doc-list">
            <a class="doc-row" *ngFor="let a of overdueAssignments" routerLink="../assignments">
              <div class="doc-icon overdue"><mat-icon>warning</mat-icon></div>
              <div class="doc-info">
                <span class="doc-title">{{ a.curriculumNumber }} - {{ a.curriculumTitle }}</span>
                <span class="doc-meta">{{ a.trainee.displayName }} | Due: {{ a.dueDate | date:'mediumDate' }}</span>
              </div>
              <span class="status-badge overdue">Overdue</span>
            </a>
            <div class="empty" *ngIf="!overdueAssignments.length">No overdue assignments</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><mat-icon>event</mat-icon><span>Upcoming Sessions</span></div>
          <div class="doc-list">
            <a class="doc-row" *ngFor="let s of upcomingSessions">
              <mat-icon class="session-icon">school</mat-icon>
              <div class="doc-info">
                <span class="doc-title">{{ s.curriculumTitle }}</span>
                <span class="doc-meta">{{ s.sessionDate | date:'mediumDate' }} | {{ s.location }} | {{ s.instructor.displayName }}</span>
              </div>
              <span class="att-count">{{ s.attendees?.length || 0 }}/{{ s.maxAttendees }}</span>
            </a>
            <div class="empty" *ngIf="!upcomingSessions.length">No upcoming sessions</div>
          </div>
        </div>
        <div class="panel full-width">
          <div class="panel-head"><mat-icon>bolt</mat-icon><span>Quick Actions</span></div>
          <div class="quick-grid">
            <button class="qa-btn" routerLink="../curricula/create" *ngIf="canCreateTraining"><mat-icon>add_circle</mat-icon><span>New Curriculum</span></button>
            <button class="qa-btn" routerLink="../assignments" *ngIf="canViewAssignments"><mat-icon>assignment</mat-icon><span>View Assignments</span></button>
            <button class="qa-btn" routerLink="../matrix" *ngIf="canViewMatrix"><mat-icon>grid_on</mat-icon><span>Training Matrix</span></button>
            <button class="qa-btn" routerLink="../my-training"><mat-icon>school</mat-icon><span>My Training</span></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1400px; margin: 0 auto; }
    .kpi-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; cursor: pointer; position: relative; overflow: hidden; }
    .kpi:hover { border-color: #00897b; }
    .kpi-val { font-size: 26px; font-weight: 700; color: #1B3A4B; }
    .kpi-val.warn { color: #c62828; }
    .kpi-val.ok { color: #2e7d32; }
    .kpi-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    .kpi-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
    .kpi-bar.total { background: #00897b; }
    .kpi-bar.active { background: #388e3c; }
    .kpi-bar.assign { background: #5c6bc0; }
    .kpi-bar.completed { background: #43a047; }
    .kpi-bar.overdue { background: #c62828; }
    .kpi-bar.compliance { background: #00897b; }
    .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    .panel.full-width { grid-column: span 2; }
    .panel-head { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 12px; font-weight: 600; color: #1B3A4B; border-bottom: 1px solid #eee; background: #fafbfc; }
    .panel-head mat-icon { font-size: 16px; width: 16px; height: 16px; color: #00897b; }
    .chart-list, .doc-list { display: flex; flex-direction: column; }
    .chart-row { display: flex; align-items: center; gap: 8px; padding: 8px 14px; }
    .chart-label { font-size: 11px; color: #555; min-width: 120px; }
    .chart-bar-wrap { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .chart-bar { height: 100%; background: #00897b; border-radius: 4px; transition: width 0.3s; }
    .chart-bar.low { background: #c62828; }
    .chart-bar.mid { background: #ED8B00; }
    .chart-count { font-size: 11px; font-weight: 600; color: #333; min-width: 36px; text-align: right; }
    .chart-count.warn { color: #c62828; }
    .doc-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f5f5f5; cursor: pointer; text-decoration: none; color: inherit; }
    .doc-row:last-child { border-bottom: none; }
    .doc-row:hover { background: #f8f9fb; }
    .doc-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .doc-icon mat-icon { font-size: 16px; width: 16px; height: 16px; color: #fff; }
    .doc-icon.overdue { background: #c62828; }
    .doc-info { flex: 1; display: flex; flex-direction: column; }
    .doc-title { font-size: 12px; font-weight: 600; color: #333; }
    .doc-meta { font-size: 10px; color: #888; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .status-badge.overdue { background: #ffebee; color: #c62828; }
    .session-icon { font-size: 18px; width: 18px; height: 18px; color: #00897b; }
    .att-count { font-size: 11px; font-weight: 600; color: #555; background: #f0f0f0; padding: 2px 8px; border-radius: 10px; }
    .empty { padding: 18px 14px; color: #888; font-size: 12px; }
    .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; }
    .qa-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 8px; cursor: pointer; color: #00897b; }
    .qa-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .qa-btn span { font-size: 11px; font-weight: 500; }
    .qa-btn:hover { background: #00897b; color: #fff; border-color: #00897b; }
    .qa-btn:disabled { opacity: 0.45; cursor: default; }
    .qa-btn:disabled:hover { background: #f8f9fb; color: #00897b; border-color: #e5e7eb; }
    @media (max-width: 900px) { .kpi-strip { grid-template-columns: repeat(3, 1fr); } .panels { grid-template-columns: 1fr; } .quick-grid { grid-template-columns: repeat(2, 1fr); } }
  `],
})
export class TrainingDashboardComponent implements OnInit {
  metrics: TrainingDashboardMetrics | null = null;
  overdueAssignments: TrainingAssignment[] = [];
  upcomingSessions: TrainingSession[] = [];
  canCreateTraining = hasStoredPermission('TRAINING', 'CREATE', 'training_record');
  canViewAssignments = hasStoredPermission('TRAINING', 'READ', 'training_record');
  canViewMatrix = hasStoredPermission('TRAINING', 'READ', 'training_record');

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainingService.getDashboardMetrics().subscribe(m => this.metrics = m);
    this.trainingService.getAssignments('OVERDUE').subscribe(a => this.overdueAssignments = a.filter(x => x.status === 'OVERDUE').slice(0, 5));
    this.trainingService.getSessions().subscribe(s => {
      this.upcomingSessions = s.filter(x => x.status === 'SCHEDULED').sort((a, b) =>
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
      ).slice(0, 5);
    });
  }

  get maxCategoryCount(): number {
    return Math.max(...(this.metrics?.byCategory?.map(c => c.count) || [1]));
  }

  barWidth(count: number, max: number): number { return max > 0 ? (count / max) * 100 : 0; }
  formatEnum(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
}
