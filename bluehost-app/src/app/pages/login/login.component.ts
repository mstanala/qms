import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="login-page">
      <section class="login-panel">
        <div class="brand">
          <div class="brand-mark">
            <mat-icon>verified</mat-icon>
          </div>
          <div>
            <h1>Secure QMS</h1>
            <p>Quality management access</p>
          </div>
        </div>

        <mat-card class="login-card">
          <div class="card-head">
            <h2>Sign in</h2>
            <span>Use your QMS account credentials</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">Username is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
              />
              <button type="button" mat-icon-button matSuffix (click)="showPassword = !showPassword" aria-label="Toggle password">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <div class="error" *ngIf="errorMessage">
              <mat-icon>error</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <button class="login-btn" mat-raised-button type="submit" [disabled]="loginForm.invalid || isSubmitting">
              <mat-icon>login</mat-icon>
              {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <div class="demo-credentials">
            <mat-icon>info</mat-icon>
            <div>
              <strong>Demo Access</strong>
              <span>Username: <code>demo.user</code> &nbsp;|&nbsp; Password: <code>Password&#64;123</code></span>
            </div>
          </div>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        linear-gradient(rgba(27, 58, 75, 0.86), rgba(27, 58, 75, 0.78)),
        url('https://images.unsplash.com/photo-1581093458791-9d09c85a376f?auto=format&fit=crop&w=1800&q=80') center/cover;
      padding: 24px;
    }
    .login-panel { width: min(440px, 100%); }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #fff;
      margin-bottom: 20px;
    }
    .brand-mark {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #ED8B00;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
    }
    .brand-mark mat-icon { width: 28px; height: 28px; font-size: 28px; }
    h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0; }
    .brand p { margin: 2px 0 0; color: rgba(255, 255, 255, 0.78); font-size: 14px; }
    .login-card {
      border-radius: 8px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow: 0 18px 45px rgba(0,0,0,0.28);
    }
    .card-head { margin-bottom: 20px; }
    .card-head h2 { margin: 0; font-size: 22px; font-weight: 650; color: #1B3A4B; letter-spacing: 0; }
    .card-head span { display: block; margin-top: 4px; font-size: 13px; color: #667085; }
    form { display: grid; gap: 14px; }
    mat-form-field { width: 100%; }
    .error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 6px;
      background: #ffebee;
      color: #b42318;
      font-size: 13px;
    }
    .error mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .login-btn {
      height: 44px;
      background: #2C5F7C !important;
      color: #fff !important;
      border-radius: 6px;
      font-weight: 650;
      margin-top: 2px;
    }
    .login-btn mat-icon { margin-right: 6px; }
    .demo-credentials {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 6px;
      background: #f0f7ff;
      border: 1px solid #bdd7ee;
    }
    .demo-credentials mat-icon { width: 18px; height: 18px; font-size: 18px; color: #2C5F7C; margin-top: 1px; }
    .demo-credentials div { display: flex; flex-direction: column; gap: 2px; }
    .demo-credentials strong { font-size: 12px; color: #1B3A4B; }
    .demo-credentials span { font-size: 12px; color: #475569; }
    .demo-credentials code { background: #e2ecf4; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 12px; color: #1B3A4B; }
  `],
})
export class LoginComponent implements OnInit {
  loginForm = this.fb.group({
    username: ['demo.user', Validators.required],
    password: ['Password@123', Validators.required],
  });
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('message') === 'sessionExpired') {
      this.errorMessage = 'Your session has expired. Please sign in again.';
    }
  }

  submit(): void {
    if (this.loginForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const credentials = {
      username: this.loginForm.value.username || '',
      password: this.loginForm.value.password || '',
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.errorMessage = 'Invalid username or password';
        this.isSubmitting = false;
      },
    });
  }
}
