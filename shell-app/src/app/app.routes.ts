import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'capa',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'capaMfe',
        exposedModule: './CapaModule',
      }).then((m) => m.CAPA_ROUTES),
  },
  {
    path: 'deviations',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'deviationMfe',
        exposedModule: './DeviationModule',
      }).then((m) => m.DEVIATION_ROUTES),
  },
  {
    path: 'change-control',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'changeControlMfe',
        exposedModule: './ChangeControlModule',
      }).then((m) => m.CHANGE_CONTROL_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
