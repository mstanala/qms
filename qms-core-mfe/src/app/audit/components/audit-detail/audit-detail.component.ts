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
        <div>
          <h1>{{ audit.title }}</h1>
          <span class="subtitle">{{ audit.auditNumber }} &middot; {{ audit.auditType | titlecase }}</span>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Change Status</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
        <mat-menu #statusMenu="matMenu">
          <button mat-menu-item *ngFor="let s of statuses" (click)="changeStatus(s)">{{ s }}</button>
        </mat-menu>
      </div>

      <mat-card class="overview-card">
        <mat-card-header><mat-card-title>Overview</mat-card-title></mat-card-header>
        <mat-card-content class="info-grid">
          <div><label>Status</label><mat-chip [class]="'chip-' + audit.status.toLowerCase()">{{ audit.status }}</mat-chip></div>
          <div><label>Priority</label><span>{{ audit.priority || 'MEDIUM' }}</span></div>
          <div><label>Lead Auditor</label><span>{{ audit.leadAuditor?.displayName || '—' }}</span></div>
          <div><label>Plant Site</label><span>{{ audit.plantSite?.name || '—' }}</span></div>
          <div><label>Scheduled Start</label><span>{{ audit.scheduledStartDate | date:'mediumDate' }}</span></div>
          <div><label>Scheduled End</label><span>{{ audit.scheduledEndDate | date:'mediumDate' }}</span></div>
          <div><label>Actual Start</label><span>{{ audit.actualStartDate ? (audit.actualStartDate | date:'mediumDate') : '—' }}</span></div>
          <div><label>Actual End</label><span>{{ audit.actualEndDate ? (audit.actualEndDate | date:'mediumDate') : '—' }}</span></div>
          <div><label>Area Audited</label><span>{{ audit.areaAudited || '—' }}</span></div>
          <div><label>Standards</label><span>{{ audit.standardsReference || '—' }}</span></div>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="audit.auditScope" style="margin-top:16px">
        <mat-card-header><mat-card-title>Scope</mat-card-title></mat-card-header>
        <mat-card-content><p>{{ audit.auditScope }}</p></mat-card-content>
      </mat-card>

      <mat-card class="findings-card">
        <mat-card-header><mat-card-title>Findings ({{ findings.length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="findings" class="full-table" *ngIf="findings.length > 0">
            <ng-container matColumnDef="findingNumber"><th mat-header-cell *matHeaderCellDef>Finding #</th><td mat-cell *matCellDef="let r">{{ r.findingNumber }}</td></ng-container>
            <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>Title</th><td mat-cell *matCellDef="let r">{{ r.title }}</td></ng-container>
            <ng-container matColumnDef="classification"><th mat-header-cell *matHeaderCellDef>Class</th><td mat-cell *matCellDef="let r"><mat-chip [class]="'cls-' + r.classification.toLowerCase()">{{ r.classification }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="area"><th mat-header-cell *matHeaderCellDef>Area</th><td mat-cell *matCellDef="let r">{{ r.area || '—' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let r">{{ r.status }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="findingCols"></tr>
            <tr mat-row *matRowDef="let row; columns: findingCols;"></tr>
          </table>
          <p *ngIf="findings.length === 0" style="color:#666;padding:16px">No findings recorded for this audit.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page{padding:24px} .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px}
    .page-header h1{margin:0;font-size:22px} .subtitle{color:#666;font-size:14px} .actions{display:flex;gap:8px}
    .info-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;padding-top:8px}
    .info-grid label{display:block;font-size:12px;color:#888;margin-bottom:2px;text-transform:uppercase}
    .full-table{width:100%} .findings-card{margin-top:16px}
    .cls-critical{background:#f44336!important;color:#fff!important} .cls-major{background:#ff9800!important;color:#fff!important}
    .cls-minor{background:#ffeb3b!important} .cls-observation{background:#e0e0e0!important} .cls-ofi{background:#c8e6c9!important}
    .chip-planned{background:#e0e0e0!important} .chip-scheduled{background:#bbdefb!important}
    .chip-in_progress{background:#fff9c4!important} .chip-report_drafting{background:#ffe0b2!important}
    .chip-under_review{background:#e1bee7!important} .chip-completed{background:#c8e6c9!important}
    .chip-cancelled{background:#ffcdd2!important}
  `],
})
export class AuditDetailComponent implements OnInit {
  audit: Audit | null = null;
  findings: AuditFinding[] = [];
  findingCols = ['findingNumber', 'title', 'classification', 'area', 'status'];
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
}
