import { Routes } from '@angular/router';
import { permissionGuard } from '../permission.guard';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/training-dashboard/training-dashboard.component').then(
        (m) => m.TrainingDashboardComponent
      ),
  },
  {
    path: 'curricula',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/curriculum-list/curriculum-list.component').then(
        (m) => m.CurriculumListComponent
      ),
  },
  {
    path: 'curricula/create',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'CREATE', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/curriculum-form/curriculum-form.component').then(
        (m) => m.CurriculumFormComponent
      ),
  },
  {
    path: 'curricula/:id',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/curriculum-detail/curriculum-detail.component').then(
        (m) => m.CurriculumDetailComponent
      ),
  },
  {
    path: 'assignments',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'ASSIGN', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/assignment-list/assignment-list.component').then(
        (m) => m.AssignmentListComponent
      ),
  },
  {
    path: 'matrix',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/training-matrix/training-matrix.component').then(
        (m) => m.TrainingMatrixComponent
      ),
  },
  {
    path: 'my-training',
    canActivate: [permissionGuard],
    data: { permission: { module: 'TRAINING', action: 'READ', resource: 'training_record' } },
    loadComponent: () =>
      import('./components/my-training/my-training.component').then(
        (m) => m.MyTrainingComponent
      ),
  },
];
