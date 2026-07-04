import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const COMPLAINT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'COMPLAINT', action: 'READ', resource: 'complaint' } },
    loadComponent: () =>
      import('./components/complaint-dashboard/complaint-dashboard.component').then((m) => m.ComplaintDashboardComponent),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'COMPLAINT', action: 'READ', resource: 'complaint' } },
    loadComponent: () =>
      import('./components/complaint-list/complaint-list.component').then((m) => m.ComplaintListComponent),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'COMPLAINT', action: 'CREATE', resource: 'complaint' } },
    loadComponent: () =>
      import('./components/complaint-form/complaint-form.component').then((m) => m.ComplaintFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'COMPLAINT', action: 'READ', resource: 'complaint' } },
    loadComponent: () =>
      import('./components/complaint-detail/complaint-detail.component').then((m) => m.ComplaintDetailComponent),
  },
];
