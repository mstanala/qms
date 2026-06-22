import { Routes } from '@angular/router';
import { DOCUMENT_ROUTES } from './document/document.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'document',
    pathMatch: 'full',
  },
  {
    path: 'document',
    children: DOCUMENT_ROUTES,
  },
];