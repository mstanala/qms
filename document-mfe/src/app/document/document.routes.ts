import { Routes } from '@angular/router';

export const DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/doc-dashboard/doc-dashboard.component').then(
        (m) => m.DocDashboardComponent
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/doc-list/doc-list.component').then(
        (m) => m.DocListComponent
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/doc-form/doc-form.component').then(
        (m) => m.DocFormComponent
      ),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/doc-detail/doc-detail.component').then(
        (m) => m.DocDetailComponent
      ),
  },
];