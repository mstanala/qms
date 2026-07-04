import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileApiService, UserPreferences } from './profile-api.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="preferences-page">
      <div class="page-title">
        <div>
          <h1>Preferences</h1>
          <p>Set how the application behaves for your account.</p>
        </div>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Application Preferences</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="preferencesForm" (ngSubmit)="save()" class="prefs-form">
            <div class="pref-row">
              <div>
                <strong>Email notifications</strong>
                <span>Receive email alerts for assigned tasks and workflow updates.</span>
              </div>
              <mat-slide-toggle formControlName="emailNotifications"></mat-slide-toggle>
            </div>
            <div class="pref-row">
              <div>
                <strong>Task reminders</strong>
                <span>Show reminders for upcoming and overdue work.</span>
              </div>
              <mat-slide-toggle formControlName="taskReminders"></mat-slide-toggle>
            </div>
            <div class="pref-row">
              <div>
                <strong>Compact view</strong>
                <span>Use denser lists and panels where supported.</span>
              </div>
              <mat-slide-toggle formControlName="compactView"></mat-slide-toggle>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Landing Page</mat-label>
              <mat-select formControlName="landingPage">
                <mat-option value="/dashboard">Overview Dashboard</mat-option>
                <mat-option value="/capa/dashboard">CAPA Dashboard</mat-option>
                <mat-option value="/deviations/dashboard">Deviation Dashboard</mat-option>
                <mat-option value="/change-control/dashboard">Change Control Dashboard</mat-option>
                <mat-option value="/documents/dashboard">Document Dashboard</mat-option>
                <mat-option value="/training/my-training">My Training</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="isSaving">
                <mat-icon>save</mat-icon>
                {{ isSaving ? 'Saving...' : 'Save Preferences' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .preferences-page { max-width: 900px; margin: 0 auto; }
    .page-title { margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .prefs-form { display: grid; gap: 18px; }
    .pref-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 12px 0; border-bottom: 1px solid #eef2f6; }
    .pref-row strong { display: block; color: #1f2937; font-size: 14px; }
    .pref-row span { display: block; color: #667085; font-size: 12px; margin-top: 3px; }
    mat-form-field { max-width: 360px; }
    .actions { display: flex; justify-content: flex-end; }
    button mat-icon { margin-right: 6px; }
  `],
})
export class PreferencesComponent implements OnInit {
  isLoading = false;
  isSaving = false;

  preferencesForm = this.fb.group({
    emailNotifications: [true],
    taskReminders: [true],
    compactView: [false],
    landingPage: ['/dashboard'],
  });

  constructor(
    private fb: FormBuilder,
    private profileApi: ProfileApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.profileApi.getPreferences().subscribe({
      next: (preferences) => {
        this.preferencesForm.patchValue(preferences);
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Unable to load preferences', 'Dismiss', { duration: 3500 });
        this.isLoading = false;
      },
    });
  }

  save(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.profileApi.updatePreferences(this.preferencesForm.getRawValue() as UserPreferences).subscribe({
      next: () => {
        this.snackBar.open('Preferences saved', 'Dismiss', { duration: 2500 });
        this.isSaving = false;
      },
      error: () => {
        this.snackBar.open('Unable to save preferences', 'Dismiss', { duration: 3500 });
        this.isSaving = false;
      },
    });
  }
}
