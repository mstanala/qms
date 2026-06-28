import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { CoreLookupService, DepartmentOption, PlantSiteOption, UserOption } from '../../../shared/core-lookup.service';
import { ComplaintService } from '../../services/complaint.service';

@Component({
  selector: 'qms-complaint-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header"><div><h1>New Complaint</h1><span>Capture complaint intake, reporter, product, and ownership details.</span></div><button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button></div>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card>
          <mat-card-header><mat-card-title>Complaint Intake</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"><mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select formControlName="complaintType"><mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option></mat-select><mat-error *ngIf="form.get('complaintType')?.hasError('required')">Type is required</mat-error></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Source</mat-label><mat-select formControlName="source"><mat-option value="CUSTOMER">Customer</mat-option><mat-option value="DISTRIBUTOR">Distributor</mat-option><mat-option value="PATIENT">Patient</mat-option><mat-option value="HEALTHCARE_PROVIDER">Healthcare Provider</mat-option><mat-option value="INTERNAL">Internal</mat-option></mat-select><mat-error *ngIf="form.get('source')?.hasError('required')">Source is required</mat-error></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Priority</mat-label><mat-select formControlName="priority"><mat-option value="LOW">Low</mat-option><mat-option value="MEDIUM">Medium</mat-option><mat-option value="HIGH">High</mat-option><mat-option value="CRITICAL">Critical</mat-option></mat-select><mat-error *ngIf="form.get('priority')?.hasError('required')">Priority is required</mat-error></mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Description</mat-label><textarea matInput rows="4" formControlName="description"></textarea><mat-error *ngIf="form.get('description')?.hasError('required')">Description is required</mat-error></mat-form-field>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Reporter, Product & Ownership</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Reporter Name</mat-label><input matInput formControlName="reporterName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Product Name</mat-label><input matInput formControlName="productName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Batch Number</mat-label><input matInput formControlName="batchNumber"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Owner</mat-label><mat-select formControlName="ownerId"><mat-option *ngFor="let user of users" [value]="user.id">{{ user.displayName || user.username }}</mat-option></mat-select><mat-error *ngIf="form.get('ownerId')?.hasError('required')">Owner is required</mat-error></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Plant Site</mat-label><mat-select formControlName="plantSiteId"><mat-option *ngFor="let site of sites" [value]="site.id">{{ site.name }}</mat-option></mat-select><mat-error *ngIf="form.get('plantSiteId')?.hasError('required')">Plant site is required</mat-error></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Department</mat-label><mat-select formControlName="departmentId"><mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option></mat-select><mat-error *ngIf="form.get('departmentId')?.hasError('required')">Department is required</mat-error></mat-form-field>
          </mat-card-content>
        </mat-card>
        <div class="form-actions"><button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving"><mat-icon>save</mat-icon> Create Complaint</button><button mat-stroked-button type="button" routerLink="../list">Cancel</button></div>
      </form>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px}h1{margin:0;font-size:24px}.page-header span{color:#667085}mat-card{margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding-top:12px}.wide{grid-column:1/-1}.form-actions{display:flex;gap:12px;justify-content:flex-end}`],
})
export class ComplaintFormComponent implements OnInit {
  users: UserOption[] = [];
  sites: PlantSiteOption[] = [];
  departments: DepartmentOption[] = [];
  saving = false;
  types = ['PRODUCT_QUALITY', 'ADVERSE_EVENT', 'PACKAGING', 'DELIVERY', 'SERVICE', 'OTHER'];
  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    complaintType: ['PRODUCT_QUALITY', Validators.required],
    source: ['CUSTOMER', Validators.required],
    priority: ['MEDIUM', Validators.required],
    reporterName: [''],
    productName: [''],
    batchNumber: [''],
    ownerId: ['', Validators.required],
    departmentId: ['', Validators.required],
    plantSiteId: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, private lookup: CoreLookupService, private complaintService: ComplaintService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    forkJoin({ users: this.lookup.users(), sites: this.lookup.plantSites(), departments: this.lookup.departments() }).subscribe(({ users, sites, departments }) => {
      this.users = users.content;
      this.sites = sites;
      this.departments = departments;
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    this.complaintService.create(this.form.getRawValue()).subscribe({
      next: (complaint) => {
        this.snackBar.open('Complaint created', 'Dismiss', { duration: 2500 });
        this.router.navigate(['/complaint', complaint.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Unable to create complaint', 'Dismiss', { duration: 3500 });
      },
    });
  }

  label(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
