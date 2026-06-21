import { Routes } from '@angular/router';
import { CHANGE_CONTROL_ROUTES } from './change-control/change-control.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'change-control',
    pathMatch: 'full',
  },
  {
    path: 'change-control',
    children: CHANGE_CONTROL_ROUTES,
  },
];
