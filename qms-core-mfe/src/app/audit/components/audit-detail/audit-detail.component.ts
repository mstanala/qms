import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { AuditService, Audit, AuditFinding } from '../../services/audit.service';

@Component({
  selector: 'qms-audit-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTableModule, MatMenuModule],
  template: `
    <div class="page" *ngIf="audit">
      <div class="page-header">
        <div class="header-info">
          <div class="header-top">
            <span class="audit-number">{{ audit.auditNumber }}</span>
            <span class="lifecycle-badge" [ngClass]="'lc-' + (audit.lifecycleState || 'DRAFT').toLowerCase()">
              {{ formatEnum(audit.lifecycleState || 'DRAFT') }}
            </span>
            <span class="status-badge" [ngClass]="'st-' + audit.status.toLowerCase()">
              {{ formatEnum(audit.status) }}
            </span>
            <span class="priority-badge" [ngClass]="'pr-' + (audit.priority || 'MEDIUM').toLowerCase()">
              {{ audit.priority || 'MEDIUM' }}
            </span>
          </div>
          <h1>{{ audit.title }}</h1>
          <p class="description" *ngIf="audit.description">{{ audit.description }}</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Change Status</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
        <mat-menu #statusMenu="matMenu">
          <button mat-menu-item *ngFor="let s of statuses" (click)="changeStatus(s)">{{ formatEnum(s) }}</button>
        </mat-menu>
      </div>

      <!-- Overview Grid -->
      <mat-card class="detail-card">
        <mat-card-header><mat-card-title>Audit Overview</mat-card-title></mat-card-header>
        <mat-card-content class="info-grid">
          <div><label>Audit Type</label><span>{{ formatEnum(audit.auditType) }}</span></div>
          <div><label>Category</label><span>{{ audit.category || '—' }}</span></div>
          <div><label>Frequency</label><span>{{ formatEnum(audit.frequency) || '—' }}</span></div>
          <div><label>Lead Auditor</label><span>{{ audit.leadAuditor?.displayName || '—' }}</span></div>
          <div><label>Department</label><span>{{ audit.auditeeDepartment?.name || '—' }}</span></div>
          <div><label>Plant Site</label><span>{{ audit.plantSite?.name || '—' }}</span></div>
          <div><label>Area Audited</label><span>{{ audit.areaAudited || '—' }}</span></div>
          <div><label>Standards</label><span>{{ audit.standardsReference || '—' }}</span></div>
          <div><label>Scheduled Start</label><span>{{ audit.scheduledStartDate | date:'dd-MMM-yyyy' }}</span></div>
          <div><label>Scheduled End</label><span>{{ audit.scheduledEndDate | date:'dd-MMM-yyyy' }}</span></div>
          <div><label>Actual Start</label><span>{{ audit.actualStartDate ? (audit.actualStartDate | date:'dd-MMM-yyyy') : '—' }}</span></div>
          <div><label>Actual End</label><span>{{ audit.actualEndDate ? (audit.actualEndDate | date:'dd-MMM-yyyy') : '—' }}</span></div>
        </mat-card-content>
      </mat-card>

      <!-- Scope -->
      <mat-card class="detail-card" *ngIf="audit.auditScope">
        <mat-card-header><mat-card-title>Scope</mat-card-title></mat-card-header>
        <mat-card-content><p class="text-block">{{ audit.auditScope }}</p></mat-card-content>
      </mat-card>

      <!-- Executive Summary -->
      <mat-card class="detail-card" *ngIf="audit.executiveSummary">
        <mat-card-header><mat-card-title>Executive Summary</mat-card-title></mat-card-header>
        <mat-card-content><p class="text-block">{{ audit.executiveSummary }}</p></mat-card-content>
      </mat-card>

      <!-- Findings Summary -->
      <mat-card class="detail-card" *ngIf="audit.findingsSummary">
        <mat-card-header><mat-card-title>Findings Summary</mat-card-title></mat-card-header>
        <mat-card-content><p class="text-block">{{ audit.findingsSummary }}</p></mat-card-content>
      </mat-card>

      <!-- Proposed Action -->
      <mat-card class="detail-card" *ngIf="audit.proposedAction">
        <mat-card-header><mat-card-title>Proposed Actions</mat-card-title></mat-card-header>
        <mat-card-content><p class="text-block">{{ audit.proposedAction }}</p></mat-card-content>
      </mat-card>

      <!-- Findings Table -->
      <mat-card class="detail-card">
        <mat-card-header><mat-card-title>Findings ({{ findings.length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="findings" class="full-table" *ngIf="findings.length > 0">
            <ng-container matColumnDef="findingNumber"><th mat-header-cell *matHeaderCellDef>Finding #</th><td mat-cell *matCellDef="let r">{{ r.findingNumber }}</td></ng-container>
            <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>Title</th><td mat-cell *matCellDef="let r">{{ r.title }}</td></ng-container>
            <ng-container matColumnDef="classification"><th mat-header-cell *matHeaderCellDef>Classification</th><td mat-cell *matCellDef="let r"><span class="cls-badge" [ngClass]="'cls-' + r.classification.toLowerCase()">{{ r.classification }}</span></td></ng-container>
            <ng-container matColumnDef="area"><th mat-header-cell *matHeaderCellDef>Area</th><td mat-cell *matCellDef="let r">{{ r.area || '—' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let r"><span class="status-badge" [ngClass]="'fst-' + r.status.toLowerCase()">{{ formatEnum(r.status) }}</span></td></ng-container>
            <ng-container matColumnDef="responseDueDate"><th mat-header-cell *matHeaderCellDef>Due Date</th><td mat-cell *matCellDef="let r">{{ r.responseDueDate ? (r.responseDueDate | date:'dd-MMM-yyyy') : '—' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="findingCols"></tr>
            <tr mat-row *matRowDef="let row; columns: findingCols;"></tr>
          </table>
          <p *ngIf="findings.length === 0" class="empty-state">No findings recorded for this audit.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 20px 24px; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 16px;
    }
    .header-info { flex: 1; min-width: 0; }
    .header-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .audit-number { font-size: 13px; font-weight: 600; color: #2C5F7C; }
    .page-header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1f2937; }
    .description { color: #667085; font-size: 13px; margin: 0; line-height: 1.5; }
    .actions { display: flex; gap: 8px; flex-shrink: 0; }

    .detail-card { margin-bottom: 16px; border-radius: 8px; }
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px; padding-top: 8px;
    }
    .info-grid label {
      display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px;
      text-transform: uppercase; font-weight: 500; letter-spacing: 0.03em;
    }
    .info-grid span { font-size: 13px; color: #1f2937; }

    .text-block { color: #374151; font-size: 13px; line-height: 1.65; margin: 0; white-space: pre-line; }

    .full-table { width: 100%; }
    .full-table th.mat-mdc-header-cell {
      font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;
      letter-spacing: 0.04em; background: #f8fafc;
    }
    .full-table td.mat-mdc-cell { font-size: 13px; color: #374151; }

    .empty-state { color: #94a3b8; font-size: 13px; padding: 20px 0; text-align: center; }

    .status-badge, .lifecycle-badge, .priority-badge, .cls-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 500;
    }

    .st-planned { background: #e2e8f0; color: #475569; }
    .st-scheduled { background: #dbeafe; color: #1e40af; }
    .st-in_progress { background: #fef3c7; color: #92400e; }
    .st-report_drafting { background: #fed7aa; color: #9a3412; }
    .st-under_review { background: #e9d5ff; color: #6b21a8; }
    .st-completed { background: #d1fae5; color: #065f46; }
    .st-cancelled { background: #fecaca; color: #991b1b; }

    .lc-draft { background: #f1f5f9; color: #64748b; }
    .lc-active { background: #dbeafe; color: #1e40af; }
    .lc-under_review { background: #e9d5ff; color: #6b21a8; }
    .lc-approved { background: #d1fae5; color: #065f46; }
    .lc-superseded { background: #fef3c7; color: #92400e; }
    .lc-retired { background: #e2e8f0; color: #475569; }

    .pr-critical { background: #fecaca; color: #991b1b; }
    .pr-high { background: #fed7aa; color: #9a3412; }
    .pr-medium { background: #fef3c7; color: #92400e; }
    .pr-low { background: #d1fae5; color: #065f46; }

    .cls-critical { background: #fecaca; color: #991b1b; }
    .cls-major { background: #fed7aa; color: #9a3412; }
    .cls-minor { background: #fef3c7; color: #92400e; }
    .cls-observation { background: #e2e8f0; color: #475569; }
    .cls-ofi { background: #d1fae5; color: #065f46; }

    .fst-open { background: #fecaca; color: #991b1b; }
    .fst-capa_assigned { background: #dbeafe; color: #1e40af; }
    .fst-in_progress { background: #fef3c7; color: #92400e; }
    .fst-verification { background: #e9d5ff; color: #6b21a8; }
    .fst-closed { background: #d1fae5; color: #065f46; }
  `],
})
export class AuditDetailComponent implements OnInit {
  audit: Audit | null = null;
  findings: AuditFinding[] = [];
  findingCols = ['findingNumber', 'title', 'classification', 'area', 'status', 'responseDueDate'];
  statuses = ['PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'REPORT_DRAFTING', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];

  constructor(private route: ActivatedRoute, private auditService: AuditService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.auditService.getAudit(id).subscribe(a => this.audit = a);
    this.auditService.listFindings(id).subscribe(f => this.findings = f);
  }

  changeStatus(status: string): void {
    if (!this.audit) return;
    this.auditService.transitionStatus(this.audit.id, status).subscribe(a => this.audit = a);
  }

  formatEnum(value: string | null): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}