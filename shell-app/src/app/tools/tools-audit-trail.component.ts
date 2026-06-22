import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditTrailEntry, RecordSummary, ToolsApiService } from './tools-api.service';

@Component({
  selector: 'app-tools-audit-trail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="tools-page">
      <div class="page-title">
        <div>
          <h1>Audit Trail Viewer</h1>
          <p>Inspect immutable audit events for CAPA, Deviation, and Change Control records.</p>
        </div>
      </div>

      <mat-card class="filter-card">
        <mat-card-header>
          <mat-card-title>Record Lookup</mat-card-title>
          <mat-card-subtitle>GET /api/v1/audit-trail and record-specific audit endpoint</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="filterForm" (ngSubmit)="loadAuditTrail()" class="filter-form">
            <mat-form-field appearance="outline">
              <mat-label>Record Type</mat-label>
              <mat-select formControlName="recordType" (selectionChange)="loadRecords($event.value)">
                <mat-option value="CAPA">CAPA</mat-option>
                <mat-option value="DEVIATION">Deviation</mat-option>
                <mat-option value="CHANGE_CONTROL">Change Control</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Recent Records</mat-label>
              <mat-select (selectionChange)="selectRecord($event.value)">
                <mat-option *ngFor="let record of records" [value]="record">
                  {{ record.number }} · {{ record.title }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Record ID</mat-label>
              <input matInput formControlName="recordId" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="filterForm.invalid || isLoading">
              <mat-icon>fact_check</mat-icon>
              Load Audit Trail
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="audit-list">
        <mat-card class="audit-card" *ngFor="let entry of entries; trackBy: trackById">
          <div class="audit-head">
            <div>
              <strong>{{ entry.action }}</strong>
              <span>{{ entry.recordNumber || entry.recordId }}</span>
            </div>
            <time>{{ entry.timestamp | date:'medium' }}</time>
          </div>
          <div class="audit-body">
            <div><label>User</label><span>{{ entry.userName || entry.userId || 'System' }}</span></div>
            <div><label>Field</label><span>{{ entry.fieldName || '-' }}</span></div>
            <div><label>Old Value</label><span>{{ entry.oldValue || '-' }}</span></div>
            <div><label>New Value</label><span>{{ entry.newValue || '-' }}</span></div>
            <div><label>IP Address</label><span>{{ entry.ipAddress || '-' }}</span></div>
            <div><label>Reason</label><span>{{ entry.reasonForChange || entry.comments || '-' }}</span></div>
          </div>
        </mat-card>
        <mat-card class="empty-card" *ngIf="!isLoading && entries.length === 0">
          <mat-icon>fact_check</mat-icon>
          <span>No audit entries loaded</span>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .tools-page { max-width: 1440px; margin: 0 auto; }
    .page-title { margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .filter-card { margin-bottom: 14px; }
    .filter-form { display: grid; grid-template-columns: 180px minmax(260px, 1fr) minmax(260px, 1fr) auto; gap: 12px; align-items: start; }
    .filter-form button { height: 56px; }
    .audit-list { display: grid; gap: 10px; }
    .audit-card { padding: 0; overflow: hidden; }
    .audit-head { display: flex; justify-content: space-between; gap: 12px; padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .audit-head strong { display: block; color: #1B3A4B; font-size: 14px; }
    .audit-head span, .audit-head time { color: #667085; font-size: 12px; }
    .audit-body { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 14px; }
    .audit-body label { display: block; color: #667085; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; }
    .audit-body span { color: #1f2937; font-size: 13px; word-break: break-word; }
    .empty-card { min-height: 160px; display: grid; place-items: center; color: #667085; gap: 8px; }
    .empty-card mat-icon { color: #98a2b3; font-size: 32px; width: 32px; height: 32px; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1100px) {
      .filter-form, .audit-body { grid-template-columns: 1fr; }
      .filter-form button { height: 44px; }
    }
  `],
})
export class ToolsAuditTrailComponent implements OnInit {
  records: RecordSummary[] = [];
  entries: AuditTrailEntry[] = [];
  isLoading = false;

  filterForm = this.fb.group({
    recordType: ['CAPA', Validators.required],
    recordId: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ToolsApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const recordType = this.normalizeRecordType(params.get('recordType')) || 'CAPA';
      const recordId = params.get('recordId') || '';

      this.filterForm.patchValue({ recordType, recordId });
      this.loadRecords(recordType, Boolean(recordId));

      if (recordId) {
        this.loadAuditTrail();
      }
    });
  }

  loadRecords(recordType: 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL', preserveSelection = false): void {
    this.records = [];
    if (!preserveSelection) {
      this.entries = [];
      this.filterForm.patchValue({ recordId: '' });
    }
    this.api.getRecords(recordType, 50).subscribe({
      next: (page) => this.records = this.api.toRecordSummaries(recordType, page),
      error: () => this.snackBar.open('Unable to load recent records', 'Dismiss', { duration: 3500 }),
    });
  }

  selectRecord(record: RecordSummary): void {
    this.filterForm.patchValue({ recordType: record.type, recordId: record.id });
  }

  loadAuditTrail(): void {
    if (this.filterForm.invalid) return;
    const raw = this.filterForm.getRawValue();
    this.isLoading = true;
    this.api.searchAuditTrail(raw.recordType || 'CAPA', raw.recordId || '').subscribe({
      next: (page) => {
        this.entries = page.content || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load audit trail', 'Dismiss', { duration: 4000 });
      },
    });
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private normalizeRecordType(value: string | null): 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL' | null {
    if (value === 'CAPA' || value === 'DEVIATION' || value === 'CHANGE_CONTROL') return value;
    return null;
  }
}
