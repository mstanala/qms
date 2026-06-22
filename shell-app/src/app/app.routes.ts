import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';
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
  {
    path: 'capa',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'capaMfe',
        exposedModule: './CapaModule',
      }).then((m) => m.CAPA_ROUTES),
  },
  {
    path: 'deviations',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'deviationMfe',
        exposedModule: './DeviationModule',
      }).then((m) => m.DEVIATION_ROUTES),
  },
  {
    path: 'change-control',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'changeControlMfe',
        exposedModule: './ChangeControlModule',
      }).then((m) => m.CHANGE_CONTROL_ROUTES),
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'documentMfe',
        exposedModule: './DocumentModule',
      }).then((m) => m.DOCUMENT_ROUTES),
  },
  {
    path: 'training',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'trainingMfe',
        exposedModule: './TrainingModule',
      }).then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: AdminUsersComponent },
      { path: 'roles', component: AdminRolesComponent },
      { path: 'configuration', component: AdminConfigurationComponent },
      { path: 'compliance', component: AdminComplianceComponent },
    ],
  },
  {
    path: 'tools',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'reports', pathMatch: 'full' },
      { path: 'reports', component: ToolsReportsComponent },
      { path: 'analytics', component: ToolsAnalyticsComponent },
      { path: 'audit-trail', component: ToolsAuditTrailComponent },
      { path: 'import-export', component: ToolsImportExportComponent },
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
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
