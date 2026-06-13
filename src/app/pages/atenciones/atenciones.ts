import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultasService, Consulta } from '../../core/services/consultas';
import { InventarioService } from '../../core/services/inventario'; // Inyectamos inventario para la devolución de stock

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
  private inventarioService = inject(InventarioService); // Servicio del almacén
  private cdr = inject(ChangeDetectorRef);

  consultas: Consulta[] = [];
  cargando: boolean = true;
  insumosDisponibles: any[] = []; // Para cruzar stocks actuales

  // Variables de control para la ventana detallada
  mostrarModalDetalle: boolean = false;
  consultaSeleccionada: Consulta | null = null;
  hallazgosDeteccion: HallazgoDental[] = [];

  // 👈 VARIABLES DE CONTROL PARA EL MODAL DE ELIMINACIÓN ESTILIZADO VINCULADO AL HTML
  mostrarModalEliminar: boolean = false;
  consultaAEliminar: any = null;

  ngOnInit() {
    // Escuchamos el flujo de atenciones en tiempo real
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

    // Escuchamos el stock actual de insumos para poder recalcular la devolución con exactitud
    this.inventarioService.insumos$.subscribe({
      next: (data) => {
        this.insumosDisponibles = data;
      },
      error: (err) => console.error('Error al sincronizar inventario local:', err)
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

  // 👈 CONTROLES INTERACTIVOS DEL NUEVO MODAL ESTILIZADO
  abrirModalEliminar(consulta: any) {
    this.consultaAEliminar = consulta;
    this.mostrarModalEliminar = true;
    this.cdr.detectChanges();
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.consultaAEliminar = null;
    this.cdr.detectChanges();
  }

  // 👈 PROCESO TRANSACCIONAL SEGURO ACTIVADO DESDE EL MODAL ESTILIZADO
  confirmarEliminacion() {
    if (!this.consultaAEliminar?.id) return;

    const consulta = this.consultaAEliminar;
    console.log('🔄 Iniciando proceso transaccional de eliminación de atención...', consulta.id);

    // 1. Procesar devolución de insumos utilizados si es que existen
    const promesasDevolucion = (consulta.insumosUtilizados || []).map((insumoUsado: any) => {
      const original = this.insumosDisponibles.find(i => i.id === insumoUsado.insumoId);
      
      if (original) {
        // En vez de restar, sumamos de regreso las unidades canceladas
        const stockActualNum = Number(original.stockActual);
        const cantidadUsadaNum = Number(insumoUsado.cantidad);
        const stockRestaurado = stockActualNum + cantidadUsadaNum;

        console.log(`📦 Devolución [${original.nombre}]: Stock anterior = ${stockActualNum} | Reintegrando = ${cantidadUsadaNum} | Nuevo Almacén = ${stockRestaurado}`);
        return this.inventarioService.actualizarStock(insumoUsado.insumoId, stockRestaurado);
      }
      return Promise.resolve();
    });

    // 2. Ejecutar la restitución de inventario y luego eliminar el documento en Firestore
    Promise.all(promesasDevolucion)
      .then(() => {
        console.log('📦 Almacén restaurado. Eliminando documento clínico de Firestore...');
        return this.consultasService.deleteConsulta(consulta.id); // Llamada al método del servicio
      })
      .then(() => {
        this.cerrarModalEliminar();
        this.cdr.detectChanges();
      })
      .catch(error => {
        console.error('❌ Error al revertir la consulta:', error);
        alert('Hubo un error al intentar eliminar la atención.');
      });
  }

  // Analiza dinámicamente el JSON del plan de tratamientos y odontograma guardado en Firebase
  private extraerHallazgosClinicos(consulta: any): HallazgoDental[] {
    const lista: HallazgoDental[] = [];

    // 1. SISTEMA NUEVO: Si la consulta tiene la lista estructurada de tratamientos del buscador
    if (consulta.planTratamientoLista && Array.isArray(consulta.planTratamientoLista) && consulta.planTratamientoLista.length > 0) {
      consulta.planTratamientoLista.forEach((item: any) => {
        const esEncontrado = item.tipoBoton === 'ENCONTRADO';
        
        lista.push({
          numero: item.dienteNumero,
          cara: item.cara === 'General' ? 'General' : item.cara,
          estado: `${item.tratamientoNombre} (${item.tipoBoton})`,
          // Azul si ya estaba en boca (Encontrado), Rojo si es plan propuesto (No Atendido)
          badgeClase: esEncontrado 
            ? 'bg-primary-subtle text-primary border border-primary-subtle' 
            : 'bg-danger-subtle text-danger border border-danger-subtle'
        });
      });
      return lista;
    }

    // 2. SISTEMA DE RESPALDO (Fallback): Si es una consulta antigua que solo tenía el odontograma plano
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
              estado: estadoCara === 'caries' ? 'Caries Detectada' : 'Obturación Existente',
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