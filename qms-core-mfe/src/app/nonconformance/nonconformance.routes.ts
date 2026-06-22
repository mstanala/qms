import { Routes } from '@angular/router';

export const NONCONFORMANCE_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/nc-dashboard/nc-dashboard.component').then((m) => m.NcDashboardComponent),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/nc-list/nc-list.component').then((m) => m.NcListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/nc-form/nc-form.component').then((m) => m.NcFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/nc-detail/nc-detail.component').then((m) => m.NcDetailComponent),
  },
];
