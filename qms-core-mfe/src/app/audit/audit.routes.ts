import { Routes } from '@angular/router';

export const AUDIT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/audit-dashboard/audit-dashboard.component').then((m) => m.AuditDashboardComponent),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/audit-list/audit-list.component').then((m) => m.AuditListComponent),
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./components/audit-plan-list/audit-plan-list.component').then((m) => m.AuditPlanListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/audit-detail/audit-detail.component').then((m) => m.AuditDetailComponent),
  },
];
