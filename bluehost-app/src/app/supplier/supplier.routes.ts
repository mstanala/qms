import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const SUPPLIER_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'SUPPLIER', action: 'READ', resource: 'supplier' } },
    loadComponent: () =>
      import('./components/supplier-dashboard/supplier-dashboard.component').then((m) => m.SupplierDashboardComponent),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'SUPPLIER', action: 'READ', resource: 'supplier' } },
    loadComponent: () =>
      import('./components/supplier-list/supplier-list.component').then((m) => m.SupplierListComponent),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'SUPPLIER', action: 'CREATE', resource: 'supplier' } },
    loadComponent: () =>
      import('./components/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'SUPPLIER', action: 'READ', resource: 'supplier' } },
    loadComponent: () =>
      import('./components/supplier-detail/supplier-detail.component').then((m) => m.SupplierDetailComponent),
  },
];
