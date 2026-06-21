import { Routes } from '@angular/router';
import { DEVIATION_ROUTES } from './deviation/deviation.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'deviation',
    pathMatch: 'full',
  },
  {
    path: 'deviation',
    children: DEVIATION_ROUTES,
  },
];
