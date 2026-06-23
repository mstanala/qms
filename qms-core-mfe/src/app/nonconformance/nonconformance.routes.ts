import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const NONCONFORMANCE_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'NONCONFORMANCE', action: 'READ', resource: 'nonconformance' } },
    loadComponent: () =>
      import('./components/nc-dashboard/nc-dashboard.component').then((m) => m.NcDashboardComponent),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'NONCONFORMANCE', action: 'READ', resource: 'nonconformance' } },
    loadComponent: () =>
      import('./components/nc-list/nc-list.component').then((m) => m.NcListComponent),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'NONCONFORMANCE', action: 'CREATE', resource: 'nonconformance' } },
    loadComponent: () =>
      import('./components/nc-form/nc-form.component').then((m) => m.NcFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'NONCONFORMANCE', action: 'READ', resource: 'nonconformance' } },
    loadComponent: () =>
      import('./components/nc-detail/nc-detail.component').then((m) => m.NcDetailComponent),
  },
];
