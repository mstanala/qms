import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { DocumentService } from '../../services/document.service';
import { QmsDocument } from '../../models/document.model';

@Component({
  selector: 'doc-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTabsModule],
  template: `
    <div class="detail-page" *ngIf="doc">
      <div class="detail-header">
        <div class="header-left">
          <button class="back-btn" routerLink="../list"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <div class="doc-number">{{ doc.documentNumber }}</div>
            <h2>{{ doc.title }}</h2>
          </div>
        </div>
        <div class="header-right">
          <span class="status-badge" [ngClass]="doc.status.toLowerCase()">{{ formatStatus(doc.status) }}</span>
          <span class="version-badge">v{{ doc.currentVersion }}</span>
          <button class="action-btn primary" *ngIf="doc.status === 'DRAFT'" (click)="submitForReview()">Submit for Review</button>
          <button class="action-btn primary" *ngIf="doc.status === 'PENDING_APPROVAL'" (click)="approve()">Approve</button>
          <button class="action-btn secondary" *ngIf="doc.status === 'EFFECTIVE'">Create New Version</button>
          <button class="action-btn warn" *ngIf="doc.status === 'EFFECTIVE'">Obsolete</button>
        </div>
      </div>

      <mat-tab-group class="detail-tabs" animationDuration="0">
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-card">
                <h4>Document Details</h4>
                <div class="info-row"><span class="lbl">Type</span><span>{{ formatStatus(doc.documentType) }}</span></div>
                <div class="info-row"><span class="lbl">Category</span><span>{{ doc.category }}</span></div>
                <div class="info-row" *ngIf="doc.subCategory"><span class="lbl">Sub-Category</span><span>{{ doc.subCategory }}</span></div>
                <div class="info-row"><span class="lbl">Confidentiality</span><span>{{ formatStatus(doc.confidentialityLevel) }}</span></div>
                <div class="info-row" *ngIf="doc.regulatoryReference"><span class="lbl">Regulatory Ref</span><span>{{ doc.regulatoryReference }}</span></div>
                <div class="info-row" *ngIf="doc.keywords"><span class="lbl">Keywords</span><span>{{ doc.keywords }}</span></div>
              </div>
              <div class="info-card">
                <h4>Ownership & Location</h4>
                <div class="info-row"><span class="lbl">Owner</span><span>{{ doc.owner?.displayName }}</span></div>
                <div class="info-row"><span class="lbl">Department</span><span>{{ doc.departmentName }}</span></div>
                <div class="info-row"><span class="lbl">Plant Site</span><span>{{ doc.plantSiteName }}</span></div>
              </div>
              <div class="info-card">
                <h4>Dates & Review</h4>
                <div class="info-row"><span class="lbl">Effective Date</span><span>{{ doc.effectiveDate | date:'mediumDate' }}</span></div>
                <div class="info-row"><span class="lbl">Next Review</span><span [class.overdue]="isReviewOverdue()">{{ doc.nextReviewDate | date:'mediumDate' }}</span></div>
                <div class="info-row"><span class="lbl">Review Period</span><span>{{ doc.reviewPeriodMonths }} months</span></div>
                <div class="info-row"><span class="lbl">Created</span><span>{{ doc.createdAt | date:'medium' }}</span></div>
                <div class="info-row"><span class="lbl">Updated</span><span>{{ doc.updatedAt | date:'medium' }}</span></div>
              </div>
              <div class="info-card full-width" *ngIf="doc.description">
                <h4>Description</h4>
                <p class="description">{{ doc.description }}</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Version History ({{ doc.versions?.length || 0 }})">
          <div class="tab-content">
            <table class="data-table" *ngIf="doc.versions?.length">
              <thead><tr><th>Version</th><th>Change Type</th><th>Description</th><th>Status</th><th>Author</th><th>File</th><th>Date</th></tr></thead>
              <tbody>
                <tr *ngFor="let v of doc.versions">
                  <td class="ver-num">v{{ v.versionNumber }}</td>
                  <td>{{ formatStatus(v.changeType) }}</td>
                  <td>{{ v.changeDescription }}</td>
                  <td><span class="status-badge" [ngClass]="v.status.toLowerCase()">{{ formatStatus(v.status) }}</span></td>
                  <td>{{ v.author?.displayName }}</td>
                  <td><a *ngIf="v.fileName" class="file-link"><mat-icon>download</mat-icon>{{ v.fileName }}</a></td>
                  <td>{{ v.createdAt | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!doc.versions?.length">No versions recorded</div>
          </div>
        </mat-tab>

        <mat-tab label="Reviews ({{ doc.reviews?.length || 0 }})">
          <div class="tab-content">
            <table class="data-table" *ngIf="doc.reviews?.length">
              <thead><tr><th>Type</th><th>Due Date</th><th>Reviewer</th><th>Decision</th><th>Status</th><th>Completed</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of doc.reviews">
                  <td>{{ r.reviewType }}</td>
                  <td>{{ r.reviewDueDate | date:'mediumDate' }}</td>
                  <td>{{ r.reviewer?.displayName || 'Unassigned' }}</td>
                  <td>{{ r.reviewDecision ? formatStatus(r.reviewDecision) : '-' }}</td>
                  <td><span class="status-badge" [ngClass]="r.status.toLowerCase()">{{ r.status }}</span></td>
                  <td>{{ r.reviewCompletedDate | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!doc.reviews?.length">No reviews scheduled</div>
          </div>
        </mat-tab>

        <mat-tab label="Distribution">
          <div class="tab-content">
            <table class="data-table" *ngIf="doc.distributions?.length">
              <thead><tr><th>Recipient</th><th>Department</th><th>Distributed</th><th>Acknowledged</th><th>Training Required</th><th>Training Done</th></tr></thead>
              <tbody>
                <tr *ngFor="let d of doc.distributions">
                  <td>{{ d.recipient?.displayName }}</td>
                  <td>{{ d.departmentName }}</td>
                  <td>{{ d.distributionDate | date:'mediumDate' }}</td>
                  <td><mat-icon [class.ack]="d.acknowledged">{{ d.acknowledged ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon></td>
                  <td>{{ d.trainingRequired ? 'Yes' : 'No' }}</td>
                  <td><mat-icon [class.done]="d.trainingCompleted" *ngIf="d.trainingRequired">{{ d.trainingCompleted ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon></td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!doc.distributions?.length">No distribution records</div>
          </div>
        </mat-tab>

        <mat-tab label="Audit Trail">
          <div class="tab-content">
            <table class="data-table" *ngIf="doc.auditTrail?.length">
              <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Comments</th></tr></thead>
              <tbody>
                <tr *ngFor="let a of doc.auditTrail">
                  <td>{{ a.timestamp | date:'medium' }}</td>
                  <td>{{ a.userName }}</td>
                  <td>{{ a.action }}</td>
                  <td>{{ a.field }}</td>
                  <td>{{ a.oldValue }}</td>
                  <td>{{ a.newValue }}</td>
                  <td>{{ a.comments }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!doc.auditTrail?.length">No audit entries</div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
    <div class="loading" *ngIf="!doc">Loading document...</div>
  `,
  styles: [`
    .detail-page { max-width: 1200px; margin: 0 auto; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .header-left { display: flex; align-items: flex-start; gap: 10px; }
    .back-btn { background: none; border: none; cursor: pointer; color: #555; display: flex; padding: 4px; }
    .doc-number { font-size: 11px; color: #5c6bc0; font-weight: 600; }
    .detail-header h2 { font-size: 16px; font-weight: 700; color: #1B3A4B; margin: 0; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .status-badge { font-size: 10px; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
    .status-badge.effective { background: #e8f5e9; color: #2e7d32; }
    .status-badge.draft { background: #f5f5f5; color: #666; }
    .status-badge.under_review { background: #fff3e0; color: #e65100; }
    .status-badge.pending_approval { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.approved { background: #e8eaf6; color: #3949ab; }
    .status-badge.superseded { background: #efebe9; color: #795548; }
    .status-badge.obsolete, .status-badge.rejected { background: #ffebee; color: #c62828; }
    .status-badge.pending, .status-badge.overdue { background: #fff3e0; color: #e65100; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .version-badge { font-size: 11px; padding: 3px 10px; border-radius: 10px; background: #e8eaf6; color: #3949ab; font-weight: 600; }
    .action-btn { border: none; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .action-btn.primary { background: #5c6bc0; color: #fff; }
    .action-btn.primary:hover { background: #3f51b5; }
    .action-btn.secondary { background: #fff; border: 1px solid #d0d5dd; color: #333; }
    .action-btn.warn { background: #fff; border: 1px solid #ef9a9a; color: #c62828; }
    .detail-tabs { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
    .tab-content { padding: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .info-card { background: #fafbfc; border: 1px solid #eee; border-radius: 6px; padding: 14px; }
    .info-card.full-width { grid-column: span 2; }
    .info-card h4 { font-size: 12px; font-weight: 600; color: #1B3A4B; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
    .info-row:last-child { border-bottom: none; }
    .info-row .lbl { color: #888; font-weight: 500; }
    .description { font-size: 12px; color: #555; line-height: 1.6; }
    .overdue { color: #c62828; font-weight: 600; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { background: #fafbfc; padding: 8px 10px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid #e5e7eb; }
    .data-table td { padding: 8px 10px; border-bottom: 1px solid #f5f5f5; }
    .ver-num { font-weight: 600; color: #5c6bc0; }
    .file-link { display: flex; align-items: center; gap: 4px; color: #5c6bc0; text-decoration: none; cursor: pointer; font-size: 11px; }
    .file-link mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .ack { color: #388e3c; font-size: 18px; }
    .done { color: #388e3c; font-size: 18px; }
    mat-icon:not(.ack):not(.done) { color: #ccc; }
    .empty { text-align: center; padding: 24px; color: #888; font-size: 12px; }
    .loading { text-align: center; padding: 40px; color: #888; }
  `],
})
export class DocDetailComponent implements OnInit {
  doc: QmsDocument | null = null;

  constructor(private route: ActivatedRoute, private docService: DocumentService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.docService.getDocumentById(id).subscribe(d => this.doc = d || null);
  }

  formatStatus(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
  isReviewOverdue(): boolean { return this.doc?.nextReviewDate ? new Date(this.doc.nextReviewDate) < new Date() : false; }

  submitForReview(): void {
    if (this.doc) this.docService.submitForReview(this.doc.id).subscribe(d => this.doc = d);
  }

  approve(): void {
    if (this.doc) this.docService.approveDocument(this.doc.id).subscribe(d => this.doc = d);
  }
}