import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { TrainingService } from '../../services/training.service';
import { TrainingCurriculum, TrainingAssignment } from '../../models/training.model';

@Component({
  selector: 'trn-curriculum-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTabsModule],
  template: `
    <div class="detail-page" *ngIf="curriculum">
      <div class="detail-header">
        <div class="header-left">
          <button class="back-btn" type="button" (click)="backToList()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <div class="cur-number">{{ curriculum.curriculumNumber }}</div>
            <h2>{{ curriculum.title }}</h2>
          </div>
        </div>
        <div class="header-right">
          <span class="status-badge" [ngClass]="curriculum.status.toLowerCase()">{{ formatEnum(curriculum.status) }}</span>
          <span class="type-badge">{{ formatEnum(curriculum.trainingType) }}</span>
          <button class="action-btn primary" *ngIf="curriculum.status === 'DRAFT'">Activate</button>
          <button class="action-btn secondary" *ngIf="curriculum.status === 'ACTIVE'">Assign Training</button>
          <button class="action-btn warn" *ngIf="curriculum.status === 'ACTIVE'">Retire</button>
        </div>
      </div>

      <mat-tab-group class="detail-tabs" animationDuration="0">
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-card">
                <h4>Curriculum Details</h4>
                <div class="info-row"><span class="lbl">Category</span><span>{{ formatEnum(curriculum.category) }}</span></div>
                <div class="info-row"><span class="lbl">Training Type</span><span>{{ formatEnum(curriculum.trainingType) }}</span></div>
                <div class="info-row"><span class="lbl">Duration</span><span>{{ curriculum.durationHours }} hours</span></div>
                <div class="info-row"><span class="lbl">Validity</span><span>{{ curriculum.validityMonths }} months</span></div>
                <div class="info-row" *ngIf="curriculum.passingScore"><span class="lbl">Passing Score</span><span>{{ curriculum.passingScore }}%</span></div>
                <div class="info-row" *ngIf="curriculum.regulatoryReference"><span class="lbl">Regulatory Ref</span><span>{{ curriculum.regulatoryReference }}</span></div>
              </div>
              <div class="info-card">
                <h4>Ownership & Location</h4>
                <div class="info-row"><span class="lbl">Owner</span><span>{{ curriculum.owner?.displayName }}</span></div>
                <div class="info-row"><span class="lbl">Department</span><span>{{ curriculum.departmentName }}</span></div>
                <div class="info-row"><span class="lbl">Plant Site</span><span>{{ curriculum.plantSiteName }}</span></div>
                <div class="info-row" *ngIf="curriculum.relatedDocumentNumber"><span class="lbl">Related Doc</span><span class="doc-link">{{ curriculum.relatedDocumentNumber }}</span></div>
              </div>
              <div class="info-card">
                <h4>Dates</h4>
                <div class="info-row"><span class="lbl">Effective Date</span><span>{{ curriculum.effectiveDate | date:'mediumDate' }}</span></div>
                <div class="info-row"><span class="lbl">Created</span><span>{{ curriculum.createdAt | date:'medium' }}</span></div>
                <div class="info-row"><span class="lbl">Updated</span><span>{{ curriculum.updatedAt | date:'medium' }}</span></div>
              </div>
              <div class="info-card" *ngIf="curriculum.description">
                <h4>Description</h4>
                <p class="description">{{ curriculum.description }}</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Assignments ({{ assignments.length }})">
          <div class="tab-content">
            <table class="data-table" *ngIf="assignments.length">
              <thead><tr><th>Trainee</th><th>Status</th><th>Reason</th><th>Priority</th><th>Assigned</th><th>Due</th><th>Completed</th><th>Score</th></tr></thead>
              <tbody>
                <tr *ngFor="let a of assignments">
                  <td>{{ a.trainee.displayName }}</td>
                  <td><span class="status-badge" [ngClass]="a.status.toLowerCase()">{{ formatEnum(a.status) }}</span></td>
                  <td>{{ formatEnum(a.reason) }}</td>
                  <td><span class="priority-badge" [ngClass]="a.priority.toLowerCase()">{{ a.priority }}</span></td>
                  <td>{{ a.assignedDate | date:'mediumDate' }}</td>
                  <td [class.overdue]="isOverdue(a)">{{ a.dueDate | date:'mediumDate' }}</td>
                  <td>{{ a.completedDate | date:'mediumDate' }}</td>
                  <td>{{ a.score ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!assignments.length">No assignments for this curriculum</div>
          </div>
        </mat-tab>

        <mat-tab label="Sessions ({{ curriculum.sessions?.length || 0 }})">
          <div class="tab-content">
            <table class="data-table" *ngIf="curriculum.sessions?.length">
              <thead><tr><th>Date</th><th>Location</th><th>Instructor</th><th>Status</th><th>Attendees</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of curriculum.sessions">
                  <td>{{ s.sessionDate | date:'mediumDate' }}</td>
                  <td>{{ s.location }}</td>
                  <td>{{ s.instructor.displayName }}</td>
                  <td><span class="status-badge" [ngClass]="s.status.toLowerCase()">{{ formatEnum(s.status) }}</span></td>
                  <td>{{ s.attendees?.length || 0 }}/{{ s.maxAttendees }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!curriculum.sessions?.length">No sessions scheduled</div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
    <div class="loading" *ngIf="!curriculum">Loading curriculum...</div>
  `,
  styles: [`
    .detail-page { max-width: 1200px; margin: 0 auto; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .header-left { display: flex; align-items: flex-start; gap: 10px; }
    .back-btn { background: none; border: none; cursor: pointer; color: #555; display: flex; padding: 4px; }
    .cur-number { font-size: 11px; color: #00897b; font-weight: 600; }
    .detail-header h2 { font-size: 16px; font-weight: 700; color: #1B3A4B; margin: 0; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .status-badge { font-size: 10px; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .status-badge.draft { background: #f5f5f5; color: #666; }
    .status-badge.under_revision { background: #fff3e0; color: #e65100; }
    .status-badge.retired { background: #efebe9; color: #795548; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.assigned { background: #e3f2fd; color: #1565c0; }
    .status-badge.in_progress { background: #fff3e0; color: #e65100; }
    .status-badge.overdue { background: #ffebee; color: #c62828; }
    .status-badge.waived { background: #eceff1; color: #546e7a; }
    .status-badge.scheduled { background: #e3f2fd; color: #1565c0; }
    .status-badge.cancelled { background: #ffebee; color: #c62828; }
    .type-badge { font-size: 11px; padding: 3px 10px; border-radius: 10px; background: #e0f2f1; color: #00695c; font-weight: 600; }
    .priority-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #e65100; }
    .priority-badge.medium { background: #e3f2fd; color: #1565c0; }
    .priority-badge.low { background: #f5f5f5; color: #666; }
    .action-btn { border: none; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .action-btn.primary { background: #00897b; color: #fff; }
    .action-btn.primary:hover { background: #00695c; }
    .action-btn.secondary { background: #fff; border: 1px solid #d0d5dd; color: #333; }
    .action-btn.warn { background: #fff; border: 1px solid #ef9a9a; color: #c62828; }
    .detail-tabs { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
    .tab-content { padding: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .info-card { background: #fafbfc; border: 1px solid #eee; border-radius: 6px; padding: 14px; }
    .info-card h4 { font-size: 12px; font-weight: 600; color: #1B3A4B; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
    .info-row:last-child { border-bottom: none; }
    .info-row .lbl { color: #888; font-weight: 500; }
    .doc-link { color: #00897b; font-weight: 600; }
    .description { font-size: 12px; color: #555; line-height: 1.6; }
    .overdue { color: #c62828; font-weight: 600; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { background: #fafbfc; padding: 8px 10px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid #e5e7eb; }
    .data-table td { padding: 8px 10px; border-bottom: 1px solid #f5f5f5; }
    .empty { text-align: center; padding: 24px; color: #888; font-size: 12px; }
    .loading { text-align: center; padding: 40px; color: #888; }
  `],
})
export class CurriculumDetailComponent implements OnInit {
  curriculum: TrainingCurriculum | null = null;
  assignments: TrainingAssignment[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private trainingService: TrainingService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.trainingService.getCurriculumById(id).subscribe(c => this.curriculum = c || null);
      this.trainingService.getAssignments().subscribe(all => {
        this.assignments = all.filter(a => a.curriculumId === id);
      });
    }
  }

  backToList(): void {
    this.router.navigate(['/training/curricula']);
  }

  formatEnum(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
  isOverdue(a: TrainingAssignment): boolean { return a.status !== 'COMPLETED' && a.status !== 'WAIVED' && new Date(a.dueDate) < new Date(); }
}
