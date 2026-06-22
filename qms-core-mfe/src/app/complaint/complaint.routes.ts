import { Routes } from '@angular/router';

export const COMPLAINT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/complaint-dashboard/complaint-dashboard.component').then((m) => m.ComplaintDashboardComponent),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/complaint-list/complaint-list.component').then((m) => m.ComplaintListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/complaint-form/complaint-form.component').then((m) => m.ComplaintFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/complaint-detail/complaint-detail.component').then((m) => m.ComplaintDetailComponent),
  },
];
