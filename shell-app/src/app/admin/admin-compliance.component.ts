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
import {
  AdminApiService,
  Department,
  Organization,
  PlantSite,
  SystemConfiguration,
} from './admin-api.service';

@Component({
  selector: 'app-admin-compliance',
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
    <section class="admin-page">
      <div class="page-title">
        <div>
          <h1>Compliance Settings</h1>
          <p>Review regulated controls, organization context, plant sites, and department setup.</p>
        </div>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="summary-grid">
        <mat-card>
          <mat-icon>business</mat-icon>
          <strong>{{ organizations.length }}</strong>
          <span>Organizations</span>
        </mat-card>
        <mat-card>
          <mat-icon>factory</mat-icon>
          <strong>{{ plantSites.length }}</strong>
          <span>Plant Sites</span>
        </mat-card>
        <mat-card>
          <mat-icon>account_tree</mat-icon>
          <strong>{{ departments.length }}</strong>
          <span>Departments</span>
        </mat-card>
        <mat-card>
          <mat-icon>verified_user</mat-icon>
          <strong>{{ complianceConfigurations.length }}</strong>
          <span>Controls</span>
        </mat-card>
      </div>

      <div class="layout">
        <mat-card class="controls-card">
          <mat-card-header>
            <mat-card-title>Regulated Controls</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="control-row" *ngFor="let config of complianceConfigurations; trackBy: trackByKey">
              <div>
                <strong>{{ config.configKey }}</strong>
                <small>{{ config.description }}</small>
              </div>
              <span>{{ config.configValue }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dept-card">
          <mat-card-header>
            <mat-card-title>Create Department</mat-card-title>
            <mat-card-subtitle>Uses POST /api/v1/admin/departments</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="departmentForm" (ngSubmit)="createDepartment()" class="dept-form">
              <mat-form-field appearance="outline">
                <mat-label>Plant Site</mat-label>
                <mat-select formControlName="plantSiteId">
                  <mat-option *ngFor="let site of plantSites" [value]="site.id">{{ site.name }}</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Code</mat-label>
                  <input matInput formControlName="code" />
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <input matInput formControlName="description" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Parent Department</mat-label>
                <mat-select formControlName="parentDepartmentId">
                  <mat-option [value]="null">None</mat-option>
                  <mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="departmentForm.invalid || isSavingDepartment">
                <mat-icon>add</mat-icon>
                {{ isSavingDepartment ? 'Creating...' : 'Create Department' }}
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="reference-card">
        <mat-card-header>
          <mat-card-title>Organization Structure</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="site-group" *ngFor="let site of plantSites; trackBy: trackById">
            <div class="site-head">
              <div>
                <strong>{{ site.name }}</strong>
                <small>{{ site.code }} · {{ site.city || 'City not set' }}, {{ site.state || 'State not set' }}</small>
              </div>
              <span>{{ site.siteType || 'Plant' }}</span>
            </div>
            <div class="departments">
              <span *ngFor="let dept of departmentsForSite(site.id)">{{ dept.name }}</span>
              <em *ngIf="departmentsForSite(site.id).length === 0">No departments configured</em>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .admin-page { max-width: 1440px; margin: 0 auto; }
    .page-title { margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 12px; margin-bottom: 14px; }
    .summary-grid mat-card { display: grid; grid-template-columns: 34px 1fr; column-gap: 10px; align-items: center; padding: 14px; }
    .summary-grid mat-icon { grid-row: span 2; color: #2C5F7C; background: #eef7fb; border-radius: 6px; padding: 5px; }
    .summary-grid strong { color: #1B3A4B; font-size: 22px; line-height: 1; }
    .summary-grid span { color: #667085; font-size: 12px; }
    .layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 14px; align-items: start; margin-bottom: 14px; }
    .control-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 10px 0; border-bottom: 1px solid #edf1f7; }
    .control-row:last-child { border-bottom: none; }
    .control-row strong { display: block; color: #1f2937; font-size: 13px; }
    .control-row small { display: block; color: #667085; font-size: 12px; margin-top: 2px; }
    .control-row span { align-self: center; background: #f2f4f7; border-radius: 999px; padding: 4px 9px; color: #344054; font-size: 12px; font-weight: 650; }
    .dept-form { display: grid; gap: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 120px; gap: 10px; }
    mat-form-field { width: 100%; }
    button mat-icon { margin-right: 6px; }
    .site-group { border: 1px solid #edf1f7; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .site-head { display: flex; justify-content: space-between; gap: 12px; }
    .site-head strong { display: block; color: #1B3A4B; font-size: 14px; }
    .site-head small { display: block; color: #667085; font-size: 12px; margin-top: 2px; }
    .site-head span { color: #027a48; background: #ecfdf3; border-radius: 999px; padding: 4px 9px; font-size: 11px; font-weight: 650; height: fit-content; }
    .departments { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
    .departments span { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 9px; font-size: 12px; color: #344054; }
    .departments em { color: #98a2b3; font-size: 12px; }
    @media (max-width: 1000px) {
      .summary-grid, .layout { grid-template-columns: 1fr; }
      .two-col { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminComplianceComponent implements OnInit {
  organizations: Organization[] = [];
  plantSites: PlantSite[] = [];
  departments: Department[] = [];
  configurations: SystemConfiguration[] = [];
  isLoading = false;
  isSavingDepartment = false;

  departmentForm = this.fb.group({
    plantSiteId: ['', Validators.required],
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: [''],
    parentDepartmentId: [null as string | null],
  });

  constructor(
    private fb: FormBuilder,
    private api: AdminApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get complianceConfigurations(): SystemConfiguration[] {
    return this.configurations.filter((config) =>
      config.module === 'ADMIN' ||
      config.configKey.includes('audit') ||
      config.configKey.includes('esignature') ||
      config.configKey.includes('password') ||
      config.configKey.includes('login') ||
      config.configKey.includes('session')
    );
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      organizations: this.api.listOrganizations(),
      plantSites: this.api.listPlantSites(),
      departments: this.api.listDepartments(),
      configurations: this.api.listConfigurations(),
    }).subscribe({
      next: ({ organizations, plantSites, departments, configurations }) => {
        this.organizations = organizations;
        this.plantSites = plantSites;
        this.departments = departments;
        this.configurations = configurations.sort((a, b) => a.configKey.localeCompare(b.configKey));
        this.departmentForm.patchValue({ plantSiteId: plantSites[0]?.id || '' });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load compliance settings', 'Dismiss', { duration: 4000 });
      },
    });
  }

  createDepartment(): void {
    if (this.departmentForm.invalid || this.isSavingDepartment) return;
    this.isSavingDepartment = true;
    const raw = this.departmentForm.getRawValue();
    this.api.createDepartment({
      plantSiteId: raw.plantSiteId || '',
      name: raw.name || '',
      code: raw.code || '',
      description: raw.description || '',
      parentDepartmentId: raw.parentDepartmentId,
    }).subscribe({
      next: () => {
        this.isSavingDepartment = false;
        this.departmentForm.patchValue({ name: '', code: '', description: '', parentDepartmentId: null });
        this.snackBar.open('Department created', 'Dismiss', { duration: 2500 });
        this.api.listDepartments().subscribe((departments) => this.departments = departments);
      },
      error: () => {
        this.isSavingDepartment = false;
        this.snackBar.open('Unable to create department', 'Dismiss', { duration: 4000 });
      },
    });
  }

  departmentsForSite(siteId: string): Department[] {
    return this.departments.filter((department) => (department.plantSiteId || department.plantSite?.id) === siteId);
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  trackByKey(_index: number, item: SystemConfiguration): string {
    return item.configKey;
  }
}
