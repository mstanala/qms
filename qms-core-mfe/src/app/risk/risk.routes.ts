import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const RISK_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'RISK', action: 'READ', resource: 'risk_register' } },
    loadComponent: () =>
      import('./components/risk-dashboard/risk-dashboard.component').then(
        (m) => m.RiskDashboardComponent
      ),
  },
  {
    path: 'registers',
    canActivate: [permissionGuard],
    data: { permission: { module: 'RISK', action: 'READ', resource: 'risk_register' } },
    loadComponent: () =>
      import('./components/risk-register-list/risk-register-list.component').then(
        (m) => m.RiskRegisterListComponent
      ),
  },
  {
    path: 'registers/create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'RISK', action: 'CREATE', resource: 'risk_register' } },
    loadComponent: () =>
      import('./components/risk-register-form/risk-register-form.component').then(
        (m) => m.RiskRegisterFormComponent
      ),
  },
  {
    path: 'registers/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'RISK', action: 'READ', resource: 'risk_register' } },
    loadComponent: () =>
      import('./components/risk-register-detail/risk-register-detail.component').then(
        (m) => m.RiskRegisterDetailComponent
      ),
  },
  {
    path: 'matrix',
    canActivate: [permissionGuard],
    data: { permission: { module: 'RISK', action: 'READ', resource: 'risk_assessment' } },
    loadComponent: () =>
      import('./components/risk-matrix/risk-matrix.component').then(
        (m) => m.RiskMatrixComponent
      ),
  },
];
