import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'capa',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'capaMfe',
        exposedModule: './CapaModule',
      }).then((m) => m.CAPA_ROUTES),
  },
  {
    path: 'deviations',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'deviationMfe',
        exposedModule: './DeviationModule',
      }).then((m) => m.DEVIATION_ROUTES),
  },
  {
    path: 'change-control',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'changeControlMfe',
        exposedModule: './ChangeControlModule',
      }).then((m) => m.CHANGE_CONTROL_ROUTES),
  },
];
