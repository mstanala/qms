import { Routes } from '@angular/router';

export const RISK_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/risk-dashboard/risk-dashboard.component').then(
        (m) => m.RiskDashboardComponent
      ),
  },
  {
    path: 'registers',
    loadComponent: () =>
      import('./components/risk-register-list/risk-register-list.component').then(
        (m) => m.RiskRegisterListComponent
      ),
  },
  {
    path: 'registers/create',
    loadComponent: () =>
      import('./components/risk-register-form/risk-register-form.component').then(
        (m) => m.RiskRegisterFormComponent
      ),
  },
  {
    path: 'registers/:id',
    loadComponent: () =>
      import('./components/risk-register-detail/risk-register-detail.component').then(
        (m) => m.RiskRegisterDetailComponent
      ),
  },
  {
    path: 'matrix',
    loadComponent: () =>
      import('./components/risk-matrix/risk-matrix.component').then(
        (m) => m.RiskMatrixComponent
      ),
  },
];
