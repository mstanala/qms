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
import { NonconformanceService } from '../../services/nonconformance.service';

@Component({
  selector: 'qms-nc-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header"><div><h1>New Nonconformance</h1><span>Capture product, process, material, or supplier nonconformance for triage.</span></div><button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button></div>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card>
          <mat-card-header><mat-card-title>Nonconformance Intake</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select formControlName="ncType"><mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Priority</mat-label><mat-select formControlName="priority"><mat-option value="LOW">Low</mat-option><mat-option value="MEDIUM">Medium</mat-option><mat-option value="HIGH">High</mat-option><mat-option value="CRITICAL">Critical</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Description</mat-label><textarea matInput rows="4" formControlName="description"></textarea></mat-form-field>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Product & Location</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Product Name</mat-label><input matInput formControlName="productName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Batch Number</mat-label><input matInput formControlName="batchNumber"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Stage Detected</mat-label><input matInput formControlName="stageDetected"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Owner</mat-label><mat-select formControlName="ownerId"><mat-option *ngFor="let user of users" [value]="user.id">{{ user.displayName || user.username }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Plant Site</mat-label><mat-select formControlName="plantSiteId"><mat-option *ngFor="let site of sites" [value]="site.id">{{ site.name }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Department</mat-label><mat-select formControlName="departmentId"><mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option></mat-select></mat-form-field>
          </mat-card-content>
        </mat-card>
        <div class="form-actions"><button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving"><mat-icon>save</mat-icon> Create NC</button><button mat-stroked-button type="button" routerLink="../list">Cancel</button></div>
      </form>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px}h1{margin:0;font-size:24px}.page-header span{color:#667085}mat-card{margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding-top:12px}.wide{grid-column:1/-1}.form-actions{display:flex;gap:12px;justify-content:flex-end}`],
})
export class NcFormComponent implements OnInit {
  users: UserOption[] = [];
  sites: PlantSiteOption[] = [];
  departments: DepartmentOption[] = [];
  saving = false;
  types = ['PRODUCT', 'PROCESS', 'MATERIAL', 'EQUIPMENT', 'DOCUMENTATION', 'SUPPLIER'];
  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    ncType: ['PRODUCT', Validators.required],
    priority: ['MEDIUM', Validators.required],
    productName: [''],
    batchNumber: [''],
    stageDetected: [''],
    ownerId: ['', Validators.required],
    departmentId: ['', Validators.required],
    plantSiteId: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, private lookup: CoreLookupService, private ncService: NonconformanceService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    forkJoin({ users: this.lookup.users(), sites: this.lookup.plantSites(), departments: this.lookup.departments() }).subscribe(({ users, sites, departments }) => {
      this.users = users.content;
      this.sites = sites;
      this.departments = departments;
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.ncService.create(this.form.getRawValue()).subscribe({
      next: (nc) => {
        this.snackBar.open('Nonconformance created', 'Dismiss', { duration: 2500 });
        this.router.navigate(['/nonconformance', nc.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Unable to create nonconformance', 'Dismiss', { duration: 3500 });
      },
    });
  }

  label(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
