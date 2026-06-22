import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/equipment-dashboard/equipment-dashboard.component').then((m) => m.EquipmentDashboardComponent),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/equipment-list/equipment-list.component').then((m) => m.EquipmentListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/equipment-form/equipment-form.component').then((m) => m.EquipmentFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/equipment-detail/equipment-detail.component').then((m) => m.EquipmentDetailComponent),
  },
  {
    path: ':id/calibrations',
    loadComponent: () =>
      import('./components/calibration-list/calibration-list.component').then((m) => m.CalibrationListComponent),
  },
];
