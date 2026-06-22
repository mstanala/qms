import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DocumentService } from '../../services/document.service';
import { QmsDocument, DocumentDashboardMetrics } from '../../models/document.model';

@Component({
  selector: 'doc-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dash">
      <div class="kpi-strip">
        <div class="kpi" routerLink="../list"><div class="kpi-val">{{ metrics?.totalDocuments ?? 0 }}</div><div class="kpi-lbl">Total Documents</div><div class="kpi-bar total"></div></div>
        <div class="kpi"><div class="kpi-val ok">{{ metrics?.effectiveDocuments ?? 0 }}</div><div class="kpi-lbl">Effective</div><div class="kpi-bar effective"></div></div>
        <div class="kpi"><div class="kpi-val">{{ metrics?.pendingReview ?? 0 }}</div><div class="kpi-lbl">Pending Review</div><div class="kpi-bar review"></div></div>
        <div class="kpi"><div class="kpi-val">{{ metrics?.pendingApproval ?? 0 }}</div><div class="kpi-lbl">Pending Approval</div><div class="kpi-bar approval"></div></div>
        <div class="kpi"><div class="kpi-val warn">{{ metrics?.overdueReviews ?? 0 }}</div><div class="kpi-lbl">Overdue Reviews</div><div class="kpi-bar overdue"></div></div>
        <div class="kpi"><div class="kpi-val">{{ metrics?.expiringNext30Days ?? 0 }}</div><div class="kpi-lbl">Expiring (30d)</div><div class="kpi-bar expiring"></div></div>
      </div>
      <div class="panels">
        <div class="panel">
          <div class="panel-head"><mat-icon>pie_chart</mat-icon><span>Documents by Type</span></div>
          <div class="chart-list">
            <div class="chart-row" *ngFor="let item of metrics?.byType || []">
              <span class="chart-label">{{ formatType(item.type) }}</span>
              <div class="chart-bar-wrap"><div class="chart-bar" [style.width.%]="barWidth(item.count, maxTypeCount)"></div></div>
              <span class="chart-count">{{ item.count }}</span>
            </div>
            <div class="empty" *ngIf="!metrics?.byType?.length">No data available</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><mat-icon>article</mat-icon><span>Recent Documents</span></div>
          <div class="doc-list">
            <a class="doc-row" *ngFor="let doc of recentDocs" [routerLink]="['../detail', doc.id]">
              <div class="doc-icon" [ngClass]="doc.status.toLowerCase()"><mat-icon>description</mat-icon></div>
              <div class="doc-info">
                <span class="doc-title">{{ doc.documentNumber }} - {{ doc.title }}</span>
                <span class="doc-meta">{{ doc.documentType }} | v{{ doc.currentVersion }} | {{ doc.owner?.displayName }}</span>
              </div>
              <span class="status-badge" [ngClass]="doc.status.toLowerCase()">{{ formatStatus(doc.status) }}</span>
            </a>
            <div class="empty" *ngIf="!recentDocs.length">No documents found</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><mat-icon>event</mat-icon><span>Upcoming Reviews</span></div>
          <div class="doc-list">
            <a class="doc-row" *ngFor="let doc of reviewDueDocs" [routerLink]="['../detail', doc.id]">
              <mat-icon class="review-icon" [class.overdue]="isOverdue(doc)">schedule</mat-icon>
              <div class="doc-info">
                <span class="doc-title">{{ doc.documentNumber }} - {{ doc.title }}</span>
                <span class="doc-meta">Due: {{ doc.nextReviewDate | date:'mediumDate' }}</span>
              </div>
            </a>
            <div class="empty" *ngIf="!reviewDueDocs.length">No upcoming reviews</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><mat-icon>bolt</mat-icon><span>Quick Actions</span></div>
          <div class="quick-grid">
            <button class="qa-btn" routerLink="../create"><mat-icon>add_circle</mat-icon><span>New Document</span></button>
            <button class="qa-btn" routerLink="../list"><mat-icon>search</mat-icon><span>Search Documents</span></button>
            <button class="qa-btn" routerLink="../list" [queryParams]="{status:'UNDER_REVIEW'}"><mat-icon>rate_review</mat-icon><span>Pending Reviews</span></button>
            <button class="qa-btn" routerLink="../list" [queryParams]="{status:'DRAFT'}"><mat-icon>edit_note</mat-icon><span>My Drafts</span></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1400px; margin: 0 auto; }
    .kpi-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; cursor: pointer; position: relative; overflow: hidden; }
    .kpi:hover { border-color: #5c6bc0; }
    .kpi-val { font-size: 26px; font-weight: 700; color: #1B3A4B; }
    .kpi-val.warn { color: #c62828; }
    .kpi-val.ok { color: #2e7d32; }
    .kpi-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    .kpi-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
    .kpi-bar.total { background: #5c6bc0; }
    .kpi-bar.effective { background: #388e3c; }
    .kpi-bar.review { background: #ED8B00; }
    .kpi-bar.approval { background: #7b1fa2; }
    .kpi-bar.overdue { background: #c62828; }
    .kpi-bar.expiring { background: #f57c00; }
    .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    .panel-head { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 12px; font-weight: 600; color: #1B3A4B; border-bottom: 1px solid #eee; background: #fafbfc; }
    .panel-head mat-icon { font-size: 16px; width: 16px; height: 16px; color: #5c6bc0; }
    .chart-list, .doc-list { display: flex; flex-direction: column; }
    .chart-row { display: flex; align-items: center; gap: 8px; padding: 8px 14px; }
    .chart-label { font-size: 11px; color: #555; min-width: 120px; }
    .chart-bar-wrap { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .chart-bar { height: 100%; background: #5c6bc0; border-radius: 4px; transition: width 0.3s; }
    .chart-count { font-size: 11px; font-weight: 600; color: #333; min-width: 24px; text-align: right; }
    .doc-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f5f5f5; cursor: pointer; text-decoration: none; color: inherit; }
    .doc-row:last-child { border-bottom: none; }
    .doc-row:hover { background: #f8f9fb; }
    .doc-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #5c6bc0; }
    .doc-icon mat-icon { font-size: 16px; width: 16px; height: 16px; color: #fff; }
    .doc-icon.draft { background: #9e9e9e; }
    .doc-icon.effective { background: #388e3c; }
    .doc-icon.under_review { background: #ED8B00; }
    .doc-icon.approved { background: #5c6bc0; }
    .doc-icon.obsolete { background: #c62828; }
    .doc-info { flex: 1; display: flex; flex-direction: column; }
    .doc-title { font-size: 12px; font-weight: 600; color: #333; }
    .doc-meta { font-size: 10px; color: #888; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .status-badge.effective { background: #e8f5e9; color: #2e7d32; }
    .status-badge.draft { background: #f5f5f5; color: #666; }
    .status-badge.under_review { background: #fff3e0; color: #e65100; }
    .status-badge.pending_approval { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.approved { background: #e8eaf6; color: #3949ab; }
    .status-badge.superseded { background: #efebe9; color: #795548; }
    .status-badge.obsolete { background: #ffebee; color: #c62828; }
    .review-icon { font-size: 18px; width: 18px; height: 18px; color: #ED8B00; }
    .review-icon.overdue { color: #c62828; }
    .empty { padding: 18px 14px; color: #888; font-size: 12px; }
    .quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; }
    .qa-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 8px; cursor: pointer; color: #5c6bc0; }
    .qa-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .qa-btn span { font-size: 11px; font-weight: 500; }
    .qa-btn:hover { background: #5c6bc0; color: #fff; border-color: #5c6bc0; }
    @media (max-width: 900px) { .kpi-strip { grid-template-columns: repeat(3, 1fr); } .panels { grid-template-columns: 1fr; } }
  `],
})
export class DocDashboardComponent implements OnInit {
  metrics: DocumentDashboardMetrics | null = null;
  recentDocs: QmsDocument[] = [];
  reviewDueDocs: QmsDocument[] = [];

  constructor(private docService: DocumentService) {}

  ngOnInit(): void {
    this.docService.getDashboardMetrics().subscribe(m => this.metrics = m);
    this.docService.getDocuments().subscribe(docs => {
      this.recentDocs = docs.slice(0, 8);
      this.reviewDueDocs = docs.filter(d => d.nextReviewDate).sort((a, b) =>
        new Date(a.nextReviewDate!).getTime() - new Date(b.nextReviewDate!).getTime()
      ).slice(0, 5);
    });
  }

  get maxTypeCount(): number {
    return Math.max(...(this.metrics?.byType?.map(t => t.count) || [1]));
  }

  barWidth(count: number, max: number): number { return max > 0 ? (count / max) * 100 : 0; }
  formatType(type: string): string { return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  formatStatus(status: string): string { return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  isOverdue(doc: QmsDocument): boolean { return doc.nextReviewDate ? new Date(doc.nextReviewDate) < new Date() : false; }
}