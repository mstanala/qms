import { Routes } from '@angular/router';
import { TRAINING_ROUTES } from './training/training.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'training',
    pathMatch: 'full',
  },
  {
    path: 'training',
    children: TRAINING_ROUTES,
  },
];