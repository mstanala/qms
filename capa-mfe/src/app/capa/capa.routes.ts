import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const CAPA_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CAPA', action: 'READ', resource: 'capa_record' } },
    loadComponent: () =>
      import('./components/capa-dashboard/capa-dashboard.component').then(
        (m) => m.CapaDashboardComponent
      ),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CAPA', action: 'READ', resource: 'capa_record' } },
    loadComponent: () =>
      import('./components/capa-list/capa-list.component').then(
        (m) => m.CapaListComponent
      ),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CAPA', action: 'CREATE', resource: 'capa_record' } },
    loadComponent: () =>
      import('./components/capa-form/capa-form.component').then(
        (m) => m.CapaFormComponent
      ),
  },
  {
    path: 'edit/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CAPA', action: 'UPDATE', resource: 'capa_record' } },
    loadComponent: () =>
      import('./components/capa-form/capa-form.component').then(
        (m) => m.CapaFormComponent
      ),
  },
  {
    path: 'detail/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CAPA', action: 'READ', resource: 'capa_record' } },
    loadComponent: () =>
      import('./components/capa-detail/capa-detail.component').then(
        (m) => m.CapaDetailComponent
      ),
  },
  {
    path: 'rca/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'CAPA', action: 'UPDATE', resource: 'capa_record' } },
    loadComponent: () =>
      import('./components/root-cause-analysis/root-cause-analysis.component').then(
        (m) => m.RootCauseAnalysisComponent
      ),
  },
];
