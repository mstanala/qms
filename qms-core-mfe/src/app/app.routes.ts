import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'risk',
    loadChildren: () =>
      import('./risk/risk.routes').then((m) => m.RISK_ROUTES),
  },
  {
    path: 'audit',
    loadChildren: () =>
      import('./audit/audit.routes').then((m) => m.AUDIT_ROUTES),
  },
  {
    path: 'supplier',
    loadChildren: () =>
      import('./supplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
  },
  {
    path: 'complaint',
    loadChildren: () =>
      import('./complaint/complaint.routes').then((m) => m.COMPLAINT_ROUTES),
  },
  {
    path: 'nonconformance',
    loadChildren: () =>
      import('./nonconformance/nonconformance.routes').then((m) => m.NONCONFORMANCE_ROUTES),
  },
  {
    path: 'equipment',
    loadChildren: () =>
      import('./equipment/equipment.routes').then((m) => m.EQUIPMENT_ROUTES),
  },
  {
    path: '',
    redirectTo: 'risk',
    pathMatch: 'full',
  },
];
