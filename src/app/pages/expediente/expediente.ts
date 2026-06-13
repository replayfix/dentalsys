import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsultasService, Consulta } from '../../core/services/consultas';
import { PacientesService } from '../../core/services/pacientes'; // Inyectamos el servicio de pacientes para recuperar nombres

export interface HallazgoDental {
  numero: number;
  cara: string;
  state: string;
  badgeClase: string;
}

@Component({
  selector: 'app-expediente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './expediente.html',
  styleUrls: ['./expediente.scss']
})
export class ExpedienteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private consultasService = inject(ConsultasService);
  private pacientesService = inject(PacientesService); // Referencia del servicio de pacientes
  private cdr = inject(ChangeDetectorRef);

  pacienteId: string = '';
  pacienteNombre: string = 'Paciente';
  consultasPaciente: Consulta[] = [];
  cargando: boolean = true;

  // Controladores para el modal de visualización detallada
  mostrarModalDetalle: boolean = false;
  consultaSeleccionada: Consulta | null = null;
  hallazgosDeteccion: HallazgoDental[] = [];

  ngOnInit() {
    // 1. Capturamos y escuchamos de forma reactiva los parámetros de la URL (?id=xxxx)
    this.route.queryParams.subscribe(params => {
      this.pacienteId = params['id'] || '';
      
      // Intentamos recuperar el nombre si viene directo en la URL
      const nombreUrl = params['nombre'];
      
      if (this.pacienteId) {
        console.log('Cargar automáticamente el expediente del paciente con ID:', this.pacienteId);
        
        if (nombreUrl) {
          this.pacienteNombre = nombreUrl;
        } else {
          // Si no viene el nombre (desde el Dashboard), lo recuperamos cruzando datos en tiempo real
          this.recuperarNombrePaciente();
        }

        this.cargarHistorialFiltrado();
      } else {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // INTERNO DE QA VISUAL
  private recuperarNombrePaciente() {
    this.pacientesService.pacientes$.subscribe({
      next: (todosLosPacientes) => {
        const pacienteEncontrado = todosLosPacientes.find(p => p.id === this.pacienteId);
        if (pacienteEncontrado) {
          this.pacienteNombre = pacienteEncontrado.nombre;
          this.cdr.detectChanges();
        }
      }
    });
  }

  private cargarHistorialFiltrado() {
    // 2. Escuchamos las consultas globales y filtramos por el paciente
    this.consultasService.consultas$.subscribe({
      next: (todasLasConsultas) => {
        this.consultasPaciente = todasLasConsultas.filter(
          c => c.pacienteId === this.pacienteId
        );
        
        // Control de rescate secundario para el nombre del paciente si los servicios se cruzan
        if (this.pacienteNombre === 'Paciente' && this.consultasPaciente.length > 0) {
          this.pacienteNombre = this.consultasPaciente[0].pacienteNombre || 'Paciente';
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar expediente:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verFichaDetallada(consulta: Consulta) {
    this.consultaSeleccionada = consulta;
    this.hallazgosDeteccion = this.extraerHallazgosClinicos(consulta);
    this.mostrarModalDetalle = true;
    this.cdr.detectChanges();
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.consultaSeleccionada = null;
    this.hallazgosDeteccion = [];
    this.cdr.detectChanges();
  }

  // Analiza dinámicamente el plan de tratamientos o el JSON del odontograma guardado
  private extraerHallazgosClinicos(consulta: any): HallazgoDental[] {
    const lista: HallazgoDental[] = [];

    // 1. 👈 SISTEMA NUEVO: Extracción por lista de tratamientos estructurados
    if (consulta.planTratamientoLista && Array.isArray(consulta.planTratamientoLista) && consulta.planTratamientoLista.length > 0) {
      consulta.planTratamientoLista.forEach((item: any) => {
        const esEncontrado = item.tipoBoton === 'ENCONTRADO';
        
        lista.push({
          numero: item.dienteNumero,
          cara: item.cara === 'General' ? 'General' : item.cara,
          state: `${item.tratamientoNombre} (${item.tipoBoton})`,
          // Azul para Encontrado, Rojo para No Atendido
          badgeClase: esEncontrado 
            ? 'bg-primary-subtle text-primary border border-primary-subtle' 
            : 'bg-danger-subtle text-danger border border-danger-subtle'
        });
      });
      return lista;
    }

    // 2. 🛡️ SISTEMA DE RESPALDO (Fallback): Mapeo clásico si es una consulta antigua
    if (consulta.odontograma) {
      const carasKeys: ('top' | 'bottom' | 'left' | 'right' | 'center')[] = ['top', 'bottom', 'left', 'right', 'center'];
      const nombresCaras = { top: 'Superior', bottom: 'Inferior', left: 'Izquierda', right: 'Derecha', center: 'Centro' };

      const todosLosDientes = [
        ...(consulta.odontograma.cuadrante1 || []),
        ...(consulta.odontograma.cuadrante2 || []),
        ...(consulta.odontograma.cuadrante3 || []),
        ...(consulta.odontograma.cuadrante4 || [])
      ];

      todosLosDientes.forEach((diente: any) => {
        carasKeys.forEach(cara => {
          const estadoCara = diente[cara];
          if (estadoCara && estadoCara !== 'sano') {
            lista.push({
              numero: diente.numero,
              cara: nombresCaras[cara],
              state: estadoCara === 'caries' ? 'Caries Detectada' : 'Obturación Existente',
              badgeClase: estadoCara === 'caries' 
                ? 'bg-danger-subtle text-danger border border-danger-subtle' 
                : 'bg-primary-subtle text-primary border border-primary-subtle'
            });
          }
        });
      });
    }

    return lista;
  }
}