import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { AttachmentFile, DocumentService } from '../../services/document.service';
import { QmsDocument } from '../../models/document.model';

@Component({
  selector: 'doc-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTabsModule],
  template: `
    <div class="detail-page" *ngIf="doc">
      <div class="detail-header">
        <div class="header-left">
          <button class="back-btn" type="button" (click)="backToList()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <div class="doc-number">{{ doc.documentNumber }}</div>
            <h2>{{ doc.title }}</h2>
          </div>
        </div>
        <div class="header-right">
          <span class="status-badge" [ngClass]="doc.status.toLowerCase()">{{ formatStatus(doc.status) }}</span>
          <span class="version-badge">v{{ doc.currentVersion }}</span>
          <button class="action-btn primary" *ngIf="doc.status === 'DRAFT'" (click)="submitForReview()">Submit for Review</button>
          <button class="action-btn primary" *ngIf="canReviewDocument()" (click)="markReviewed()">Mark Reviewed</button>
          <button class="action-btn primary" *ngIf="canApproveDocument()" (click)="approve()">Approve Document</button>
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
              <div class="info-card full-width">
                <h4>Review & Approval Routing</h4>
                <div class="info-row">
                  <span class="lbl">Current Step</span>
                  <span>{{ doc.currentWorkflowStep || formatStatus(doc.status) }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Current Candidate Roles</span>
                  <span>{{ formatRoles(doc.currentCandidateRoles) }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Current Candidate Users</span>
                  <span>{{ formatUsers(doc.currentCandidateUsers) }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Reviewers</span>
                  <span>{{ formatUsers(doc.reviewCandidateUsers) }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Final Approvers</span>
                  <span>{{ formatUsers(doc.approvalCandidateUsers) }}</span>
                </div>
              </div>
              <div class="info-card full-width" *ngIf="doc.description">
                <h4>Description</h4>
                <p class="description">{{ doc.description }}</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Files ({{ attachments.length }})">
          <div class="tab-content">
            <table class="data-table" *ngIf="attachments.length">
              <thead><tr><th>File Name</th><th>Type</th><th>Size</th><th>Category</th><th>Uploaded By</th><th>Uploaded</th><th>Actions</th></tr></thead>
              <tbody>
                <tr *ngFor="let file of attachments">
                  <td>
                    <div class="file-name">
                      <mat-icon>{{ fileIcon(file.fileType) }}</mat-icon>
                      <span>{{ file.fileName }}</span>
                    </div>
                  </td>
                  <td>{{ file.fileType || '-' }}</td>
                  <td>{{ formatFileSize(file.fileSize) }}</td>
                  <td>{{ formatStatus(file.category) }}</td>
                  <td>{{ file.uploadedBy?.displayName || '-' }}</td>
                  <td>{{ file.uploadedDate | date:'medium' }}</td>
                  <td>
                    <div class="file-actions">
                      <button type="button" class="icon-action" title="View file" (click)="openAttachment(file, false)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button type="button" class="icon-action" title="Download file" (click)="openAttachment(file, true)">
                        <mat-icon>download</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!attachments.length">No files uploaded for this document</div>
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

        <mat-tab label="Approvals ({{ doc.approvals?.length || 0 }})">
          <div class="tab-content">
            <table class="data-table" *ngIf="doc.approvals?.length">
              <thead><tr><th>Order</th><th>Role</th><th>Approver</th><th>Decision</th><th>Date</th><th>Comments</th></tr></thead>
              <tbody>
                <tr *ngFor="let approval of doc.approvals">
                  <td>{{ approval.approvalOrder }}</td>
                  <td>{{ approval.role }}</td>
                  <td>{{ approval.approver?.displayName || '-' }}</td>
                  <td><span class="status-badge" [ngClass]="approval.decision.toLowerCase()">{{ formatStatus(approval.decision) }}</span></td>
                  <td>{{ approval.decisionDate | date:'medium' }}</td>
                  <td>{{ approval.comments || '-' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty" *ngIf="!doc.approvals?.length">No approval decisions recorded</div>
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
    .file-name { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #1B3A4B; }
    .file-name mat-icon { color: #5c6bc0; font-size: 18px; width: 18px; height: 18px; }
    .file-actions { display: flex; align-items: center; gap: 6px; }
    .icon-action { width: 30px; height: 30px; border: 1px solid #d0d5dd; border-radius: 4px; background: #fff; color: #1B3A4B; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    .icon-action:hover { background: #f0f4ff; border-color: #5c6bc0; color: #5c6bc0; }
    .icon-action mat-icon { font-size: 17px; width: 17px; height: 17px; }
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
  attachments: AttachmentFile[] = [];
  actionInProgress = false;

  constructor(private route: ActivatedRoute, private router: Router, private docService: DocumentService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.docService.getDocumentById(id).subscribe(d => this.doc = d || null);
      this.loadAttachments(id);
    }
  }

  backToList(): void {
    this.router.navigate(['/documents/list']);
  }

  formatStatus(val: string): string { return val?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''; }
  formatRoles(roles?: string[]): string { return roles?.length ? roles.map(role => this.formatStatus(role)).join(', ') : '-'; }
  formatUsers(users?: { displayName: string }[]): string { return users?.length ? users.map(user => user.displayName).join(', ') : '-'; }
  isReviewOverdue(): boolean { return this.doc?.nextReviewDate ? new Date(this.doc.nextReviewDate) < new Date() : false; }

  submitForReview(): void {
    if (!this.doc || this.actionInProgress) return;
    this.actionInProgress = true;
    this.docService.submitForReview(this.doc.id).subscribe({
      next: d => this.doc = d,
      complete: () => this.actionInProgress = false,
      error: () => this.actionInProgress = false,
    });
  }

  markReviewed(): void {
    if (!this.doc || this.actionInProgress) return;
    const comments = window.prompt('Review comments', 'Reviewed and ready for QA approval');
    if (comments === null) return;
    this.actionInProgress = true;
    this.docService.markReviewed(this.doc.id, comments).subscribe({
      next: d => this.doc = d,
      complete: () => this.actionInProgress = false,
      error: () => this.actionInProgress = false,
    });
  }

  approve(): void {
    if (!this.doc || this.actionInProgress) return;
    const comments = window.prompt('Approval comments', 'Approved for release');
    if (comments === null) return;
    this.actionInProgress = true;
    this.docService.approveDocument(this.doc.id, comments).subscribe({
      next: d => this.doc = d,
      complete: () => this.actionInProgress = false,
      error: () => this.actionInProgress = false,
    });
  }

  canReviewDocument(): boolean {
    if (!this.doc || !['PENDING_REVIEW', 'UNDER_REVIEW'].includes(this.doc.status)) return false;
    return this.isCurrentCandidateUser() || this.hasAnyRole(['DOC_CONTROLLER', 'QA_REVIEWER', 'VAULT_ADMIN']) || this.isSystemAdmin();
  }

  canApproveDocument(): boolean {
    if (!this.doc || this.doc.status !== 'PENDING_APPROVAL') return false;
    return this.isCurrentCandidateUser() || this.hasAnyRole(['QA_APPROVER', 'VAULT_ADMIN']) || this.isSystemAdmin();
  }

  openAttachment(file: AttachmentFile, download: boolean): void {
    this.docService.getAttachmentContent(file.id, download).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName || 'attachment';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank', 'noopener');
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  fileIcon(fileType?: string): string {
    if (!fileType) return 'insert_drive_file';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'table_chart';
    return 'insert_drive_file';
  }

  private loadAttachments(documentId: string): void {
    this.docService.getAttachments('DOCUMENT', documentId).subscribe({
      next: files => this.attachments = files,
      error: () => this.attachments = [],
    });
  }

  private isCurrentCandidateUser(): boolean {
    const userId = this.getCurrentUser()?.id;
    return !!userId && !!this.doc?.currentCandidateUsers?.some(user => user.id === userId);
  }

  private hasAnyRole(roleCodes: string[]): boolean {
    const roles = this.getCurrentUser()?.roles || [];
    return roles
      .map((role: any) => typeof role === 'string' ? role : role.code)
      .filter(Boolean)
      .some((code: string) => roleCodes.includes(code));
  }

  private isSystemAdmin(): boolean {
    return this.getCurrentUser()?.userType === 'SYSTEM_ADMIN';
  }

  private getCurrentUser(): any {
    const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.user || null;
    } catch {
      return null;
    }
  }
}
