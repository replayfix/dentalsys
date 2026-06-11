import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { NuevaConsultaComponent } from './pages/nueva-consulta/nueva-consulta';
import { AtencionesComponent } from './pages/atenciones/atenciones';
import { InventarioComponent } from './pages/inventario/inventario'; // 👈 Importación obligatoria

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'pacientes', component: PacientesComponent },
  { path: 'nueva-consulta', component: NuevaConsultaComponent },
  { path: 'atenciones', component: AtencionesComponent },
  { path: 'inventario', component: InventarioComponent } // 👈 Mapeo de ruta habilitado
];