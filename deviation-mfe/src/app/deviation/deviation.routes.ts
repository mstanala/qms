import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const DEVIATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'READ', resource: 'deviation_record' } },
    loadComponent: () =>
      import('./components/deviation-dashboard/deviation-dashboard.component').then(
        (m) => m.DeviationDashboardComponent
      ),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'READ', resource: 'deviation_record' } },
    loadComponent: () =>
      import('./components/deviation-list/deviation-list.component').then(
        (m) => m.DeviationListComponent
      ),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'CREATE', resource: 'deviation_record' } },
    loadComponent: () =>
      import('./components/deviation-form/deviation-form.component').then(
        (m) => m.DeviationFormComponent
      ),
  },
  {
    path: 'edit/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'UPDATE', resource: 'deviation_record' } },
    loadComponent: () =>
      import('./components/deviation-form/deviation-form.component').then(
        (m) => m.DeviationFormComponent
      ),
  },
  {
    path: 'detail/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DEVIATION', action: 'READ', resource: 'deviation_record' } },
    loadComponent: () =>
      import('./components/deviation-detail/deviation-detail.component').then(
        (m) => m.DeviationDetailComponent
      ),
  },
];
