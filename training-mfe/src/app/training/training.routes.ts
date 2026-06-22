import { Routes } from '@angular/router';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/training-dashboard/training-dashboard.component').then(
        (m) => m.TrainingDashboardComponent
      ),
  },
  {
    path: 'curricula',
    loadComponent: () =>
      import('./components/curriculum-list/curriculum-list.component').then(
        (m) => m.CurriculumListComponent
      ),
  },
  {
    path: 'curricula/create',
    loadComponent: () =>
      import('./components/curriculum-form/curriculum-form.component').then(
        (m) => m.CurriculumFormComponent
      ),
  },
  {
    path: 'curricula/:id',
    loadComponent: () =>
      import('./components/curriculum-detail/curriculum-detail.component').then(
        (m) => m.CurriculumDetailComponent
      ),
  },
  {
    path: 'assignments',
    loadComponent: () =>
      import('./components/assignment-list/assignment-list.component').then(
        (m) => m.AssignmentListComponent
      ),
  },
  {
    path: 'matrix',
    loadComponent: () =>
      import('./components/training-matrix/training-matrix.component').then(
        (m) => m.TrainingMatrixComponent
      ),
  },
  {
    path: 'my-training',
    loadComponent: () =>
      import('./components/my-training/my-training.component').then(
        (m) => m.MyTrainingComponent
      ),
  },
];