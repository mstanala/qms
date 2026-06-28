import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const CHANGE_CONTROL_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'READ', resource: 'change_request' } },
    loadComponent: () =>
      import('./components/cc-dashboard/cc-dashboard.component').then(
        (m) => m.CcDashboardComponent
      ),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'READ', resource: 'change_request' } },
    loadComponent: () =>
      import('./components/cc-list/cc-list.component').then(
        (m) => m.CcListComponent
      ),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'CREATE', resource: 'change_request' } },
    loadComponent: () =>
      import('./components/cc-form/cc-form.component').then(
        (m) => m.CcFormComponent
      ),
  },
  {
    path: 'edit/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'UPDATE', resource: 'change_request' } },
    loadComponent: () =>
      import('./components/cc-form/cc-form.component').then(
        (m) => m.CcFormComponent
      ),
  },
  {
    path: 'detail/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CHANGE_CONTROL', action: 'READ', resource: 'change_request' } },
    loadComponent: () =>
      import('./components/cc-detail/cc-detail.component').then(
        (m) => m.CcDetailComponent
      ),
  },
];
