import { Routes } from '@angular/router';

export const CAPA_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/capa-dashboard/capa-dashboard.component').then(
        (m) => m.CapaDashboardComponent
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/capa-list/capa-list.component').then(
        (m) => m.CapaListComponent
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/capa-form/capa-form.component').then(
        (m) => m.CapaFormComponent
      ),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/capa-detail/capa-detail.component').then(
        (m) => m.CapaDetailComponent
      ),
  },
  {
    path: 'rca/:id',
    loadComponent: () =>
      import('./components/root-cause-analysis/root-cause-analysis.component').then(
        (m) => m.RootCauseAnalysisComponent
      ),
  },
];
