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
import { AdminApiService, SystemConfiguration } from './admin-api.service';

@Component({
  selector: 'app-admin-configuration',
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
          <h1>System Configuration</h1>
          <p>Maintain backend-driven configuration keys for QMS modules.</p>
        </div>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="toolbar">
        <mat-form-field appearance="outline">
          <mat-label>Module</mat-label>
          <mat-select [value]="moduleFilter" (selectionChange)="moduleFilter = $event.value">
            <mat-option value="">All modules</mat-option>
            <mat-option *ngFor="let module of modules" [value]="module">{{ formatLabel(module) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Search configuration</mat-label>
          <input matInput [value]="searchTerm" (input)="searchTerm = inputValue($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="config-grid">
        <mat-card *ngFor="let config of filteredConfigurations; trackBy: trackByKey" class="config-card">
          <mat-card-header>
            <mat-card-title>{{ config.configKey }}</mat-card-title>
            <mat-card-subtitle>{{ formatLabel(config.module) }} · {{ config.configType }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ config.description || 'No description provided.' }}</p>
            <form [formGroup]="forms[config.configKey]" (ngSubmit)="saveConfig(config)">
              <div class="config-form">
                <mat-form-field appearance="outline">
                  <mat-label>Value</mat-label>
                  <input matInput formControlName="configValue" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Type</mat-label>
                  <mat-select formControlName="configType">
                    <mat-option *ngFor="let type of configTypes" [value]="type">{{ type }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <input matInput formControlName="description" />
              </mat-form-field>
              <div class="card-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="forms[config.configKey].invalid || savingKey === config.configKey">
                  <mat-icon>save</mat-icon>
                  {{ savingKey === config.configKey ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .admin-page { max-width: 1440px; margin: 0 auto; }
    .page-title { margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .toolbar { display: grid; grid-template-columns: 240px minmax(240px, 1fr); gap: 12px; margin: 12px 0; }
    .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 14px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    mat-card-title { font-size: 15px; color: #1B3A4B; letter-spacing: 0; }
    mat-card-content p { color: #667085; font-size: 12px; min-height: 32px; }
    mat-form-field { width: 100%; }
    .config-form { display: grid; grid-template-columns: 1fr 150px; gap: 10px; }
    .card-actions { display: flex; justify-content: flex-end; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 760px) {
      .toolbar, .config-form { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminConfigurationComponent implements OnInit {
  configurations: SystemConfiguration[] = [];
  forms: Record<string, ReturnType<FormBuilder['group']>> = {};
  isLoading = false;
  savingKey = '';
  moduleFilter = '';
  searchTerm = '';
  readonly configTypes = ['STRING', 'INTEGER', 'BOOLEAN', 'DECIMAL', 'JSON'];

  constructor(
    private fb: FormBuilder,
    private api: AdminApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConfigurations();
  }

  get modules(): string[] {
    return Array.from(new Set(this.configurations.map((config) => config.module))).sort();
  }

  get filteredConfigurations(): SystemConfiguration[] {
    const search = this.searchTerm.toLowerCase();
    return this.configurations.filter((config) =>
      (!this.moduleFilter || config.module === this.moduleFilter) &&
      (!search || `${config.configKey} ${config.description || ''}`.toLowerCase().includes(search))
    );
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  loadConfigurations(): void {
    this.isLoading = true;
    this.api.listConfigurations().subscribe({
      next: (configs) => {
        this.configurations = configs.sort((a, b) => a.configKey.localeCompare(b.configKey));
        this.forms = {};
        this.configurations.forEach((config) => {
          this.forms[config.configKey] = this.fb.group({
            configValue: [config.configValue, Validators.required],
            configType: [config.configType || 'STRING', Validators.required],
            description: [config.description || ''],
          });
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load system configurations', 'Dismiss', { duration: 4000 });
      },
    });
  }

  saveConfig(config: SystemConfiguration): void {
    const form = this.forms[config.configKey];
    if (!form || form.invalid) return;
    this.savingKey = config.configKey;
    const raw = form.getRawValue() as { configValue: string; configType: string; description: string };
    this.api.updateConfiguration(config.configKey, raw).subscribe({
      next: (updated) => {
        this.savingKey = '';
        this.configurations = this.configurations.map((item) => item.configKey === updated.configKey ? updated : item);
        this.snackBar.open('Configuration updated', 'Dismiss', { duration: 2500 });
      },
      error: () => {
        this.savingKey = '';
        this.snackBar.open('Unable to update configuration', 'Dismiss', { duration: 4000 });
      },
    });
  }

  formatLabel(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  trackByKey(_index: number, item: SystemConfiguration): string {
    return item.configKey;
  }
}
