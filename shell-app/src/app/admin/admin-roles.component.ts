import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { PermissionResponse, RoleResponse } from '../auth/auth.service';
import { AdminApiService } from './admin-api.service';

interface PermissionGroup {
  module: string;
  permissions: PermissionResponse[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
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
          <h1>Roles & Permissions</h1>
          <p>Manage role metadata and create roles with backend permission assignments.</p>
        </div>
        <button mat-raised-button color="primary" (click)="newRole()">
          <mat-icon>add</mat-icon>
          New Role
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="admin-layout">
        <mat-card class="roles-card">
          <mat-card-header>
            <mat-card-title>Application Roles</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="role-list">
              <button
                class="role-row"
                type="button"
                *ngFor="let role of roles; trackBy: trackById"
                [class.selected]="selectedRole?.id === role.id"
                (click)="selectRole(role)">
                <span class="role-icon"><mat-icon>{{ role.code === 'VAULT_ADMIN' ? 'shield' : 'admin_panel_settings' }}</mat-icon></span>
                <span class="role-main">
                  <strong>{{ role.name }}</strong>
                  <small>{{ role.code }} · {{ role.roleLevel || 'Role' }}</small>
                </span>
                <span class="system-chip" *ngIf="role.isSystem">System</span>
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{ selectedRole ? 'Edit Role' : 'Create Role' }}</mat-card-title>
            <mat-card-subtitle *ngIf="selectedRole">Existing role permissions are read-only because the backend exposes permission assignment during role creation only.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="roleForm" (ngSubmit)="saveRole()" class="role-form">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Code</mat-label>
                  <input matInput formControlName="code" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Role Level</mat-label>
                  <mat-select formControlName="roleLevel">
                    <mat-option *ngFor="let level of roleLevels" [value]="level">{{ formatLabel(level) }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Description</mat-label>
                  <input matInput formControlName="description" />
                </mat-form-field>
              </div>

              <div class="permissions-head">
                <div>
                  <h2>Permission Matrix</h2>
                  <p>{{ selectedRole ? 'Current role permissions from backend' : 'Select permissions for the new role' }}</p>
                </div>
                <button mat-stroked-button type="button" (click)="selectAdminPermissions()" [disabled]="!!selectedRole">
                  <mat-icon>security</mat-icon>
                  Admin Set
                </button>
              </div>

              <div class="permission-groups">
                <section class="permission-group" *ngFor="let group of permissionGroups">
                  <h3>{{ formatLabel(group.module) }}</h3>
                  <div class="permission-grid">
                    <mat-checkbox
                      *ngFor="let permission of group.permissions; trackBy: trackById"
                      [checked]="isPermissionSelected(permission.id)"
                      [disabled]="!!selectedRole"
                      (change)="togglePermission(permission.id, $event.checked)">
                      <span class="perm-action">{{ permission.action }}</span>
                      <small>{{ permission.resource }}</small>
                    </mat-checkbox>
                  </div>
                </section>
              </div>

              <div class="actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="roleForm.invalid || isSaving">
                  <mat-icon>save</mat-icon>
                  {{ isSaving ? 'Saving...' : 'Save Role' }}
                </button>
                <button mat-stroked-button type="button" (click)="newRole()">Clear</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .admin-page { max-width: 1440px; margin: 0 auto; }
    .page-title { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 16px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .admin-layout { display: grid; grid-template-columns: 390px 1fr; gap: 16px; align-items: start; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .role-list { display: grid; gap: 8px; max-height: 700px; overflow: auto; padding-right: 4px; }
    .role-row { display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center; width: 100%; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; padding: 10px; text-align: left; cursor: pointer; }
    .role-row:hover, .role-row.selected { border-color: #2C5F7C; background: #f4f8fb; }
    .role-icon { width: 32px; height: 32px; border-radius: 6px; display: grid; place-items: center; color: #2C5F7C; background: #eef7fb; }
    .role-icon mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .role-main strong { display: block; color: #1f2937; font-size: 13px; }
    .role-main small { display: block; color: #667085; font-size: 11px; }
    .system-chip { color: #6941c6; background: #f4f3ff; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 650; }
    .role-form { display: grid; gap: 14px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .permissions-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .permissions-head h2 { margin: 0; color: #1B3A4B; font-size: 17px; letter-spacing: 0; }
    .permissions-head p { margin: 3px 0 0; color: #667085; font-size: 12px; }
    .permission-groups { display: grid; gap: 12px; }
    .permission-group { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fbfcfe; }
    .permission-group h3 { margin: 0 0 10px; color: #344054; font-size: 13px; font-weight: 700; letter-spacing: 0; }
    .permission-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px 12px; }
    mat-checkbox small { display: block; color: #667085; font-size: 11px; margin-top: 1px; }
    .perm-action { font-size: 12px; font-weight: 650; color: #1f2937; }
    .actions { display: flex; align-items: center; gap: 10px; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1100px) {
      .admin-layout { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminRolesComponent implements OnInit {
  roles: RoleResponse[] = [];
  permissions: PermissionResponse[] = [];
  permissionGroups: PermissionGroup[] = [];
  selectedRole: RoleResponse | null = null;
  isLoading = false;
  isSaving = false;
  readonly roleLevels = ['END_USER', 'OWNER', 'REVIEWER', 'APPROVER', 'QA_REVIEWER', 'QA_APPROVER', 'TRAINING_ADMIN', 'VAULT_ADMIN'];

  roleForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: [''],
    roleLevel: ['END_USER', Validators.required],
    permissionIds: [[] as string[]],
  });

  constructor(
    private fb: FormBuilder,
    private api: AdminApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      roles: this.api.listRoles(),
      permissions: this.api.listPermissions(),
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles = roles;
        this.permissions = permissions;
        this.permissionGroups = this.groupPermissions(permissions);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load roles and permissions', 'Dismiss', { duration: 4000 });
      },
    });
  }

  selectRole(role: RoleResponse): void {
    this.selectedRole = role;
    this.roleForm.patchValue({
      name: role.name,
      code: role.code,
      description: role.description || '',
      roleLevel: role.roleLevel || 'END_USER',
      permissionIds: (role.permissions || []).map((permission) => permission.id),
    });
    this.roleForm.get('code')?.disable();
  }

  newRole(): void {
    this.selectedRole = null;
    this.roleForm.reset({
      name: '',
      code: '',
      description: '',
      roleLevel: 'END_USER',
      permissionIds: [],
    });
    this.roleForm.get('code')?.enable();
  }

  saveRole(): void {
    if (this.roleForm.invalid || this.isSaving) return;
    this.isSaving = true;
    const raw = this.roleForm.getRawValue();
    const payload = {
      name: raw.name || '',
      code: raw.code || '',
      description: raw.description || '',
      roleLevel: raw.roleLevel || 'END_USER',
      permissionIds: raw.permissionIds || [],
    };
    const request$ = this.selectedRole ? this.api.updateRole(this.selectedRole.id, payload) : this.api.createRole(payload);

    request$.subscribe({
      next: (role) => {
        this.isSaving = false;
        this.snackBar.open(this.selectedRole ? 'Role updated' : 'Role created', 'Dismiss', { duration: 2500 });
        this.loadData();
        this.selectRole(role);
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Unable to save role', 'Dismiss', { duration: 4000 });
      },
    });
  }

  isPermissionSelected(permissionId: string): boolean {
    return (this.roleForm.value.permissionIds || []).includes(permissionId);
  }

  togglePermission(permissionId: string, checked: boolean): void {
    const current = this.roleForm.value.permissionIds || [];
    const next = checked
      ? Array.from(new Set([...current, permissionId]))
      : current.filter((id) => id !== permissionId);
    this.roleForm.patchValue({ permissionIds: next });
  }

  selectAdminPermissions(): void {
    this.roleForm.patchValue({
      permissionIds: this.permissions.filter((permission) => permission.module === 'ADMIN').map((permission) => permission.id),
    });
  }

  formatLabel(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private groupPermissions(permissions: PermissionResponse[]): PermissionGroup[] {
    const groups = new Map<string, PermissionResponse[]>();
    permissions.forEach((permission) => {
      const list = groups.get(permission.module) || [];
      list.push(permission);
      groups.set(permission.module, list);
    });
    return Array.from(groups.entries()).map(([module, groupPermissions]) => ({
      module,
      permissions: groupPermissions.sort((a, b) => `${a.action}-${a.resource}`.localeCompare(`${b.action}-${b.resource}`)),
    }));
  }
}
