import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TrainingService } from '../../services/training.service';
import { TrainingAssignment } from '../../models/training.model';

@Component({
  selector: 'trn-my-training',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTabsModule, MatProgressBarModule],
  template: `
    <div class="my-page">
      <div class="page-header">
        <h2>My Training</h2>
        <div class="progress-summary">
          <div class="progress-stat">
            <span class="prog-val">{{ completedCount }}/{{ totalCount }}</span>
            <span class="prog-lbl">Completed</span>
          </div>
          <div class="progress-bar-wrap">
            <mat-progress-bar mode="determinate" [value]="completionRate"></mat-progress-bar>
            <span class="prog-pct">{{ completionRate }}%</span>
          </div>
        </div>
      </div>

      <mat-tab-group class="my-tabs" animationDuration="0">
        <mat-tab label="Pending ({{ pendingAssignments.length }})">
          <div class="tab-content">
            <div class="assignment-card" *ngFor="let a of pendingAssignments">
              <div class="card-left">
                <div class="card-icon" [ngClass]="a.priority.toLowerCase()">
                  <mat-icon>{{ a.status === 'OVERDUE' ? 'warning' : 'school' }}</mat-icon>
                </div>
                <div class="card-info">
                  <div class="card-title">{{ a.curriculumNumber }} - {{ a.curriculumTitle }}</div>
                  <div class="card-meta">
                    <span>{{ formatEnum(a.reason) }}</span>
                    <span class="sep">|</span>
                    <span>Assigned by {{ a.assignedBy.displayName }}</span>
                    <span class="sep">|</span>
                    <span [class.overdue]="isOverdue(a)">Due: {{ a.dueDate | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>
              <div class="card-right">
                <span class="status-badge" [ngClass]="a.status.toLowerCase()">{{ formatEnum(a.status) }}</span>
                <span class="priority-badge" [ngClass]="a.priority.toLowerCase()">{{ a.priority }}</span>
                <button class="start-btn" *ngIf="a.status === 'ASSIGNED'">Start Training</button>
                <button class="complete-btn" *ngIf="a.status === 'IN_PROGRESS'">Mark Complete</button>
              </div>
            </div>
            <div class="empty" *ngIf="!pendingAssignments.length">No pending training assignments</div>
          </div>
        </mat-tab>

        <mat-tab label="Completed ({{ completedAssignments.length }})">
          <div class="tab-content">
            <div class="assignment-card completed" *ngFor="let a of completedAssignments">
              <div class="card-left">
                <div class="card-icon done"><mat-icon>check_circle</mat-icon></div>
                <div class="card-info">
                  <div class="card-title">{{ a.curriculumNumber }} - {{ a.curriculumTitle }}</div>
                  <div class="card-meta">
                    <span>Completed {{ a.completedDate | date:'mediumDate' }}</span>
                    <span class="sep" *ngIf="a.score">|</span>
                    <span *ngIf="a.score">Score: {{ a.score }}%</span>
                    <span class="sep" *ngIf="a.trainerName">|</span>
                    <span *ngIf="a.trainerName">Trainer: {{ a.trainerName }}</span>
                  </div>
                </div>
              </div>
              <div class="card-right">
                <span class="status-badge completed">Completed</span>
                <span class="score-badge" *ngIf="a.score" [class.pass]="a.score >= 80" [class.fail]="a.score < 80">{{ a.score }}%</span>
              </div>
            </div>
            <div class="empty" *ngIf="!completedAssignments.length">No completed training records</div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .my-page { max-width: 1000px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { font-size: 18px; font-weight: 700; color: #1B3A4B; }
    .progress-summary { display: flex; align-items: center; gap: 12px; }
    .progress-stat { display: flex; flex-direction: column; align-items: flex-end; }
    .prog-val { font-size: 16px; font-weight: 700; color: #1B3A4B; }
    .prog-lbl { font-size: 10px; color: #888; }
    .progress-bar-wrap { display: flex; align-items: center; gap: 8px; width: 160px; }
    .progress-bar-wrap mat-progress-bar { flex: 1; }
    ::ng-deep .progress-bar-wrap .mdc-linear-progress__bar-inner { border-color: #00897b; }
    .prog-pct { font-size: 12px; font-weight: 600; color: #00897b; }
    .my-tabs { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
    .tab-content { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .assignment-card { display: flex; justify-content: space-between; align-items: center; padding: 14px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; }
    .assignment-card:hover { border-color: #00897b; }
    .assignment-card.completed { opacity: 0.85; }
    .card-left { display: flex; align-items: center; gap: 12px; }
    .card-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .card-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    .card-icon.critical { background: #c62828; }
    .card-icon.high { background: #e65100; }
    .card-icon.medium { background: #1565c0; }
    .card-icon.low { background: #9e9e9e; }
    .card-icon.done { background: #2e7d32; }
    .card-info { display: flex; flex-direction: column; }
    .card-title { font-size: 13px; font-weight: 600; color: #333; }
    .card-meta { font-size: 11px; color: #888; display: flex; gap: 4px; align-items: center; margin-top: 2px; }
    .sep { color: #ddd; }
    .overdue { color: #c62828; font-weight: 600; }
    .card-right { display: flex; align-items: center; gap: 8px; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.assigned { background: #e3f2fd; color: #1565c0; }
    .status-badge.in_progress { background: #fff3e0; color: #e65100; }
    .status-badge.overdue { background: #ffebee; color: #c62828; }
    .priority-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #e3f2fd; color: #1565c0; }
    .priority-badge.low { background: #f5f5f5; color: #666; }
    .score-badge { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }
    .score-badge.pass { background: #e8f5e9; color: #2e7d32; }
    .score-badge.fail { background: #ffebee; color: #c62828; }
    .start-btn { background: #00897b; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .start-btn:hover { background: #00695c; }
    .complete-btn { background: #2e7d32; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .complete-btn:hover { background: #1b5e20; }
    .empty { text-align: center; padding: 24px; color: #888; font-size: 12px; }
  `],
})
export class MyTrainingComponent implements OnInit {
  allAssignments: TrainingAssignment[] = [];
  pendingAssignments: TrainingAssignment[] = [];
  completedAssignments: TrainingAssignment[] = [];

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainingService.getMyAssignments().subscribe(a => {
      this.allAssignments = a;
      this.pendingAssignments = a.filter(x => x.status !== 'COMPLETED' && x.status !== 'WAIVED');
      this.completedAssignments = a.filter(x => x.status === 'COMPLETED');
    });
  }

  get totalCount(): number { return this.allAssignments.length; }
  get completedCount(): number { return this.completedAssignments.length; }
  get completionRate(): number { return this.totalCount > 0 ? Math.round((this.completedCount / this.totalCount) * 100) : 0; }

  formatEnum(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
  isOverdue(a: TrainingAssignment): boolean { return new Date(a.dueDate) < new Date(); }
}