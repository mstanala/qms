import { Routes } from '@angular/router';

export const DEVIATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/deviation-dashboard/deviation-dashboard.component').then(
        (m) => m.DeviationDashboardComponent
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/deviation-list/deviation-list.component').then(
        (m) => m.DeviationListComponent
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/deviation-form/deviation-form.component').then(
        (m) => m.DeviationFormComponent
      ),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/deviation-form/deviation-form.component').then(
        (m) => m.DeviationFormComponent
      ),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/deviation-detail/deviation-detail.component').then(
        (m) => m.DeviationDetailComponent
      ),
  },
];
