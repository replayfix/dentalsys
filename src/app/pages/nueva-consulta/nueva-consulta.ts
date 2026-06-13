import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultasService, Consulta } from '../../core/services/consultas';
import { InventarioService, Insumo } from '../../core/services/inventario';
import { TratamientosService, TratamientoCatalogo } from '../../core/services/tratamientos'; 

export type EstadoZona = 'sano' | 'caries' | 'obturado';

export interface Diente {
  numero: number;
  top: EstadoZona;
  bottom: EstadoZona;
  left: EstadoZona;
  right: EstadoZona;
  center: EstadoZona;
}

export interface TratamientoAsignado {
  idUnique: string;
  dienteNumero: number;
  cara: string;          // 'General' o cara específica ('top', 'bottom', etc.)
  tratamientoNombre: string; // 👈 Nombre correcto de la propiedad en la interfaz
  tipoBoton: 'ENCONTRADO' | 'NO ATENDIDO'; 
}

@Component({
  selector: 'app-nueva-consulta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], 
  templateUrl: './nueva-consulta.html',
  styleUrls: ['./nueva-consulta.scss']
})
export class NuevaConsultaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultasService = inject(ConsultasService);
  private inventarioService = inject(InventarioService);
  private tratamientosService = inject(TratamientosService); 
  private cdr = inject(ChangeDetectorRef);

  consultaForm!: FormGroup;
  pacienteNombre: string = '';

  // --- CONTROL DE INSUMOS DE INVENTARIO ---
  insumosDisponibles: Insumo[] = [];
  insumosUsados: { insumoId: string; nombre: string; cantidad: number }[] = [];
  insumoSeleccionadoId: string = '';
  cantidadInsumo: number = 1;

  // --- ESTRUCTURA INICIAL DEL ODONTOGRAMA GRÁFICO ---
  crearDiente = (n: number): Diente => ({ 
    numero: n, top: 'sano', bottom: 'sano', left: 'sano', right: 'sano', center: 'sano' 
  });

  cuadrante1: Diente[] = [18, 17, 16, 15, 14, 13, 12, 11].map(this.crearDiente);
  cuadrante2: Diente[] = [21, 22, 23, 24, 25, 26, 27, 28].map(this.crearDiente);
  cuadrante4: Diente[] = [48, 47, 46, 45, 44, 43, 42, 41].map(this.crearDiente);
  cuadrante3: Diente[] = [31, 32, 33, 34, 35, 36, 37, 38].map(this.crearDiente);

  // --- ARREGLO MAESTRO VINCULADO A FIRESTORE ---
  catalogoTratamientos: TratamientoCatalogo[] = [];
  terminoBusqueda: string = '';
  translationsFiltrados: TratamientoCatalogo[] = []; 
  tratamientosFiltrados: TratamientoCatalogo[] = [];
  mostrarDropdown: boolean = false;

  // --- ESTRUCTURAS REACTIVAS MULTI-SELECCIÓN ---
  listaTratamientosSeleccionados: TratamientoCatalogo[] = []; 
  treatmentActivoParaAplicar: TratamientoCatalogo | null = null; 
  modoBotonActivo: 'ENCONTRADO' | 'NO ATENDIDO' = 'NO ATENDIDO'; 

  planTratamientoLista: TratamientoAsignado[] = [];

  ngOnInit() {
    this.consultaForm = this.fb.group({
      pacienteId: [{ value: '', disabled: true }, Validators.required],
      presionArterial: ['120/80'],
      frecuenciaCardiaca: ['70'],
      costoAtencion: [0, [Validators.required, Validators.min(0)]]
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.consultaForm.patchValue({ pacienteId: params['id'] });
        this.pacienteNombre = params['nombre'] || 'Paciente';
      } else {
        this.consultaForm.patchValue({ pacienteId: 'Sin paciente seleccionado' });
      }
    });

    this.inventarioService.insumos$.subscribe(data => {
      this.insumosDisponibles = data;
    });

    this.tratamientosService.tratamientos$.subscribe({
      next: (data) => {
        this.catalogoTratamientos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al sincronizar catálogo dinámico:', err)
    });
  }

  // --- FLUJO DEL BUSCADOR DE TRATAMIENTOS DINÁMICO ---
  filtrarTratamientos() {
    if (!this.terminoBusqueda.trim()) {
      this.tratamientosFiltrados = [];
      this.translationsFiltrados = [];
      this.mostrarDropdown = false;
      return;
    }
    
    const texto = this.terminoBusqueda.toUpperCase();
    this.tratamientosFiltrados = this.catalogoTratamientos.filter(t => 
      t.nombre.includes(texto)
    );
    this.translationsFiltrados = this.tratamientosFiltrados; 
    this.mostrarDropdown = this.tratamientosFiltrados.length > 0;
  }

  seleccionarTratamiento(treatment: TratamientoCatalogo) {
    if (!this.listaTratamientosSeleccionados.find(t => t.id === treatment.id)) {
      this.listaTratamientosSeleccionados.push(treatment);
    }
    this.treatmentActivoParaAplicar = treatment;
    this.terminoBusqueda = '';
    this.mostrarDropdown = false;
  }

  quitarTratamientoDeLista(id: string, event: Event) {
    event.stopPropagation(); 
    this.listaTratamientosSeleccionados = this.listaTratamientosSeleccionados.filter(t => t.id !== id);
    
    if (this.treatmentActivoParaAplicar?.id === id) {
      this.treatmentActivoParaAplicar = this.listaTratamientosSeleccionados.length > 0 ? this.listaTratamientosSeleccionados[0] : null;
    }
  }

  setTratamientoActivo(treatment: TratamientoCatalogo) {
    this.treatmentActivoParaAplicar = treatment;
  }

  setModoBoton(modo: 'ENCONTRADO' | 'NO ATENDIDO') {
    this.modoBotonActivo = modo;
  }

  // --- ACCIÓN PRINCIPAL AL SELECCIONAR O INTERACTUAR CON UN DIENTE/CARA ---
  marcarDienteOdontograma(numeroDiente: number, cara: string = 'General') {
    if (!this.treatmentActivoParaAplicar) {
      alert('Por favor, busque o seleccione un tratamiento de la lista para poder aplicarlo en el odontograma.');
      return;
    }

    // 👈 CORREGIDO: Cambiado 'treatmentNombre' por 'tratamientoNombre' para respetar la interfaz
    const nuevaAsignacion: TratamientoAsignado = {
      idUnique: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      dienteNumero: numeroDiente,
      cara: cara,
      tratamientoNombre: this.treatmentActivoParaAplicar.nombre,
      tipoBoton: this.modoBotonActivo
    };

    this.planTratamientoLista.push(nuevaAsignacion);
    this.pintarColorDiente(numeroDiente, cara, this.modoBotonActivo);
    this.cdr.detectChanges();
  }

  private pintarColorDiente(numeroDiente: number, cara: string, modo: 'ENCONTRADO' | 'NO ATENDIDO') {
    const todosLosDientes = [...this.cuadrante1, ...this.cuadrante2, ...this.cuadrante3, ...this.cuadrante4];
    const d = todosLosDientes.find(p => p.numero === numeroDiente);
    
    if (!d) return;

    const estadoEstetico: EstadoZona = modo === 'NO ATENDIDO' ? 'caries' : 'obturado';

    if (cara === 'General') {
      d.top = estadoEstetico;
      d.bottom = estadoEstetico;
      d.left = estadoEstetico;
      d.right = estadoEstetico;
      d.center = estadoEstetico;
    } else {
      const zona = cara.toLowerCase() as 'top' | 'bottom' | 'left' | 'right' | 'center';
      d[zona] = estadoEstetico;
    }
  }

  eliminarTratamientoAsignado(idUnique: string) {
    const tratamientoAEliminar = this.planTratamientoLista.find(t => t.idUnique === idUnique);

    if (tratamientoAEliminar) {
      const { dienteNumero, cara } = tratamientoAEliminar;
      
      const todosLosDientes = [...this.cuadrante1, ...this.cuadrante2, ...this.cuadrante3, ...this.cuadrante4];
      const d = todosLosDientes.find(p => p.numero === dienteNumero);

      if (d) {
        if (cara === 'General') {
          d.top = 'sano';
          d.bottom = 'sano';
          d.left = 'sano';
          d.right = 'sano';
          d.center = 'sano';
        } else {
          const zona = cara.toLowerCase() as 'top' | 'bottom' | 'left' | 'right' | 'center';
          d[zona] = 'sano';
        }
      }
    }

    this.planTratamientoLista = this.planTratamientoLista.filter(t => t.idUnique !== idUnique);
    this.cdr.detectChanges();
  }

  // --- GESTIÓN DE INSUMOS ---
  agregarInsumo() {
    if (!this.insumoSeleccionadoId || this.cantidadInsumo <= 0) return;

    const insumoOriginal = this.insumosDisponibles.find(i => i.id === this.insumoSeleccionadoId);
    if (!insumoOriginal) return;

    if (this.cantidadInsumo > insumoOriginal.stockActual) {
      alert(`Stock insuficiente. Solo quedan ${insumoOriginal.stockActual} unidades de ${insumoOriginal.nombre}.`);
      return;
    }

    const existente = this.insumosUsados.find(i => i.insumoId === this.insumoSeleccionadoId);
    if (existente) {
      if ((existente.cantidad + this.cantidadInsumo) > insumoOriginal.stockActual) {
        alert(`No puedes superar el stock disponible en almacén.`);
        return;
      }
      existente.cantidad += this.cantidadInsumo;
    } else {
      this.insumosUsados.push({
        insumoId: this.insumoSeleccionadoId,
        nombre: insumoOriginal.nombre,
        cantidad: this.cantidadInsumo
      });
    }

    this.insumoSeleccionadoId = '';
    this.cantidadInsumo = 1;
  }

  quitarInsumo(index: number) {
    this.insumosUsados.splice(index, 1);
  }

  cambiarEstadoZona(diente: Diente, zona: 'top' | 'bottom' | 'left' | 'right' | 'center') {
    this.marcarDienteOdontograma(diente.numero, zona);
  }

  // --- ENVÍO DE DATOS SEGURO A FIRESTORE ---
  guardarConsulta() {
    const formValues = this.consultaForm.getRawValue();

    if (this.consultaForm.valid && formValues.pacienteId) {
      
      const nuevaConsulta: any = {
        pacienteId: formValues.pacienteId,
        pacienteNombre: this.pacienteNombre || 'Desconocido',
        presionArterial: formValues.presionArterial,
        frecuenciaCardiaca: formValues.frecuenciaCardiaca,
        costoAtencion: formValues.costoAtencion,
        planTratamientoLista: this.planTratamientoLista,
        tratamientosSesionResumen: this.listaTratamientosSeleccionados.map(t => t.nombre),
        planTratamiento: this.listaTratamientosSeleccionados.map(t => t.nombre).join(', ') || 'Sin observaciones.',
        fechaRegistro: Date.now(),
        insumosUtilizados: this.insumosUsados, 
        odontograma: {
          cuadrante1: this.cuadrante1,
          cuadrante2: this.cuadrante2,
          cuadrante3: this.cuadrante3,
          cuadrante4: this.cuadrante4
        }
      };

      console.log('🚀 Registrando nueva consulta clínica dinámica...', nuevaConsulta);

      this.consultasService.addConsulta(nuevaConsulta)
        .then(() => {
          console.log('✅ Consulta registrada en Firestore. Procesando inventario...');
          
          const promesasDescuento = this.insumosUsados.map(insumoUsado => {
            const original = this.insumosDisponibles.find(i => i.id === insumoUsado.insumoId);
            
            if (original) {
              const stockActualNum = Number(original.stockActual);
              const cantidadUsadaNum = Number(insumoUsado.cantidad);
              const nuevoStock = stockActualNum - cantidadUsadaNum;

              console.log(`📦 Descontando [${original.nombre}]: Nuevo Stock = ${nuevoStock}`);
              return this.inventarioService.actualizarStock(insumoUsado.insumoId, nuevoStock >= 0 ? nuevoStock : 0);
            }
            return Promise.resolve();
          });

          return Promise.all(promesasDescuento);
        })
        .then(() => {
          alert(`¡Consulta registrada con éxito e inventario actualizado!`);
          this.router.navigate(['/pacientes']);
        })
        .catch(error => {
          console.error('❌ Error en el flujo de guardado:', error);
          alert('Hubo un error al procesar la operación.');
        });

    } else {
      this.consultaForm.markAllAsTouched();
    }
  }
}