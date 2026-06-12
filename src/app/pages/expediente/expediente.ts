import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsultasService, Consulta } from '../../core/services/consultas';

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
  private cdr = inject(ChangeDetectorRef);

  pacienteId: string = '';
  pacienteNombre: string = '';
  consultasPaciente: Consulta[] = [];
  cargando: boolean = true;

  // Controladores para el modal de visualización detallada
  mostrarModalDetalle: boolean = false;
  consultaSeleccionada: Consulta | null = null;
  hallazgosDeteccion: HallazgoDental[] = [];

  ngOnInit() {
    // 1. Capturamos los datos del paciente desde la URL
    this.route.queryParams.subscribe(params => {
      this.pacienteId = params['id'] || '';
      this.pacienteNombre = params['nombre'] || 'Paciente';

      if (this.pacienteId) {
        this.cargarHistorialFiltrado();
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

  private extraerHallazgosClinicos(consulta: Consulta): HallazgoDental[] {
    if (!consulta.odontograma) return [];
    const lista: HallazgoDental[] = [];
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
            state: estadoCara === 'caries' ? 'Caries' : 'Obturado',
            badgeClase: estadoCara === 'caries' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'
          });
        }
      });
    });
    return lista;
  }
}