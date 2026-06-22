import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, AuthUser } from '../auth/auth.service';
import { ProfileApiService } from './profile-api.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="profile-page">
      <div class="page-title">
        <div>
          <h1>My Profile</h1>
          <p>Manage your contact details and account password.</p>
        </div>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="profile-layout">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="avatar">{{ initials }}</div>
            <h2>{{ user?.displayName || user?.username }}</h2>
            <span>{{ user?.jobTitle || user?.userType }}</span>
            <mat-divider></mat-divider>
            <div class="meta-row"><label>Employee ID</label><strong>{{ user?.employeeId || '-' }}</strong></div>
            <div class="meta-row"><label>Department</label><strong>{{ user?.departmentName || '-' }}</strong></div>
            <div class="meta-row"><label>Plant Site</label><strong>{{ user?.plantSiteName || '-' }}</strong></div>
            <div class="meta-row"><label>Last Login</label><strong>{{ user?.lastLoginAt ? (user?.lastLoginAt | date:'dd-MMM-yyyy HH:mm') : '-' }}</strong></div>
            <mat-chip-set *ngIf="roleCodes.length">
              <mat-chip *ngFor="let role of roleCodes">{{ role }}</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <div class="forms">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Contact Details</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Phone</mat-label>
                  <input matInput formControlName="phone" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="wide">
                  <mat-label>Job Title</mat-label>
                  <input matInput formControlName="jobTitle" />
                </mat-form-field>
                <div class="actions wide">
                  <button mat-raised-button color="primary" type="submit" [disabled]="profileForm.invalid || isSaving">
                    <mat-icon>save</mat-icon>
                    {{ isSaving ? 'Saving...' : 'Save Profile' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Password</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Current Password</mat-label>
                  <input matInput type="password" formControlName="currentPassword" autocomplete="current-password" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>New Password</mat-label>
                  <input matInput type="password" formControlName="newPassword" autocomplete="new-password" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Confirm Password</mat-label>
                  <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
                </mat-form-field>
                <div class="actions">
                  <button mat-stroked-button type="submit" [disabled]="passwordForm.invalid || isSavingPassword">
                    <mat-icon>lock_reset</mat-icon>
                    Change Password
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .profile-page { max-width: 1200px; margin: 0 auto; }
    .page-title { margin-bottom: 14px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .profile-layout { display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .summary-card { text-align: center; }
    .avatar { width: 76px; height: 76px; border-radius: 50%; background: #ED8B00; color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 24px; margin: 4px auto 12px; }
    h2 { margin: 0; color: #1B3A4B; font-size: 18px; }
    .summary-card span { color: #667085; font-size: 13px; display: block; margin-top: 4px; }
    mat-divider { margin: 18px 0; }
    .meta-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; text-align: left; }
    .meta-row label { color: #667085; font-size: 12px; }
    .meta-row strong { color: #1f2937; font-size: 12px; text-align: right; }
    mat-chip-set { display: flex; justify-content: center; margin-top: 12px; }
    .forms { display: grid; gap: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .wide { grid-column: 1 / -1; }
    .actions { display: flex; align-items: center; justify-content: flex-end; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 900px) {
      .profile-layout, .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class MyProfileComponent implements OnInit {
  user: AuthUser | null = null;
  isLoading = false;
  isSaving = false;
  isSavingPassword = false;

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    jobTitle: [''],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private profileApi: ProfileApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  get initials(): string {
    const name = this.user?.displayName || this.user?.username || 'User';
    return name.split(/[.\s]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  }

  get roleCodes(): string[] {
    return (this.user?.roles || []).map((role) => typeof role === 'string' ? role : role.code).filter(Boolean) as string[];
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.isSaving) return;
    this.isSaving = true;
    const value = this.profileForm.getRawValue();
    this.profileApi.updateProfile({
      firstName: value.firstName || '',
      lastName: value.lastName || '',
      email: value.email || '',
      phone: value.phone || '',
      jobTitle: value.jobTitle || '',
    }).subscribe({
      next: (user) => {
        this.user = user;
        this.authService.loadSessionContext().subscribe();
        this.snackBar.open('Profile updated', 'Dismiss', { duration: 2500 });
        this.isSaving = false;
      },
      error: () => {
        this.snackBar.open('Unable to update profile', 'Dismiss', { duration: 3500 });
        this.isSaving = false;
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword) return;
    const value = this.passwordForm.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.snackBar.open('New passwords do not match', 'Dismiss', { duration: 3000 });
      return;
    }
    this.isSavingPassword = true;
    this.profileApi.changePassword({
      currentPassword: value.currentPassword || '',
      newPassword: value.newPassword || '',
    }).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open('Password changed', 'Dismiss', { duration: 2500 });
        this.isSavingPassword = false;
      },
      error: () => {
        this.snackBar.open('Unable to change password', 'Dismiss', { duration: 3500 });
        this.isSavingPassword = false;
      },
    });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.profileApi.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          jobTitle: user.jobTitle || '',
        });
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Unable to load profile', 'Dismiss', { duration: 3500 });
        this.isLoading = false;
      },
    });
  }
}
