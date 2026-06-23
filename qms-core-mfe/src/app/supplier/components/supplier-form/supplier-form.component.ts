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
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'qms-supplier-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>New Supplier</h1>
          <span>Register and qualify a GxP supplier.</span>
        </div>
        <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card>
          <mat-card-header><mat-card-title>Supplier Identity</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Supplier Name</mat-label>
              <input matInput formControlName="name">
              <mat-error *ngIf="form.get('name')?.hasError('required')">Supplier name is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Legal Name</mat-label>
              <input matInput formControlName="legalName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Supplier Type</mat-label>
              <mat-select formControlName="supplierType">
                <mat-option *ngFor="let type of supplierTypes" [value]="type">{{ label(type) }}</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('supplierType')?.hasError('required')">Supplier type is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option value="CRITICAL">Critical</mat-option>
                <mat-option value="MAJOR">Major</mat-option>
                <mat-option value="MINOR">Minor</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('category')?.hasError('required')">Category is required</mat-error>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Location & Ownership</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline" class="wide">
              <mat-label>Address</mat-label>
              <textarea matInput formControlName="address" rows="2"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>City</mat-label><input matInput formControlName="city"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Country</mat-label><input matInput formControlName="country"></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Owner</mat-label>
              <mat-select formControlName="ownerId">
                <mat-option *ngFor="let user of users" [value]="user.id">{{ user.displayName || user.username }}</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('ownerId')?.hasError('required')">Owner is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Plant Site</mat-label>
              <mat-select formControlName="plantSiteId">
                <mat-option value="">None</mat-option>
                <mat-option *ngFor="let site of sites" [value]="site.id">{{ site.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Primary Contact</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Contact Name</mat-label><input matInput formControlName="primaryContactName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput formControlName="primaryContactEmail"></mat-form-field>
          </mat-card-content>
        </mat-card>

        <div class="form-actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
            <mat-icon>save</mat-icon> Create Supplier
          </button>
          <button mat-stroked-button type="button" routerLink="../list">Cancel</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px}
    h1{margin:0;font-size:24px}.page-header span{color:#667085}mat-card{margin-bottom:16px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding-top:12px}.wide{grid-column:1/-1}
    .form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:8px}
  `],
})
export class SupplierFormComponent implements OnInit {
  users: UserOption[] = [];
  sites: PlantSiteOption[] = [];
  departments: DepartmentOption[] = [];
  saving = false;
  supplierTypes = ['RAW_MATERIAL', 'PACKAGING', 'EXCIPIENT', 'API', 'CONTRACT_MANUFACTURER', 'CONTRACT_LAB', 'SERVICE_PROVIDER', 'EQUIPMENT'];

  form = this.fb.group({
    name: ['', Validators.required],
    legalName: [''],
    supplierType: ['RAW_MATERIAL', Validators.required],
    category: ['CRITICAL', Validators.required],
    address: [''],
    city: [''],
    country: [''],
    primaryContactName: [''],
    primaryContactEmail: [''],
    ownerId: ['', Validators.required],
    plantSiteId: [''],
  });

  constructor(
    private fb: FormBuilder,
    private lookup: CoreLookupService,
    private supplierService: SupplierService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    forkJoin({ users: this.lookup.users(), sites: this.lookup.plantSites(), departments: this.lookup.departments() })
      .subscribe(({ users, sites, departments }) => {
        this.users = users.content;
        this.sites = sites;
        this.departments = departments;
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    this.supplierService.create(this.form.getRawValue()).subscribe({
      next: (supplier) => {
        this.snackBar.open('Supplier created', 'Dismiss', { duration: 2500 });
        this.router.navigate(['/supplier', supplier.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Unable to create supplier', 'Dismiss', { duration: 3500 });
      },
    });
  }

  label(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
