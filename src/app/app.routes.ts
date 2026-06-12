import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { NuevaConsultaComponent } from './pages/nueva-consulta/nueva-consulta';
import { AtencionesComponent } from './pages/atenciones/atenciones';
import { InventarioComponent } from './pages/inventario/inventario';
import { ExpedienteComponent } from './pages/expediente/expediente'; // 👈 IMPORTA ESTO

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'pacientes', component: PacientesComponent },
  { path: 'nueva-consulta', component: NuevaConsultaComponent },
  { path: 'atenciones', component: AtencionesComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'expediente', component: ExpedienteComponent } // 👈 RUTA MAPEADA CON ÉXITO
];