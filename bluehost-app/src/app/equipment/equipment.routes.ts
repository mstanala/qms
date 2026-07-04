import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const EQUIPMENT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadComponent: () =>
      import('./components/equipment-dashboard/equipment-dashboard.component').then((m) => m.EquipmentDashboardComponent),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadComponent: () =>
      import('./components/equipment-list/equipment-list.component').then((m) => m.EquipmentListComponent),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'CREATE', resource: 'equipment' } },
    loadComponent: () =>
      import('./components/equipment-form/equipment-form.component').then((m) => m.EquipmentFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadComponent: () =>
      import('./components/equipment-detail/equipment-detail.component').then((m) => m.EquipmentDetailComponent),
  },
  {
    path: ':id/calibrations',
    canActivate: [permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadComponent: () =>
      import('./components/calibration-list/calibration-list.component').then((m) => m.CalibrationListComponent),
  },
  {
    path: ':id/maintenance',
    canActivate: [permissionGuard],
    data: { permission: { module: 'EQUIPMENT', action: 'READ', resource: 'equipment' } },
    loadComponent: () =>
      import('./components/maintenance-list/maintenance-list.component').then((m) => m.MaintenanceListComponent),
  },
];
