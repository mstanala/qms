import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditService } from '../../services/audit.service';
import { CoreLookupService, PlantSiteOption, UserOption } from '../../../shared/core-lookup.service';

@Component({
  selector: 'qms-audit-plan-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <div class="form-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1>Create Audit Plan</h1>
            <p class="subtitle">Define an annual audit plan for scheduling audits</p>
          </div>
        </div>
      </div>

      <mat-card class="form-card">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Plan Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g., Annual Internal Audit Plan 2026">
              <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"
                placeholder="Describe the scope and objectives of this audit plan"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Plan Year</mat-label>
              <mat-select formControlName="planYear">
                <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('planYear')?.hasError('required')">Year is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Audit Type</mat-label>
              <mat-select formControlName="auditType">
                <mat-option value="INTERNAL">Internal</mat-option>
                <mat-option value="EXTERNAL">External</mat-option>
                <mat-option value="SUPPLIER">Supplier</mat-option>
                <mat-option value="SELF_INSPECTION">Self Inspection</mat-option>
                <mat-option value="REGULATORY_INSPECTION">Regulatory Inspection</mat-option>
                <mat-option value="FOR_CAUSE">For Cause</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('auditType')?.hasError('required')">Audit type is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Owner</mat-label>
              <mat-select formControlName="ownerId">
                <mat-option *ngFor="let u of users" [value]="u.id">{{ u.displayName || u.username }}</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('ownerId')?.hasError('required')">Owner is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Plant Site</mat-label>
              <mat-select formControlName="plantSiteId">
                <mat-option *ngFor="let ps of plantSites" [value]="ps.id">{{ ps.name }}</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('plantSiteId')?.hasError('required')">Plant site is required</mat-error>
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-stroked-button type="button" (click)="goBack()">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting">
              <mat-icon>save</mat-icon> Create Plan
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #2C5F7C; margin: 0; }
    .subtitle { font-size: 14px; color: #666; margin: 2px 0 0; }
    .form-card { padding: 24px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
  `],
})
export class AuditPlanFormComponent implements OnInit {
  form: FormGroup;
  users: UserOption[] = [];
  plantSites: PlantSiteOption[] = [];
  years: number[] = [];
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private lookup: CoreLookupService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    const y = new Date().getFullYear();
    this.years = [y - 1, y, y + 1, y + 2];
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      planYear: [y, Validators.required],
      auditType: ['INTERNAL', Validators.required],
      ownerId: ['', Validators.required],
      plantSiteId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.lookup.users().subscribe(r => this.users = r.content);
    this.lookup.plantSites().subscribe(r => this.plantSites = r);
  }

  goBack(): void {
    this.router.navigate(['/audit/plans']);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.auditService.createPlan(this.form.value).subscribe({
      next: (plan) => {
        this.snackBar.open(`Audit Plan ${plan.planNumber} created`, 'OK', { duration: 4000 });
        this.router.navigate(['/audit/plans']);
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to create audit plan', 'OK', { duration: 4000 });
      },
    });
  }
}
