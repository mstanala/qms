import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Nonconformance, NonconformanceService } from '../../services/nonconformance.service';

@Component({
  selector: 'qms-nc-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page" *ngIf="nc">
      <div class="page-header">
        <div><h1>{{ nc.title }}</h1><span>{{ nc.ncNumber }} &middot; {{ label(nc.ncType) }}</span></div>
        <div class="actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Status</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
        <mat-menu #statusMenu="matMenu"><button mat-menu-item *ngFor="let status of statuses" (click)="changeStatus(status)">{{ label(status) }}</button></mat-menu>
      </div>

      <mat-card>
        <mat-card-header><mat-card-title>Record Overview</mat-card-title></mat-card-header>
        <mat-card-content class="info-grid">
          <div><label>Status</label><mat-chip>{{ label(nc.status) }}</mat-chip></div>
          <div><label>Priority</label><span>{{ nc.priority }}</span></div>
          <div><label>Classification</label><span>{{ nc.classification || '-' }}</span></div>
          <div><label>Hold Status</label><span>{{ label(nc.holdStatus || 'NONE') }}</span></div>
          <div><label>Product</label><span>{{ nc.productName || '-' }}</span></div>
          <div><label>Batch</label><span>{{ nc.batchNumber || '-' }}</span></div>
          <div><label>Owner</label><span>{{ nc.owner?.displayName || '-' }}</span></div>
          <div><label>Site</label><span>{{ nc.plantSite?.name || '-' }}</span></div>
          <div class="wide"><label>Description</label><span>{{ nc.description }}</span></div>
        </mat-card-content>
      </mat-card>

      <div class="layout">
        <mat-card>
          <mat-card-header><mat-card-title>Disposition</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="dispositionForm" (ngSubmit)="submitDisposition()" class="form-grid">
              <mat-form-field appearance="outline"><mat-label>Decision</mat-label><mat-select formControlName="dispositionDecision"><mat-option value="USE_AS_IS">Use As Is</mat-option><mat-option value="REWORK">Rework</mat-option><mat-option value="REJECT">Reject</mat-option><mat-option value="RETURN_TO_SUPPLIER">Return to Supplier</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline" class="wide"><mat-label>Justification</mat-label><textarea matInput rows="3" formControlName="justification"></textarea></mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="dispositionForm.invalid"><mat-icon>approval</mat-icon> Submit Disposition</button>
            </form>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Material Hold</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="holdForm" (ngSubmit)="placeHold()" class="form-grid">
              <mat-form-field appearance="outline"><mat-label>Hold Location</mat-label><input matInput formControlName="holdLocation"></mat-form-field>
              <button mat-raised-button color="warn" type="submit"><mat-icon>lock</mat-icon> Place Hold</button>
              <button mat-stroked-button type="button" (click)="releaseHold()"><mat-icon>lock_open</mat-icon> Release Hold</button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}h1{margin:0;font-size:24px}.page-header span{color:#667085}.actions{display:flex;gap:8px}.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}.wide{grid-column:1/-1}.layout{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-top:16px}.form-grid{display:grid;gap:12px}`],
})
export class NcDetailComponent implements OnInit {
  nc: Nonconformance | null = null;
  statuses = ['IDENTIFIED', 'UNDER_REVIEW', 'INVESTIGATION', 'DISPOSITION_PENDING', 'DISPOSITION_APPROVED', 'CLOSED'];
  dispositionForm = this.fb.group({
    dispositionDecision: ['USE_AS_IS', Validators.required],
    justification: ['', Validators.required],
  });
  holdForm = this.fb.group({ holdLocation: ['Quarantine Area'] });

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private ncService: NonconformanceService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ncService.getById(id).subscribe((nc) => this.nc = nc);
  }

  changeStatus(status: string): void {
    if (!this.nc) return;
    this.ncService.transitionStatus(this.nc.id, status).subscribe((nc) => {
      this.nc = nc;
      this.snackBar.open('NC status updated', 'Dismiss', { duration: 2500 });
    });
  }

  submitDisposition(): void {
    if (!this.nc || this.dispositionForm.invalid) return;
    this.ncService.submitDisposition(this.nc.id, this.dispositionForm.getRawValue()).subscribe((nc) => {
      this.nc = nc;
      this.snackBar.open('Disposition submitted', 'Dismiss', { duration: 2500 });
    });
  }

  placeHold(): void {
    if (!this.nc) return;
    this.ncService.toggleHold(this.nc.id, { action: 'HOLD', ...this.holdForm.getRawValue() }).subscribe((nc) => {
      this.nc = nc;
      this.snackBar.open('Material hold placed', 'Dismiss', { duration: 2500 });
    });
  }

  releaseHold(): void {
    if (!this.nc) return;
    this.ncService.toggleHold(this.nc.id, { action: 'RELEASE' }).subscribe((nc) => {
      this.nc = nc;
      this.snackBar.open('Material hold released', 'Dismiss', { duration: 2500 });
    });
  }

  label(value: string): string { return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'; }
}
