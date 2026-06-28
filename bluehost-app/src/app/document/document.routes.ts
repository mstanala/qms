import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DOCUMENT', action: 'READ', resource: 'document' } },
    loadComponent: () =>
      import('./components/doc-dashboard/doc-dashboard.component').then(
        (m) => m.DocDashboardComponent
      ),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DOCUMENT', action: 'READ', resource: 'document' } },
    loadComponent: () =>
      import('./components/doc-list/doc-list.component').then(
        (m) => m.DocListComponent
      ),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DOCUMENT', action: 'CREATE', resource: 'document' } },
    loadComponent: () =>
      import('./components/doc-form/doc-form.component').then(
        (m) => m.DocFormComponent
      ),
  },
  {
    path: 'detail/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'DOCUMENT', action: 'READ', resource: 'document' } },
    loadComponent: () =>
      import('./components/doc-detail/doc-detail.component').then(
        (m) => m.DocDetailComponent
      ),
  },
];
