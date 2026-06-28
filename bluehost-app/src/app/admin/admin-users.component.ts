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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of, switchMap } from 'rxjs';
import { RoleResponse } from '../auth/auth.service';
import {
  AdminApiService,
  AdminUser,
  Department,
  Organization,
  PlantSite,
  SecurityProfile,
} from './admin-api.service';

@Component({
  selector: 'app-admin-users',
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
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="admin-page">
      <div class="page-title">
        <div>
          <h1>User Management</h1>
          <p>Create users, assign roles, and control account status.</p>
        </div>
        <button mat-raised-button color="primary" (click)="newUser()">
          <mat-icon>person_add</mat-icon>
          New User
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <div class="admin-layout">
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>Users</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="filters">
              <mat-form-field appearance="outline">
                <mat-label>Search</mat-label>
                <input matInput [value]="searchTerm" (input)="searchTerm = inputValue($event); loadUsers()" />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>User Type</mat-label>
                <mat-select [value]="userTypeFilter" (selectionChange)="userTypeFilter = $event.value; loadUsers()">
                  <mat-option value="">All</mat-option>
                  <mat-option *ngFor="let type of userTypes" [value]="type">{{ formatLabel(type) }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="user-list">
              <button
                type="button"
                class="user-row"
                *ngFor="let user of users; trackBy: trackById"
                [class.selected]="selectedUser?.id === user.id"
                (click)="selectUser(user)">
                <span class="avatar">{{ initials(user) }}</span>
                <span class="user-main">
                  <strong>{{ user.displayName || user.username }}</strong>
                  <small>{{ user.jobTitle || user.userType }} · {{ user.departmentName || 'No department' }}</small>
                </span>
                <span class="state" [class.inactive]="!user.isActive" [class.locked]="user.isLocked">
                  {{ user.isLocked ? 'Locked' : user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{ selectedUser ? 'Edit User' : 'Create User' }}</mat-card-title>
            <mat-card-subtitle *ngIf="selectedUser">{{ selectedUser.username }} · {{ selectedUser.employeeId }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="user-form">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Employee ID</mat-label>
                  <input matInput formControlName="employeeId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" />
                </mat-form-field>
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
                  <input matInput formControlName="email" type="email" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Phone</mat-label>
                  <input matInput formControlName="phone" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Job Title</mat-label>
                  <input matInput formControlName="jobTitle" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>User Type</mat-label>
                  <mat-select formControlName="userType">
                    <mat-option *ngFor="let type of userTypes" [value]="type">{{ formatLabel(type) }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Organization</mat-label>
                  <mat-select formControlName="organizationId">
                    <mat-option *ngFor="let org of organizations" [value]="org.id">{{ org.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Plant Site</mat-label>
                  <mat-select formControlName="plantSiteId" (selectionChange)="loadDepartments($event.value)">
                    <mat-option [value]="null">None</mat-option>
                    <mat-option *ngFor="let site of plantSites" [value]="site.id">{{ site.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Department</mat-label>
                  <mat-select formControlName="departmentId">
                    <mat-option [value]="null">None</mat-option>
                    <mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Manager</mat-label>
                  <mat-select formControlName="managerId">
                    <mat-option [value]="null">None</mat-option>
                    <mat-option *ngFor="let user of users" [value]="user.id">{{ user.displayName || user.username }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Roles</mat-label>
                <mat-select formControlName="roleIds" multiple>
                  <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.name }} ({{ role.code }})</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Security Profiles</mat-label>
                <mat-select formControlName="securityProfileIds" multiple>
                  <mat-option *ngFor="let profile of securityProfiles" [value]="profile.id">{{ profile.name }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="role-preview" *ngIf="selectedRoleNames.length">
                <span>Selected roles</span>
                <mat-chip-set>
                  <mat-chip *ngFor="let role of selectedRoleNames">{{ role }}</mat-chip>
                </mat-chip-set>
              </div>

              <div class="actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid || isSaving">
                  <mat-icon>save</mat-icon>
                  {{ isSaving ? 'Saving...' : 'Save User' }}
                </button>
                <button mat-stroked-button type="button" (click)="newUser()">Clear</button>
                <span class="spacer"></span>
                <button mat-stroked-button type="button" *ngIf="selectedUser" (click)="toggleActive()">
                  <mat-icon>{{ selectedUser.isActive ? 'person_off' : 'person' }}</mat-icon>
                  {{ selectedUser.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button mat-stroked-button type="button" *ngIf="selectedUser?.isLocked" (click)="unlockUser()">
                  <mat-icon>lock_open</mat-icon>
                  Unlock
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
    .page-title { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 16px; }
    h1 { margin: 0; color: #1B3A4B; font-size: 22px; font-weight: 650; letter-spacing: 0; }
    .page-title p { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .admin-layout { display: grid; grid-template-columns: 390px 1fr; gap: 16px; align-items: start; }
    mat-card { border-radius: 8px; border: 1px solid #d8dee8; box-shadow: none; }
    .filters { display: grid; grid-template-columns: 1fr 150px; gap: 10px; }
    .user-list { display: grid; gap: 8px; max-height: 620px; overflow: auto; padding-right: 4px; }
    .user-row { display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center; width: 100%; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; padding: 10px; text-align: left; cursor: pointer; }
    .user-row:hover, .user-row.selected { border-color: #2C5F7C; background: #f4f8fb; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #2C5F7C; color: #fff; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
    .user-main { min-width: 0; }
    .user-main strong { display: block; color: #1f2937; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-main small { display: block; color: #667085; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .state { color: #027a48; background: #ecfdf3; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 650; }
    .state.inactive { color: #667085; background: #f2f4f7; }
    .state.locked { color: #b42318; background: #fef3f2; }
    .user-form { display: grid; gap: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    mat-form-field { width: 100%; }
    .role-preview { display: grid; gap: 8px; }
    .role-preview > span { font-size: 12px; color: #667085; font-weight: 650; }
    .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .spacer { flex: 1; }
    button mat-icon { margin-right: 6px; }
    @media (max-width: 1100px) {
      .admin-layout { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  roles: RoleResponse[] = [];
  organizations: Organization[] = [];
  plantSites: PlantSite[] = [];
  departments: Department[] = [];
  securityProfiles: SecurityProfile[] = [];
  selectedUser: AdminUser | null = null;
  searchTerm = '';
  userTypeFilter = '';
  isLoading = false;
  isSaving = false;
  readonly userTypes = [
    'OPERATOR',
    'QA_SPECIALIST',
    'QUALITY_MANAGER',
    'CAPA_COORDINATOR',
    'INVESTIGATOR_SME',
    'CHANGE_OWNER',
    'DOC_CONTROL_SPECIALIST',
    'TRAINING_ADMIN',
    'AUDITOR',
    'SITE_QUALITY_HEAD',
    'SYSTEM_ADMIN',
    'EXTERNAL_SUPPLIER',
  ];

  userForm = this.fb.group({
    employeeId: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    jobTitle: [''],
    userType: ['OPERATOR', Validators.required],
    organizationId: ['', Validators.required],
    plantSiteId: [null as string | null],
    departmentId: [null as string | null],
    managerId: [null as string | null],
    roleIds: [[] as string[]],
    securityProfileIds: [[] as string[]],
  });

  constructor(
    private fb: FormBuilder,
    private api: AdminApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      roles: this.api.listRoles(),
      organizations: this.api.listOrganizations(),
      plantSites: this.api.listPlantSites(),
      departments: this.api.listDepartments(),
      securityProfiles: this.api.listSecurityProfiles(),
      users: this.api.listUsers(),
    }).subscribe({
      next: ({ roles, organizations, plantSites, departments, securityProfiles, users }) => {
        this.roles = roles;
        this.organizations = organizations;
        this.plantSites = plantSites;
        this.departments = departments;
        this.securityProfiles = securityProfiles;
        this.users = users.content || [];
        this.userForm.patchValue({ organizationId: organizations[0]?.id || '' });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Unable to load admin user data', 'Dismiss', { duration: 4000 });
      },
    });
  }

  get selectedRoleNames(): string[] {
    const selectedIds = this.userForm.value.roleIds || [];
    return this.roles.filter((role) => selectedIds.includes(role.id)).map((role) => role.name);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  loadUsers(): void {
    this.api.listUsers({ search: this.searchTerm, userType: this.userTypeFilter || undefined }).subscribe({
      next: (page) => this.users = page.content || [],
      error: () => this.snackBar.open('Unable to load users', 'Dismiss', { duration: 3000 }),
    });
  }

  loadDepartments(plantSiteId: string | null): void {
    this.api.listDepartments(plantSiteId || undefined).subscribe({
      next: (departments) => this.departments = departments,
      error: () => this.departments = [],
    });
  }

  selectUser(user: AdminUser): void {
    this.selectedUser = user;
    this.loadDepartments(user.plantSiteId || null);
    this.userForm.patchValue({
      employeeId: user.employeeId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      userType: user.userType,
      organizationId: user.organizationId,
      plantSiteId: user.plantSiteId || null,
      departmentId: user.departmentId || null,
      managerId: user.managerId || null,
      roleIds: (user.roles || []).map((role) => role.id),
      securityProfileIds: (user.securityProfiles || []).map((profile) => profile.id),
    });
    this.userForm.get('employeeId')?.disable();
    this.userForm.get('username')?.disable();
  }

  newUser(): void {
    this.selectedUser = null;
    this.userForm.reset({
      employeeId: '',
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      jobTitle: '',
      userType: 'OPERATOR',
      organizationId: this.organizations[0]?.id || '',
      plantSiteId: null,
      departmentId: null,
      managerId: null,
      roleIds: [],
      securityProfileIds: [],
    });
    this.userForm.get('employeeId')?.enable();
    this.userForm.get('username')?.enable();
  }

  saveUser(): void {
    if (this.userForm.invalid || this.isSaving) return;
    this.isSaving = true;
    const raw = this.userForm.getRawValue();
    const payload = {
      employeeId: raw.employeeId || '',
      username: raw.username || '',
      email: raw.email || '',
      firstName: raw.firstName || '',
      lastName: raw.lastName || '',
      phone: raw.phone || '',
      jobTitle: raw.jobTitle || '',
      userType: raw.userType || 'OPERATOR',
      organizationId: raw.organizationId || '',
      plantSiteId: raw.plantSiteId,
      departmentId: raw.departmentId,
      managerId: raw.managerId,
      roleIds: raw.roleIds || [],
      securityProfileIds: raw.securityProfileIds || [],
    };

    const request$ = this.selectedUser
      ? this.api.updateUser(this.selectedUser.id, payload).pipe(switchMap((user) => this.syncRoles(user, payload.roleIds || [])))
      : this.api.createUser(payload);

    request$.subscribe({
      next: (user) => {
        this.isSaving = false;
        this.snackBar.open('User saved', 'Dismiss', { duration: 2500 });
        this.loadUsers();
        this.selectUser(user);
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Unable to save user', 'Dismiss', { duration: 4000 });
      },
    });
  }

  toggleActive(): void {
    if (!this.selectedUser) return;
    this.api.updateUserStatus(this.selectedUser.id, {
      isActive: !this.selectedUser.isActive,
      reason: this.selectedUser.isActive ? 'Deactivated from admin console' : 'Activated from admin console',
    }).subscribe({
      next: () => {
        this.snackBar.open('User status updated', 'Dismiss', { duration: 2500 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Unable to update status', 'Dismiss', { duration: 3500 }),
    });
  }

  unlockUser(): void {
    if (!this.selectedUser) return;
    this.api.updateUserStatus(this.selectedUser.id, { isLocked: false, reason: 'Unlocked from admin console' }).subscribe({
      next: () => {
        this.snackBar.open('User unlocked', 'Dismiss', { duration: 2500 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Unable to unlock user', 'Dismiss', { duration: 3500 }),
    });
  }

  initials(user: AdminUser): string {
    const name = user.displayName || user.username || '';
    return name.split(/[.\s]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';
  }

  formatLabel(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private syncRoles(user: AdminUser, targetRoleIds: string[]) {
    const currentRoleIds = new Set((this.selectedUser?.roles || []).map((role) => role.id));
    const targetIds = new Set(targetRoleIds);
    const addIds = targetRoleIds.filter((roleId) => !currentRoleIds.has(roleId));
    const removeIds = Array.from(currentRoleIds).filter((roleId) => !targetIds.has(roleId));
    const operations = [
      ...addIds.map((roleId) => this.api.assignRoles(user.id, [roleId], user.plantSiteId)),
      ...removeIds.map((roleId) => this.api.removeRole(user.id, roleId)),
    ];

    if (!operations.length) return of(user);
    return forkJoin(operations).pipe(switchMap(() => this.api.listUsers({ search: user.username, size: 1 })), switchMap((page) => of(page.content?.[0] || user)));
  }
}
