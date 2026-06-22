import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Supplier, SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'qms-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSnackBarModule],
  template: `
    <div class="page" *ngIf="supplier">
      <div class="page-header">
        <div>
          <h1>{{ supplier.name }}</h1>
          <span>{{ supplier.supplierNumber }} &middot; {{ label(supplier.supplierType) }}</span>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Status</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
        <mat-menu #statusMenu="matMenu">
          <button mat-menu-item *ngFor="let status of statuses" (click)="changeStatus(status)">{{ label(status) }}</button>
        </mat-menu>
      </div>

      <div class="layout">
        <mat-card>
          <mat-card-header><mat-card-title>Supplier Profile</mat-card-title></mat-card-header>
          <mat-card-content class="info-grid">
            <div><label>Status</label><mat-chip>{{ label(supplier.status) }}</mat-chip></div>
            <div><label>Category</label><span>{{ supplier.category }}</span></div>
            <div><label>Owner</label><span>{{ supplier.owner?.displayName || 'Unassigned' }}</span></div>
            <div><label>Plant Site</label><span>{{ supplier.plantSite?.name || 'Corporate' }}</span></div>
            <div><label>Country</label><span>{{ supplier.country || '-' }}</span></div>
            <div><label>Qualification</label><span>{{ supplier.qualificationDate ? (supplier.qualificationDate | date:'mediumDate') : 'Pending' }}</span></div>
            <div><label>Next Requalification</label><span>{{ supplier.nextRequalificationDate ? (supplier.nextRequalificationDate | date:'mediumDate') : '-' }}</span></div>
            <div><label>Overall Score</label><span>{{ supplier.overallScore ?? '-' }}</span></div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Contact & Address</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div><label>Contact</label><span>{{ supplier.primaryContactName || '-' }}</span></div>
              <div><label>Email</label><span>{{ supplier.primaryContactEmail || '-' }}</span></div>
              <div><label>Phone</label><span>{{ supplier.primaryContactPhone || '-' }}</span></div>
              <div><label>Address</label><span>{{ supplier.address || '-' }}</span></div>
            </div>
            <mat-divider></mat-divider>
            <div class="edit-grid">
              <mat-form-field appearance="outline"><mat-label>Supplier Name</mat-label><input matInput [(ngModel)]="edit.name"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Contact Name</mat-label><input matInput [(ngModel)]="edit.primaryContactName"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput [(ngModel)]="edit.primaryContactEmail"></mat-form-field>
              <button mat-raised-button color="primary" (click)="saveEdits()"><mat-icon>save</mat-icon> Save Changes</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}
    h1{margin:0;font-size:24px}.page-header span{color:#667085}.actions{display:flex;gap:8px}.layout{display:grid;gap:16px}
    .info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}
    mat-divider{margin:18px 0}.edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:center}
  `],
})
export class SupplierDetailComponent implements OnInit {
  supplier: Supplier | null = null;
  edit = {
    name: '',
    primaryContactName: '',
    primaryContactEmail: '',
  };
  statuses = ['PENDING_QUALIFICATION', 'QUALIFIED', 'APPROVED', 'CONDITIONALLY_APPROVED', 'SUSPENDED', 'DISQUALIFIED', 'INACTIVE'];

  constructor(private route: ActivatedRoute, private supplierService: SupplierService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.supplierService.getById(id).subscribe((supplier) => {
      this.supplier = supplier;
      this.edit = {
        name: supplier.name || '',
        primaryContactName: supplier.primaryContactName || '',
        primaryContactEmail: supplier.primaryContactEmail || '',
      };
    });
  }

  changeStatus(status: string): void {
    if (!this.supplier) return;
    this.supplierService.transitionStatus(this.supplier.id, status).subscribe((supplier) => {
      this.supplier = supplier;
      this.snackBar.open('Supplier status updated', 'Dismiss', { duration: 2500 });
    });
  }

  saveEdits(): void {
    if (!this.supplier) return;
    this.supplierService.update(this.supplier.id, this.edit).subscribe((supplier) => {
      this.supplier = supplier;
      this.snackBar.open('Supplier updated', 'Dismiss', { duration: 2500 });
    });
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }
}
