import { Routes } from '@angular/router';
// Recuerda que los archivos ahora se llaman .ts
import { Inicio } from './pages/inicio/inicio';
import { Pacientes } from './pages/pacientes/pacientes';
import { Atenciones } from './pages/atenciones/atenciones';

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio },
  { path: 'pacientes', component: Pacientes },
  { path: 'atenciones', component: Atenciones},
  { path: '**', redirectTo: '/inicio' } // Ruta comodín para redirigir si hay error
];