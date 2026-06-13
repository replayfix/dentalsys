import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { InicioComponent } from './pages/inicio/inicio';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { NuevaConsultaComponent } from './pages/nueva-consulta/nueva-consulta';
import { AtencionesComponent } from './pages/atenciones/atenciones';
import { InventarioComponent } from './pages/inventario/inventario';
import { ExpedienteComponent } from './pages/expediente/expediente';
import { authGuard } from './core/guards/auth.guard'; 

export const routes: Routes = [
  // Ruta pública inicial
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Rutas privadas protegidas por el token de Firebase
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: 'pacientes', component: PacientesComponent, canActivate: [authGuard] },
  { path: 'nueva-consulta', component: NuevaConsultaComponent, canActivate: [authGuard] },
  { path: 'atenciones', component: AtencionesComponent, canActivate: [authGuard] },
  { path: 'inventario', component: InventarioComponent, canActivate: [authGuard] },
  { path: 'expediente', component: ExpedienteComponent, canActivate: [authGuard] },
  
  // NUEVA RUTA DE LA AGENDA: Configurada con Lazy Loading reactivo y protegida
  { 
    path: 'agenda', 
    loadComponent: () => import('./pages/agenda/agenda').then(m => m.AgendaComponent), 
    canActivate: [authGuard] 
  },

  // 👈 INTEGRADO: NUEVA RUTA DEL CATÁLOGO DE TRATAMIENTOS MÉDICOS
  { 
    path: 'tratamientos', 
    loadComponent: () => import('./pages/tratamientos/tratamientos').then(m => m.TratamientosComponent), 
    canActivate: [authGuard] 
  },
  
  // Comodín para rebotar desvíos (Siempre al final)
  { path: '**', redirectTo: '/login' }
];