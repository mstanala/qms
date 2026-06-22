import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RiskService } from '../../services/risk.service';

@Component({
  selector: 'qms-risk-register-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule
  ],
  template: `
    <div class="form-container">
      <div class="form-header">
        <h1>Create Risk Register</h1>
        <button mat-stroked-button routerLink="../">
          <mat-icon>arrow_back</mat-icon> Cancel
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" placeholder="Risk register title">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Describe the scope and purpose"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Risk Type</mat-label>
                <mat-select formControlName="riskType">
                  <option value="PRODUCT">Product</option>
                  <option value="PROCESS">Process</option>
                  <option value="PATIENT_SAFETY">Patient Safety</option>
                  <option value="SUPPLY_CHAIN">Supply Chain</option>
                  <option value="REGULATORY">Regulatory</option>
                  <option value="DATA_INTEGRITY">Data Integrity</option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Methodology</mat-label>
                <mat-select formControlName="methodology">
                  <option value="FMEA">FMEA</option>
                  <option value="HACCP">HACCP</option>
                  <option value="FTA">Fault Tree Analysis</option>
                  <option value="HAZOP">HAZOP</option>
                  <option value="PHA">Preliminary Hazard Analysis</option>
                  <option value="BOW_TIE">Bow-Tie</option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Scope</mat-label>
                <textarea matInput formControlName="scope" rows="2" placeholder="Define the scope boundaries"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Priority</mat-label>
                <mat-select formControlName="priority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Review Frequency (months)</mat-label>
                <input matInput type="number" formControlName="reviewFrequencyMonths" min="1" max="60">
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
                <mat-icon>save</mat-icon> Create Register
              </button>
              <button mat-stroked-button type="button" routerLink="../">Cancel</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container { padding: 24px; max-width: 800px; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .form-header h1 { margin: 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
  `],
})
export class RiskRegisterFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private riskService: RiskService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      riskType: ['', Validators.required],
      methodology: ['', Validators.required],
      scope: [''],
      priority: ['MEDIUM'],
      reviewFrequencyMonths: [12],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    // In production, ownerId/departmentId/plantSiteId would come from user context
    const request = {
      ...this.form.value,
      ownerId: '00000000-0000-0000-0000-000000000001',
      departmentId: '00000000-0000-0000-0000-000000000001',
      plantSiteId: '00000000-0000-0000-0000-000000000001',
    };
    this.riskService.createRegister(request).subscribe((reg) => {
      this.router.navigate(['/risk/registers', reg.id]);
    });
  }
}
