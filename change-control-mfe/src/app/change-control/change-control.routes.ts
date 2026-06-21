import { Routes } from '@angular/router';

export const CHANGE_CONTROL_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/cc-dashboard/cc-dashboard.component').then(
        (m) => m.CcDashboardComponent
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/cc-list/cc-list.component').then(
        (m) => m.CcListComponent
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/cc-form/cc-form.component').then(
        (m) => m.CcFormComponent
      ),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/cc-detail/cc-detail.component').then(
        (m) => m.CcDetailComponent
      ),
  },
];
