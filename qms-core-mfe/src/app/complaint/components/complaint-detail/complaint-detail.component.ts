import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Complaint, ComplaintService } from '../../services/complaint.service';

@Component({
  selector: 'qms-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page" *ngIf="complaint">
      <div class="page-header">
        <div><h1>{{ complaint.title }}</h1><span>{{ complaint.complaintNumber }} &middot; {{ label(complaint.complaintType) }}</span></div>
        <div class="actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Status</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
        <mat-menu #statusMenu="matMenu"><button mat-menu-item *ngFor="let status of statuses" (click)="changeStatus(status)">{{ label(status) }}</button></mat-menu>
      </div>
      <mat-card>
        <mat-card-header><mat-card-title>Complaint Overview</mat-card-title></mat-card-header>
        <mat-card-content class="info-grid">
          <div><label>Status</label><mat-chip>{{ label(complaint.status) }}</mat-chip></div>
          <div><label>Priority</label><span>{{ complaint.priority }}</span></div>
          <div><label>Source</label><span>{{ label(complaint.source) }}</span></div>
          <div><label>Classification</label><span>{{ complaint.classification || '-' }}</span></div>
          <div><label>Reporter</label><span>{{ complaint.reporterName || '-' }}</span></div>
          <div><label>Received</label><span>{{ complaint.receivedDate | date:'mediumDate' }}</span></div>
          <div><label>Product</label><span>{{ complaint.productName || '-' }}</span></div>
          <div><label>Batch</label><span>{{ complaint.batchNumber || '-' }}</span></div>
          <div><label>Owner</label><span>{{ complaint.owner?.displayName || '-' }}</span></div>
          <div><label>Site</label><span>{{ complaint.plantSite?.name || '-' }}</span></div>
          <div class="wide"><label>Description</label><span>{{ complaint.description }}</span></div>
        </mat-card-content>
      </mat-card>
      <mat-card class="investigation-card">
        <mat-card-header><mat-card-title>Investigation Summary</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="investigationForm" (ngSubmit)="saveInvestigation()" class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Classification</mat-label><mat-select formControlName="classification"><mat-option value="CRITICAL">Critical</mat-option><mat-option value="MAJOR">Major</mat-option><mat-option value="MINOR">Minor</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Root Cause</mat-label><textarea matInput rows="3" formControlName="rootCause"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Conclusion / Customer Response Basis</mat-label><textarea matInput rows="3" formControlName="conclusion"></textarea></mat-form-field>
            <button mat-raised-button color="primary" type="submit"><mat-icon>save</mat-icon> Save Investigation</button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}h1{margin:0;font-size:24px}.page-header span{color:#667085}.actions{display:flex;gap:8px}.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}.wide{grid-column:1/-1}.investigation-card{margin-top:16px}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;align-items:center}`],
})
export class ComplaintDetailComponent implements OnInit {
  complaint: Complaint | null = null;
  statuses = ['RECEIVED', 'TRIAGE', 'INVESTIGATION', 'RESPONSE_PENDING', 'CLOSED'];
  investigationForm = this.fb.group({
    classification: ['MAJOR'],
    rootCause: [''],
    conclusion: [''],
  });

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private complaintService: ComplaintService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.complaintService.getById(id).subscribe((complaint) => {
      this.complaint = complaint;
      this.investigationForm.patchValue({
        classification: complaint.classification || 'MAJOR',
        rootCause: complaint.rootCause || '',
        conclusion: complaint.conclusion || '',
      });
    });
  }

  changeStatus(status: string): void {
    if (!this.complaint) return;
    this.complaintService.transitionStatus(this.complaint.id, status).subscribe((complaint) => {
      this.complaint = complaint;
      this.snackBar.open('Complaint status updated', 'Dismiss', { duration: 2500 });
    });
  }

  saveInvestigation(): void {
    if (!this.complaint) return;
    this.complaintService.update(this.complaint.id, this.investigationForm.getRawValue()).subscribe((complaint) => {
      this.complaint = complaint;
      this.snackBar.open('Investigation updated', 'Dismiss', { duration: 2500 });
    });
  }

  label(value: string): string { return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'; }
}
