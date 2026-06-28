import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';
import { permissionGuard } from './auth/permission.guard';
import { AdminUsersComponent } from './admin/admin-users.component';
import { AdminRolesComponent } from './admin/admin-roles.component';
import { AdminConfigurationComponent } from './admin/admin-configuration.component';
import { AdminComplianceComponent } from './admin/admin-compliance.component';
import { ToolsReportsComponent } from './tools/tools-reports.component';
import { ToolsAnalyticsComponent } from './tools/tools-analytics.component';
import { ToolsAuditTrailComponent } from './tools/tools-audit-trail.component';
import { ToolsImportExportComponent } from './tools/tools-import-export.component';
import { MyProfileComponent } from './profile/my-profile.component';
import { PreferencesComponent } from './profile/preferences.component';
import { ActivityLogComponent } from './profile/activity-log.component';
import { NotificationsComponent } from './notifications/notifications.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },

  // --- CAPA Module (from capa-mfe) ---
  {
    path: 'capa',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'CAPA', action: 'READ', resource: 'capa_record' } },
    loadChildren: () =>
      import('./capa/capa.routes').then((m) => m.CAPA_ROUTES),
  },

  // --- Deviation Module (from deviation-mfe) ---
  {
    path: 'deviations',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'READ', resource: 'deviation_record' } },
    loadChildren: () =>
      import('./deviation/deviation.routes').then((m) => m.DEVIATION_ROUTES),
  },

  // --- Change Control Module (from change-control-mfe) ---
  {
    path: 'change-control',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'READ', resource: 'change_request' } },
    loadChildren: () =>
      import('./change-control/change-control.routes').then((m) => m.CHANGE_CONTROL_ROUTES),
  },

  // --- Document Module (from document-mfe) ---
  {
    path: 'documents',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'DOCUMENT', action: 'READ', resource: 'document' } },
    loadChildren: () =>
      import('./document/document.routes').then((m) => m.DOCUMENT_ROUTES),
  },

  // --- Training Module (from training-mfe) ---
  {
    path: 'training',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadChildren: () =>
      import('./training/training.routes').then((m) => m.TRAINING_ROUTES),
  },

  // --- Risk Module (from qms-core-mfe) ---
  {
    path: 'risk',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'RISK', action: 'READ', resource: 'risk_register' } },
    loadChildren: () =>
      import('./risk/risk.routes').then((m) => m.RISK_ROUTES),
  },

  // --- Audit Module (from qms-core-mfe) ---
  {
    path: 'audit',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'AUDIT', action: 'READ', resource: 'audit' } },
    loadChildren: () =>
      import('./audit/audit.routes').then((m) => m.AUDIT_ROUTES),
  },

  // --- Supplier Module (from qms-core-mfe) ---
  {
    path: 'supplier',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'SUPPLIER', action: 'READ', resource: 'supplier' } },
    loadChildren: () =>
      import('./supplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
  },

  // --- Complaint Module (from qms-core-mfe) ---
  {
    path: 'complaint',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'COMPLAINT', action: 'READ', resource: 'complaint' } },
    loadChildren: () =>
      import('./complaint/complaint.routes').then((m) => m.COMPLAINT_ROUTES),
  },

  // --- Nonconformance Module (from qms-core-mfe) ---
  {
    path: 'nonconformance',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'NONCONFORMANCE', action: 'READ', resource: 'nonconformance' } },
    loadChildren: () =>
      import('./nonconformance/nonconformance.routes').then((m) => m.NONCONFORMANCE_ROUTES),
  },

  // --- Equipment Module (from qms-core-mfe) ---
  {
    path: 'equipment',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadChildren: () =>
      import('./equipment/equipment.routes').then((m) => m.EQUIPMENT_ROUTES),
  },

  // --- Admin Section (from shell-app) ---
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: AdminUsersComponent, canActivate: [permissionGuard], data: { permission: { module: 'ADMIN', action: 'READ', resource: 'user' } } },
      { path: 'roles', component: AdminRolesComponent, canActivate: [permissionGuard], data: { permission: { module: 'ADMIN', action: 'CONFIGURE', resource: 'system' } } },
      { path: 'configuration', component: AdminConfigurationComponent, canActivate: [permissionGuard], data: { permission: { module: 'ADMIN', action: 'CONFIGURE', resource: 'system' } } },
      { path: 'compliance', component: AdminComplianceComponent, canActivate: [permissionGuard], data: { permission: { module: 'ADMIN', action: 'CONFIGURE', resource: 'system' } } },
    ],
  },

  // --- Tools Section (from shell-app) ---
  {
    path: 'tools',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'reports', pathMatch: 'full' },
      { path: 'reports', component: ToolsReportsComponent, canActivate: [permissionGuard], data: { permission: { module: 'REPORT', action: 'READ', resource: 'dashboard' } } },
      { path: 'analytics', component: ToolsAnalyticsComponent, canActivate: [permissionGuard], data: { permission: { module: 'REPORT', action: 'READ', resource: 'analytics' } } },
      { path: 'audit-trail', component: ToolsAuditTrailComponent, canActivate: [permissionGuard], data: { permission: { module: 'ADMIN', action: 'READ', resource: 'audit_trail' } } },
      { path: 'import-export', component: ToolsImportExportComponent, canActivate: [permissionGuard], data: { permission: { module: 'REPORT', action: 'EXPORT', resource: 'report' } } },
    ],
  },

  // --- Profile Section (from shell-app) ---
  {
    path: 'profile',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'me', pathMatch: 'full' },
      { path: 'me', component: MyProfileComponent },
      { path: 'preferences', component: PreferencesComponent },
      { path: 'activity', component: ActivityLogComponent },
    ],
  },

  // --- Notifications ---
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard],
  },

  // --- Catch-all ---
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
