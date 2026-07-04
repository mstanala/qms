import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Attachment, RecordSummary, ToolsApiService } from './tools-api.service';

@Component({
  selector: 'app-tools-import-export',
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
          <h1>Import / Export</h1>
          <p>Export backend records and manage record attachments through documented APIs.</p>
        </div>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="layout">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Export Records</mat-card-title>
            <mat-card-subtitle>GET /api/v1/capas, /deviations, /change-requests</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="exportForm" (ngSubmit)="exportRecords()" class="stack-form">
              <mat-form-field appearance="outline">
                <mat-label>Record Type</mat-label>
                <mat-select formControlName="recordType">
                  <mat-option value="CAPA">CAPA</mat-option>
                  <mat-option value="DEVIATION">Deviation</mat-option>
                  <mat-option value="CHANGE_CONTROL">Change Control</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Format</mat-label>
                <mat-select formControlName="format">
                  <mat-option value="json">JSON</mat-option>
                  <mat-option value="csv">CSV</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit">
                <mat-icon>download</mat-icon>
                Export
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Record Attachment Upload</mat-card-title>
            <mat-card-subtitle>POST /api/v1/attachments</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="attachmentForm" (ngSubmit)="uploadAttachment()" class="stack-form">
              <mat-form-field appearance="outline">
                <mat-label>Record Type</mat-label>
                <mat-select formControlName="recordType" (selectionChange)="loadRecords($event.value)">
                  <mat-option value="CAPA">CAPA</mat-option>
                  <mat-option value="DEVIATION">Deviation</mat-option>
                  <mat-option value="CHANGE_CONTROL">Change Control</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Record</mat-label>
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
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <input matInput formControlName="category" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <input matInput formControlName="description" />
              </mat-form-field>
              <label class="file-picker">
                <input type="file" (change)="selectFile($event)" />
                <mat-icon>upload_file</mat-icon>
                <span>{{ selectedFile?.name || 'Choose file' }}</span>
              </label>
              <button mat-raised-button color="primary" type="submit" [disabled]="attachmentForm.invalid || !selectedFile || isUploading">
                <mat-icon>upload</mat-icon>
                {{ isUploading ? 'Uploading...' : 'Upload Attachment' }}
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="attachment-card">
        <mat-card-header>
          <mat-card-title>Attachments</mat-card-title>
          <mat-card-subtitle>GET /api/v1/attachments and attachment download URL endpoint</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="attachment-list" *ngIf="attachments.length; else noAttachments">
            <div class="attachment-row" *ngFor="let attachment of attachments; trackBy: trackById">
              <mat-icon>attach_file</mat-icon>
              <div>
                <strong>{{ attachment.fileName }}</strong>
                <small>{{ attachment.category || 'Attachment' }} · {{ attachment.fileSize || 0 }} bytes</small>
              </div>
              <button mat-stroked-button (click)="downloadAttachment(attachment)">
                <mat-icon>download</mat-icon>
                Download
              </button>
            </div>
          </div>
          <ng-template #noAttachments>
            <div class="no-data">Select a record to load attachments.</div>
          </ng-template>
        </mat-card-content>
      </mat-card>

      <mat-card class="notice-card">
        <mat-icon>info</mat-icon>
        <span>The backend documentation does not define bulk data import endpoints. This screen implements the documented export and attachment upload/download APIs only.</span>
      </mat-card>
    </section>
  `,
  styles: [`
    .tools-page { max-width: 1440px; margin: 0 auto; }
    .page-title { margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .layout { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    mat-card-title { font-size: 16px; color: #1B3A4B; letter-spacing: 0; }
    .stack-form { display: grid; gap: 12px; }
    mat-form-field { width: 100%; }
    .file-picker { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 12px; border: 1px dashed #98a2b3; border-radius: 6px; color: #344054; cursor: pointer; }
    .file-picker input { display: none; }
    .file-picker mat-icon { color: #2C5F7C; }
    .attachment-card, .notice-card { margin-top: 14px; }
    .attachment-list { display: grid; gap: 10px; }
    .attachment-row { display: grid; grid-template-columns: 28px 1fr auto; gap: 10px; align-items: center; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
    .attachment-row > mat-icon { color: #2C5F7C; }
    .attachment-row strong { display: block; color: #1f2937; font-size: 13px; }
    .attachment-row small { display: block; color: #667085; font-size: 12px; }
    .notice-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; color: #344054; background: #fffbeb; border-color: #fedf89; }
    .notice-card mat-icon { color: #b54708; }
    .no-data { color: #667085; font-size: 13px; padding: 12px; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
  `],
})
export class ToolsImportExportComponent implements OnInit {
  records: RecordSummary[] = [];
  attachments: Attachment[] = [];
  selectedFile: File | null = null;
  isLoading = false;
  isUploading = false;

  exportForm = this.fb.group({
    recordType: ['CAPA', Validators.required],
    format: ['json', Validators.required],
  });

  attachmentForm = this.fb.group({
    recordType: ['CAPA', Validators.required],
    recordId: ['', Validators.required],
    category: ['GENERAL'],
    description: [''],
  });

  constructor(
    private fb: FormBuilder,
    private api: ToolsApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRecords('CAPA');
  }

  loadRecords(recordType: 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL'): void {
    this.records = [];
    this.attachments = [];
    this.attachmentForm.patchValue({ recordId: '' });
    this.api.getRecords(recordType, 100).subscribe({
      next: (page) => this.records = this.api.toRecordSummaries(recordType, page),
      error: () => this.snackBar.open('Unable to load records', 'Dismiss', { duration: 3500 }),
    });
  }

  selectRecord(record: RecordSummary): void {
    this.attachmentForm.patchValue({ recordType: record.type, recordId: record.id });
    this.loadAttachments();
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  exportRecords(): void {
    const raw = this.exportForm.getRawValue();
    const recordType = (raw.recordType || 'CAPA') as 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL';
    this.isLoading = true;
    this.api.getRecords(recordType, 500).subscribe({
      next: (page) => {
        this.isLoading = false;
        const rows = page.content || [];
        if (raw.format === 'csv') {
          this.download(`${recordType.toLowerCase()}-export`, 'csv', this.toCsv(rows), 'text/csv');
        } else {
          this.download(`${recordType.toLowerCase()}-export`, 'json', JSON.stringify(rows, null, 2), 'application/json');
        }
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to export records', 'Dismiss', { duration: 4000 });
      },
    });
  }

  uploadAttachment(): void {
    if (this.attachmentForm.invalid || !this.selectedFile || this.isUploading) return;
    const raw = this.attachmentForm.getRawValue();
    this.isUploading = true;
    this.api.uploadAttachment({
      file: this.selectedFile,
      recordType: raw.recordType || 'CAPA',
      recordId: raw.recordId || '',
      category: raw.category || undefined,
      description: raw.description || undefined,
    }).subscribe({
      next: () => {
        this.isUploading = false;
        this.selectedFile = null;
        this.snackBar.open('Attachment uploaded', 'Dismiss', { duration: 2500 });
        this.loadAttachments();
      },
      error: () => {
        this.isUploading = false;
        this.snackBar.open('Unable to upload attachment', 'Dismiss', { duration: 4000 });
      },
    });
  }

  loadAttachments(): void {
    const raw = this.attachmentForm.getRawValue();
    if (!raw.recordId) return;
    this.api.listAttachments(raw.recordType || 'CAPA', raw.recordId).subscribe({
      next: (attachments) => this.attachments = attachments,
      error: () => this.attachments = [],
    });
  }

  downloadAttachment(attachment: Attachment): void {
    this.api.getDownloadUrl(attachment.id).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => this.snackBar.open('Unable to get download URL', 'Dismiss', { duration: 3500 }),
    });
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private toCsv(rows: Record<string, unknown>[]): string {
    const headers = Array.from(rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()));
    return [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n');
  }

  private download(fileName: string, extension: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
