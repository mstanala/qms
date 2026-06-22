import { Routes } from '@angular/router';

export const SUPPLIER_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/supplier-dashboard/supplier-dashboard.component').then((m) => m.SupplierDashboardComponent),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/supplier-list/supplier-list.component').then((m) => m.SupplierListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/supplier-detail/supplier-detail.component').then((m) => m.SupplierDetailComponent),
  },
];
