import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
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
import { AiDashboardComponent } from './ai/ai-dashboard.component';

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
  {
    path: 'capa',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'CAPA', action: 'READ', resource: 'capa_record' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'capaMfe',
        exposedModule: './CapaModule',
      }).then((m) => m.CAPA_ROUTES),
  },
  {
    path: 'deviations',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'READ', resource: 'deviation_record' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'deviationMfe',
        exposedModule: './DeviationModule',
      }).then((m) => m.DEVIATION_ROUTES),
  },
  {
    path: 'change-control',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'READ', resource: 'change_request' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'changeControlMfe',
        exposedModule: './ChangeControlModule',
      }).then((m) => m.CHANGE_CONTROL_ROUTES),
  },
  {
    path: 'documents',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'DOCUMENT', action: 'READ', resource: 'document' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'documentMfe',
        exposedModule: './DocumentModule',
      }).then((m) => m.DOCUMENT_ROUTES),
  },
  {
    path: 'training',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'trainingMfe',
        exposedModule: './TrainingModule',
      }).then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'risk',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'RISK', action: 'READ', resource: 'risk_register' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'qmsCoreMfe',
        exposedModule: './RiskModule',
      }).then((m) => m.RISK_ROUTES),
  },
  {
    path: 'audit',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'AUDIT', action: 'READ', resource: 'audit' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'qmsCoreMfe',
        exposedModule: './AuditModule',
      }).then((m) => m.AUDIT_ROUTES),
  },
  {
    path: 'supplier',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'SUPPLIER', action: 'READ', resource: 'supplier' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'qmsCoreMfe',
        exposedModule: './SupplierModule',
      }).then((m) => m.SUPPLIER_ROUTES),
  },
  {
    path: 'complaint',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'COMPLAINT', action: 'READ', resource: 'complaint' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'qmsCoreMfe',
        exposedModule: './ComplaintModule',
      }).then((m) => m.COMPLAINT_ROUTES),
  },
  {
    path: 'nonconformance',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'NONCONFORMANCE', action: 'READ', resource: 'nonconformance' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'qmsCoreMfe',
        exposedModule: './NonconformanceModule',
      }).then((m) => m.NONCONFORMANCE_ROUTES),
  },
  {
    path: 'equipment',
    canActivate: [authGuard, permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'qmsCoreMfe',
        exposedModule: './EquipmentModule',
      }).then((m) => m.EQUIPMENT_ROUTES),
  },
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
  {
    path: 'ai',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AiDashboardComponent },
    ],
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
