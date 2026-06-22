import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { CoreLookupService, DepartmentOption, PlantSiteOption } from '../../../shared/core-lookup.service';
import { EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'qms-equipment-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>New Equipment</h1><span>Register controlled equipment for qualification, calibration, and maintenance.</span></div>
        <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card>
          <mat-card-header><mat-card-title>Equipment Identity</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name"></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="equipmentType"><mat-option *ngFor="let type of types" [value]="type">{{ label(type) }}</mat-option></mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category"><mat-option value="CRITICAL">Critical</mat-option><mat-option value="MAJOR">Major</mat-option><mat-option value="MINOR">Minor</mat-option></mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Description</mat-label><textarea matInput rows="3" formControlName="description"></textarea></mat-form-field>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Location & Manufacturer</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline"><mat-label>Plant Site</mat-label><mat-select formControlName="plantSiteId"><mat-option *ngFor="let site of sites" [value]="site.id">{{ site.name }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Department</mat-label><mat-select formControlName="departmentId"><mat-option value="">None</mat-option><mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Manufacturer</mat-label><input matInput formControlName="manufacturer"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Model Number</mat-label><input matInput formControlName="modelNumber"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Serial Number</mat-label><input matInput formControlName="serialNumber"></mat-form-field>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Calibration Control</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-checkbox formControlName="calibrationRequired">Calibration required</mat-checkbox>
            <mat-form-field appearance="outline"><mat-label>Frequency Days</mat-label><input matInput type="number" formControlName="calibrationFrequencyDays"></mat-form-field>
          </mat-card-content>
        </mat-card>
        <div class="form-actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving"><mat-icon>save</mat-icon> Create Equipment</button>
          <button mat-stroked-button type="button" routerLink="../list">Cancel</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px}h1{margin:0;font-size:24px}.page-header span{color:#667085}mat-card{margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding-top:12px}.wide{grid-column:1/-1}.form-actions{display:flex;gap:12px;justify-content:flex-end}`],
})
export class EquipmentFormComponent implements OnInit {
  sites: PlantSiteOption[] = [];
  departments: DepartmentOption[] = [];
  saving = false;
  types = ['MANUFACTURING', 'LABORATORY', 'UTILITY', 'WAREHOUSE', 'COMPUTERIZED_SYSTEM', 'MEASURING_DEVICE'];
  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    equipmentType: ['MANUFACTURING', Validators.required],
    category: ['CRITICAL', Validators.required],
    plantSiteId: ['', Validators.required],
    departmentId: [''],
    manufacturer: [''],
    modelNumber: [''],
    serialNumber: [''],
    calibrationRequired: [false],
    calibrationFrequencyDays: [365],
  });

  constructor(private fb: FormBuilder, private lookup: CoreLookupService, private equipmentService: EquipmentService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    forkJoin({ sites: this.lookup.plantSites(), departments: this.lookup.departments() }).subscribe(({ sites, departments }) => {
      this.sites = sites;
      this.departments = departments;
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.equipmentService.create(this.form.getRawValue()).subscribe({
      next: (equipment) => {
        this.snackBar.open('Equipment created', 'Dismiss', { duration: 2500 });
        this.router.navigate(['/equipment', equipment.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Unable to create equipment', 'Dismiss', { duration: 3500 });
      },
    });
  }

  label(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
