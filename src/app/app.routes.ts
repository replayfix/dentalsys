import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { AtencionesComponent } from './pages/atenciones/atenciones';

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'pacientes', component: PacientesComponent },
  { path: 'atenciones', component: AtencionesComponent },
  { path: '**', redirectTo: '/inicio' }
];