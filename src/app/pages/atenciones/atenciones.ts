import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultasService, Consulta } from '../../core/services/consultas';

export interface HallazgoDental {
  numero: number;
  cara: string;
  estado: string;
  badgeClase: string;
}

@Component({
  selector: 'app-atenciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atenciones.html',
  styleUrls: ['./atenciones.scss']
})
export class AtencionesComponent implements OnInit {
  private consultasService = inject(ConsultasService);
  private cdr = inject(ChangeDetectorRef);

  consultas: Consulta[] = [];
  cargando: boolean = true;

  // Variables de control para la ventana detallada
  mostrarModalDetalle: boolean = false;
  consultaSeleccionada: Consulta | null = null;
  hallazgosDeteccion: HallazgoDental[] = [];

  ngOnInit() {
    this.consultasService.consultas$.subscribe({
      next: (data) => {
        this.consultas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al leer el historial clínico:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verDetalleConsulta(consulta: Consulta) {
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

  // Analiza dinámicamente el JSON del odontograma guardado en Firebase
  private extraerHallazgosClinicos(consulta: Consulta): HallazgoDental[] {
    if (!consulta.odontograma) return [];
    
    const lista: HallazgoDental[] = [];
    const carasKeys: ('top' | 'bottom' | 'left' | 'right' | 'center')[] = ['top', 'bottom', 'left', 'right', 'center'];
    
    // Traducción clínica de las variables a etiquetas en español
    const nombresCaras = { top: 'Superior', bottom: 'Inferior', left: 'Izquierda', right: 'Derecha', center: 'Centro' };

    // Agrupamos todas las piezas en un solo arreglo plano para recorrerlo rápidamente
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
            estado: estadoCara === 'caries' ? 'Caries' : 'Obturado',
            // Clases de color Bootstrap para los badges (Caries = Rojo, Obturado = Azul)
            badgeClase: estadoCara === 'caries' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'
          });
        }
      });
    });

    return lista;
  }
}