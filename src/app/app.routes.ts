import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { NuevaConsultaComponent } from './pages/nueva-consulta/nueva-consulta';

export const routes: Routes = [
  // Redirección por defecto
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  
  { path: 'inicio', component: InicioComponent },
  
  // 👇 ¡Asegúrate de que esta línea termine con una coma! 👇
  { path: 'pacientes', component: PacientesComponent }, 
  
  { path: 'nueva-consulta', component: NuevaConsultaComponent }
];