import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const AUDIT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'AUDIT', action: 'READ', resource: 'audit' } },
    loadComponent: () =>
      import('./components/audit-dashboard/audit-dashboard.component').then((m) => m.AuditDashboardComponent),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'AUDIT', action: 'READ', resource: 'audit' } },
    loadComponent: () =>
      import('./components/audit-list/audit-list.component').then((m) => m.AuditListComponent),
  },
  {
    path: 'plans',
    canActivate: [permissionGuard],
    data: { permission: { module: 'AUDIT', action: 'READ', resource: 'audit' } },
    loadComponent: () =>
      import('./components/audit-plan-list/audit-plan-list.component').then((m) => m.AuditPlanListComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'AUDIT', action: 'READ', resource: 'audit' } },
    loadComponent: () =>
      import('./components/audit-detail/audit-detail.component').then((m) => m.AuditDetailComponent),
  },
];
