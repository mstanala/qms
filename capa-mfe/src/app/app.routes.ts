import { Routes } from '@angular/router';
import { CAPA_ROUTES } from './capa/capa.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'capa',
    pathMatch: 'full',
  },
  {
    path: 'capa',
    children: CAPA_ROUTES,
  },
];
