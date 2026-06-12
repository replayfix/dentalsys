import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. 👇 Asegúrate de importar también 'FormsModule' aquí arriba
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultasService, Consulta } from '../../core/services/consultas';
import { InventarioService, Insumo } from '../../core/services/inventario';

export type EstadoZona = 'sano' | 'caries' | 'obturado';

export interface Diente {
  numero: number;
  top: EstadoZona;
  bottom: EstadoZona;
  left: EstadoZona;
  right: EstadoZona;
  center: EstadoZona;
}

@Component({
  selector: 'app-nueva-consulta',
  standalone: true,
  // 2. 👇 ¡AGREGAMOS FormsModule AQUÍ EN EL ARREGLO!
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

  consultaForm!: FormGroup;
  pacienteNombre: string = '';

  insumosDisponibles: Insumo[] = [];
  insumosUsados: { insumoId: string; nombre: string; cantidad: number }[] = [];
  
  insumoSeleccionadoId: string = '';
  cantidadInsumo: number = 1;

  crearDiente = (n: number): Diente => ({ 
    numero: n, top: 'sano', bottom: 'sano', left: 'sano', right: 'sano', center: 'sano' 
  });

  cuadrante1: Diente[] = [18, 17, 16, 15, 14, 13, 12, 11].map(this.crearDiente);
  cuadrante2: Diente[] = [21, 22, 23, 24, 25, 26, 27, 28].map(this.crearDiente);
  cuadrante4: Diente[] = [48, 47, 46, 45, 44, 43, 42, 41].map(this.crearDiente);
  cuadrante3: Diente[] = [31, 32, 33, 34, 35, 36, 37, 38].map(this.crearDiente);

  ngOnInit() {
    this.consultaForm = this.fb.group({
      pacienteId: [{ value: '', disabled: true }, Validators.required],
      presionArterial: ['120/80'],
      frecuenciaCardiaca: ['70'],
      costoAtencion: [0, [Validators.required, Validators.min(0)]],
      motivo: ['', Validators.required],
      planTratamiento: ['', Validators.required]
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.consultaForm.patchValue({ pacienteId: params['id'] });
        this.pacienteNombre = params['nombre'];
      } else {
        this.consultaForm.patchValue({ pacienteId: 'Sin paciente seleccionado' });
      }
    });

    this.inventarioService.insumos$.subscribe(data => {
      this.insumosDisponibles = data;
    });
  }

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
    if (diente[zona] === 'sano') {
      diente[zona] = 'caries';
    } else if (diente[zona] === 'caries') {
      diente[zona] = 'obturado';
    } else {
      diente[zona] = 'sano';
    }
  }

guardarConsulta() {
    const formValues = this.consultaForm.getRawValue();

    if (this.consultaForm.valid && formValues.pacienteId) {
      
      const nuevaConsulta: any = {
        pacienteId: formValues.pacienteId,
        pacienteNombre: this.pacienteNombre || 'Desconocido',
        presionArterial: formValues.presionArterial,
        frecuenciaCardiaca: formValues.frecuenciaCardiaca,
        costoAtencion: formValues.costoAtencion,
        motivo: formValues.motivo,
        planTratamiento: formValues.planTratamiento,
        fechaRegistro: Date.now(),
        insumosUtilizados: this.insumosUsados, 
        odontograma: {
          cuadrante1: this.cuadrante1,
          cuadrante2: this.cuadrante2,
          cuadrante3: this.cuadrante3,
          cuadrante4: this.cuadrante4
        }
      };

      console.log('🚀 Iniciando guardado de consulta...', nuevaConsulta);

      // 1. Guardar la consulta clínica primero
      this.consultasService.addConsulta(nuevaConsulta)
        .then(() => {
          console.log('✅ Consulta registrada en Firestore. Procesando inventario...');
          
          // 2. Mapeamos las promesas asegurando el casteo a número
          const promesasDescuento = this.insumosUsados.map(insumoUsado => {
            const original = this.insumosDisponibles.find(i => i.id === insumoUsado.insumoId);
            
            if (original) {
              // Convertimos explícitamente a números para evitar que "20 - '2'" rompa Firebase
              const stockActualNum = Number(original.stockActual);
              const cantidadUsadaNum = Number(insumoUsado.cantidad);
              const nuevoStock = stockActualNum - cantidadUsadaNum;

              console.log(`📦 Modificando [${original.nombre}]: Stock anterior = ${stockActualNum} | Restando = ${cantidadUsadaNum} | Nuevo Stock Destino = ${nuevoStock}`);

              return this.inventarioService.actualizarStock(insumoUsado.insumoId, nuevoStock >= 0 ? nuevoStock : 0);
            }
            
            console.warn(`⚠️ No se encontró el insumo con ID: ${insumoUsado.insumoId} en la lista local.`);
            return Promise.resolve();
          });

          // 3. Ejecutamos todas las actualizaciones en lote
          return Promise.all(promesasDescuento);
        })
        .then(() => {
          console.log('🎉 ¡Inventario actualizado con éxito en la nube!');
          alert(`¡Consulta registrada e inventario actualizado con éxito!`);
          this.router.navigate(['/pacientes']);
        })
        .catch(error => {
          // Captura errores tanto de la consulta como del inventario
          console.error('❌ ERROR CRÍTICO EN EL FLUJO:', error);
          alert('Hubo un error al procesar la operación. Revisa la consola de desarrollador (F12).');
        });

    } else {
      this.consultaForm.markAllAsTouched();
    }
  }
}