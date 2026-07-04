import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
                    <ng-container *ngIf="a.relatedRecordNumber">
                      <span class="sep">|</span>
                      <span class="doc-ref">{{ a.relatedRecordNumber }}</span>
                    </ng-container>
                  </div>
                </div>
              </div>
              <div class="card-right">
                <span class="status-badge" [ngClass]="a.status.toLowerCase()">{{ formatEnum(a.status) }}</span>
                <span class="priority-badge" [ngClass]="a.priority.toLowerCase()">{{ a.priority }}</span>
                <button class="start-btn" *ngIf="a.status === 'ASSIGNED'" (click)="startTraining(a)">Start Training</button>
                <button class="start-btn" *ngIf="a.status === 'IN_PROGRESS' && a.relatedRecordId" (click)="openDocumentViewer(a)">View Document</button>
                <button class="complete-btn" *ngIf="a.status === 'IN_PROGRESS'" (click)="completeTraining(a)">Mark Complete</button>
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

    <!-- Document Viewer Popup -->
    <div class="overlay" *ngIf="viewerOpen" (click)="closeViewer()">
      <div class="viewer-popup" (click)="$event.stopPropagation()">
        <div class="viewer-header">
          <div class="viewer-title">
            <mat-icon>school</mat-icon>
            <div>
              <h3>{{ viewerAssignment?.curriculumTitle }}</h3>
              <span class="viewer-doc">{{ viewerAssignment?.relatedRecordNumber }}</span>
            </div>
          </div>
          <div class="viewer-actions">
            <button class="complete-btn" (click)="completeTraining(viewerAssignment!)">
              <mat-icon>check_circle</mat-icon> Mark Training Complete
            </button>
            <button class="close-btn" (click)="closeViewer()"><mat-icon>close</mat-icon></button>
          </div>
        </div>
        <div class="viewer-body">
          <div class="loading-viewer" *ngIf="viewerLoading">Loading document...</div>
          <div class="no-files" *ngIf="!viewerLoading && !viewerFiles.length">
            <mat-icon>info</mat-icon>
            <p>No document files found. Please read the document and mark training as complete.</p>
          </div>
          <div class="file-list" *ngIf="!viewerLoading && viewerFiles.length">
            <div class="file-item" *ngFor="let f of viewerFiles" (click)="openFile(f)">
              <mat-icon class="file-icon">{{ fileIcon(f.contentType || f.fileType) }}</mat-icon>
              <div class="file-info">
                <span class="file-name">{{ f.fileName }}</span>
                <span class="file-meta">{{ f.contentType || f.fileType }} &middot; {{ formatFileSize(f.fileSize) }}</span>
              </div>
              <button class="view-file-btn" title="Open file"><mat-icon>open_in_new</mat-icon></button>
            </div>
          </div>
          <div class="viewer-content" *ngIf="viewerBlobUrl">
            <iframe [src]="viewerBlobUrl" class="doc-iframe"></iframe>
          </div>
        </div>
      </div>
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
    .card-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .card-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    .card-icon.critical { background: #c62828; }
    .card-icon.high { background: #e65100; }
    .card-icon.medium { background: #1565c0; }
    .card-icon.low { background: #9e9e9e; }
    .card-icon.done { background: #2e7d32; }
    .card-info { display: flex; flex-direction: column; min-width: 0; }
    .card-title { font-size: 13px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-meta { font-size: 11px; color: #888; display: flex; gap: 4px; align-items: center; margin-top: 2px; flex-wrap: wrap; }
    .sep { color: #ddd; }
    .doc-ref { color: #5c6bc0; font-weight: 600; }
    .overdue { color: #c62828; font-weight: 600; }
    .card-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
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
    .start-btn { background: #00897b; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .start-btn:hover { background: #00695c; }
    .complete-btn { background: #2e7d32; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
    .complete-btn:hover { background: #1b5e20; }
    .complete-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty { text-align: center; padding: 24px; color: #888; font-size: 12px; }

    /* Overlay & Viewer Popup */
    .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .viewer-popup { background: #fff; border-radius: 8px; width: 90vw; max-width: 1100px; height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
    .viewer-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #fafbfc; border-radius: 8px 8px 0 0; }
    .viewer-title { display: flex; align-items: center; gap: 10px; }
    .viewer-title mat-icon { font-size: 24px; width: 24px; height: 24px; color: #00897b; }
    .viewer-title h3 { font-size: 14px; font-weight: 700; color: #1B3A4B; margin: 0; }
    .viewer-doc { font-size: 11px; color: #5c6bc0; font-weight: 600; }
    .viewer-actions { display: flex; align-items: center; gap: 8px; }
    .close-btn { background: none; border: 1px solid #d0d5dd; border-radius: 4px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #555; }
    .close-btn:hover { background: #f5f5f5; }
    .close-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .viewer-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .loading-viewer { padding: 40px; text-align: center; color: #888; font-size: 13px; }
    .no-files { padding: 40px; text-align: center; color: #888; }
    .no-files mat-icon { font-size: 40px; width: 40px; height: 40px; color: #ccc; }
    .no-files p { font-size: 13px; margin-top: 8px; }
    .file-list { padding: 12px 20px; display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid #e5e7eb; }
    .file-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; }
    .file-item:hover { border-color: #00897b; background: #f0faf9; }
    .file-icon { font-size: 22px; width: 22px; height: 22px; color: #5c6bc0; }
    .file-info { flex: 1; display: flex; flex-direction: column; }
    .file-name { font-size: 12px; font-weight: 600; color: #333; }
    .file-meta { font-size: 10px; color: #888; }
    .view-file-btn { background: none; border: none; cursor: pointer; color: #00897b; display: flex; align-items: center; }
    .view-file-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .viewer-content { flex: 1; overflow: hidden; }
    .doc-iframe { width: 100%; height: 100%; border: none; border-radius: 0 0 8px 8px; }
  `],
})
export class MyTrainingComponent implements OnInit {
  allAssignments: TrainingAssignment[] = [];
  pendingAssignments: TrainingAssignment[] = [];
  completedAssignments: TrainingAssignment[] = [];
  actionInProgress = false;

  // Viewer state
  viewerOpen = false;
  viewerLoading = false;
  viewerAssignment: TrainingAssignment | null = null;
  viewerFiles: any[] = [];
  viewerBlobUrl: SafeResourceUrl | null = null;
  private blobUrlRef: string | null = null;

  constructor(private trainingService: TrainingService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  get totalCount(): number { return this.allAssignments.length; }
  get completedCount(): number { return this.completedAssignments.length; }
  get completionRate(): number { return this.totalCount > 0 ? Math.round((this.completedCount / this.totalCount) * 100) : 0; }

  formatEnum(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
  isOverdue(a: TrainingAssignment): boolean { return new Date(a.dueDate) < new Date(); }

  startTraining(a: TrainingAssignment): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    this.trainingService.startTraining(a.id).subscribe({
      next: updated => {
        Object.assign(a, updated);
        this.refreshLists();
        if (a.relatedRecordId) {
          this.openDocumentViewer(a);
        }
      },
      error: () => this.actionInProgress = false,
      complete: () => this.actionInProgress = false,
    });
  }

  completeTraining(a: TrainingAssignment): void {
    if (this.actionInProgress) return;
    const comments = window.prompt('Training comments (optional)', 'Read and understood the document');
    if (comments === null) return;
    this.actionInProgress = true;
    this.trainingService.completeAssignment(a.id, undefined, comments).subscribe({
      next: updated => {
        Object.assign(a, updated);
        this.refreshLists();
        this.closeViewer();
      },
      error: () => this.actionInProgress = false,
      complete: () => this.actionInProgress = false,
    });
  }

  openDocumentViewer(a: TrainingAssignment): void {
    this.viewerAssignment = a;
    this.viewerOpen = true;
    this.viewerLoading = true;
    this.viewerFiles = [];
    this.clearBlobUrl();

    const docId = a.relatedRecordId || (a as any).sourceRecordId;
    if (!docId) {
      this.viewerLoading = false;
      return;
    }

    this.trainingService.getDocumentAttachments(docId).subscribe({
      next: files => {
        this.viewerFiles = files || [];
        this.viewerLoading = false;
        if (this.viewerFiles.length === 1) {
          this.openFile(this.viewerFiles[0]);
        }
      },
      error: () => this.viewerLoading = false,
    });
  }

  openFile(file: any): void {
    this.clearBlobUrl();
    this.trainingService.getAttachmentContent(file.id).subscribe(blob => {
      this.blobUrlRef = URL.createObjectURL(blob);
      const type = file.contentType || file.fileType || '';
      if (type.includes('pdf') || type.includes('image')) {
        this.viewerBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrlRef);
      } else {
        window.open(this.blobUrlRef, '_blank', 'noopener');
      }
    });
  }

  closeViewer(): void {
    this.viewerOpen = false;
    this.viewerAssignment = null;
    this.viewerFiles = [];
    this.clearBlobUrl();
  }

  fileIcon(type?: string): string {
    if (!type) return 'insert_drive_file';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('sheet') || type.includes('excel')) return 'table_chart';
    if (type.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private loadAssignments(): void {
    this.trainingService.getMyAssignments().subscribe(a => {
      this.allAssignments = a;
      this.refreshLists();
    });
  }

  private refreshLists(): void {
    this.pendingAssignments = this.allAssignments.filter(x => x.status !== 'COMPLETED' && x.status !== 'WAIVED');
    this.completedAssignments = this.allAssignments.filter(x => x.status === 'COMPLETED');
  }

  private clearBlobUrl(): void {
    if (this.blobUrlRef) {
      URL.revokeObjectURL(this.blobUrlRef);
      this.blobUrlRef = null;
    }
    this.viewerBlobUrl = null;
  }
}