import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ESignatureDialogData {
  recordNumber: string;
  action: string;
  meaning: string;
}

@Component({
  selector: 'cc-e-signature-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="esign-dialog">
      <div class="esign-header">
        <mat-icon class="esign-icon">verified_user</mat-icon>
        <h2>Electronic Signature</h2>
        <p class="esign-subtitle">21 CFR Part 11 Compliant</p>
      </div>

      <div class="esign-body">
        <div class="esign-record-info">
          <div class="info-row">
            <span class="info-label">Record:</span>
            <span class="info-value">{{ data.recordNumber }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Action:</span>
            <span class="info-value">{{ data.action }}</span>
          </div>
        </div>

        <div class="esign-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password"
                   placeholder="Re-enter your password to confirm identity">
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="passwordError">{{ passwordError }}</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Signature Meaning</mat-label>
            <input matInput [(ngModel)]="meaning" [placeholder]="data.meaning">
          </mat-form-field>
        </div>

        <div class="esign-notice">
          <mat-icon>info</mat-icon>
          <span>By signing, you confirm that you have reviewed the record and that this action represents your intent. This signature is legally binding per 21 CFR Part 11.</span>
        </div>
      </div>

      <div class="esign-actions">
        <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" type="button" (click)="sign()" [disabled]="signing"
                style="background: #2C5F7C;">
          <mat-icon>draw</mat-icon> {{ signing ? 'Verifying...' : 'Sign & Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .esign-dialog { padding: 0; }
    .esign-header {
      text-align: center;
      padding: 20px 24px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .esign-icon { font-size: 36px; width: 36px; height: 36px; color: #2C5F7C; }
    .esign-header h2 { margin: 8px 0 2px; font-size: 18px; font-weight: 600; color: #1f2937; }
    .esign-subtitle { margin: 0; font-size: 12px; color: #667085; }

    .esign-body { padding: 16px 24px; }
    .esign-record-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .info-row { display: flex; gap: 8px; font-size: 13px; padding: 2px 0; }
    .info-label { color: #667085; font-weight: 500; min-width: 60px; }
    .info-value { color: #1f2937; font-weight: 600; }

    .esign-form { margin-bottom: 12px; }
    .full-width { width: 100%; }

    .esign-notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      font-size: 12px;
      color: #92400e;
    }
    .esign-notice mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    .esign-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 24px;
      border-top: 1px solid #e5e7eb;
    }
  `],
})
export class ESignatureDialogComponent {
  password = '';
  meaning = '';
  showPassword = false;
  signing = false;
  passwordError = '';

  constructor(
    public dialogRef: MatDialogRef<ESignatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ESignatureDialogData
  ) {
    this.meaning = data.meaning || '';
  }

  cancel(): void {
    this.dialogRef.close({ signed: false });
  }

  sign(): void {
    if (!this.password) {
      this.passwordError = 'Password is required for electronic signature';
      return;
    }
    if (!this.meaning.trim()) {
      this.meaning = this.data.meaning;
    }

    this.signing = true;
    this.passwordError = '';

    setTimeout(() => {
      this.signing = false;
      this.dialogRef.close({
        signed: true,
        password: this.password,
        meaning: this.meaning,
      });
    }, 500);
  }
}