import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Para leer la URL y navegar
import { ConsultasService, Consulta } from '../../core/services/consultas';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-consulta.html',
  styleUrls: ['./nueva-consulta.scss']
})
export class NuevaConsultaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute); // Inyectamos el lector de URL
  private router = inject(Router); // Inyectamos el enrutador
  private consultasService = inject(ConsultasService); // Inyectamos el servicio de Firebase

  consultaForm!: FormGroup;
  pacienteNombre: string = '';

  // Inicialización de cuadrantes dentales
  crearDiente = (n: number): Diente => ({ 
    numero: n, top: 'sano', bottom: 'sano', left: 'sano', right: 'sano', center: 'sano' 
  });

  cuadrante1: Diente[] = [18, 17, 16, 15, 14, 13, 12, 11].map(this.crearDiente);
  cuadrante2: Diente[] = [21, 22, 23, 24, 25, 26, 27, 28].map(this.crearDiente);
  cuadrante4: Diente[] = [48, 47, 46, 45, 44, 43, 42, 41].map(this.crearDiente);
  cuadrante3: Diente[] = [31, 32, 33, 34, 35, 36, 37, 38].map(this.crearDiente);

  ngOnInit() {
    // 1. Inicializamos el formulario reactivo
    this.consultaForm = this.fb.group({
      pacienteId: [{ value: '', disabled: true }, Validators.required], // Deshabilitado para que no se altere a mano
      presionArterial: ['120/80'],
      frecuenciaCardiaca: ['70'],
      costoAtencion: [0, [Validators.required, Validators.min(0)]],
      motivo: ['', Validators.required],
      planTratamiento: ['', Validators.required]
    });

    // 2. Capturamos los datos del paciente que vienen desde la tabla
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        // Colocamos el ID real en el input
        this.consultaForm.patchValue({ pacienteId: params['id'] });
        // Guardamos el nombre en la variable para mostrarlo si deseas en el HTML
        this.pacienteNombre = params['nombre'];
      } else {
        this.consultaForm.patchValue({ pacienteId: 'Sin paciente seleccionado' });
      }
    });
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
    // Como el input de pacienteId está 'disabled', usamos getRawValue() para obtener su información
    const formValues = this.consultaForm.getRawValue();

    if (this.consultaForm.valid && formValues.pacienteId) {
      
      // Creamos el objeto exacto listo para subir a Firestore
      const nuevaConsulta: Consulta = {
        pacienteId: formValues.pacienteId,
        pacienteNombre: this.pacienteNombre || 'Desconocido',
        presionArterial: formValues.presionArterial,
        frecuenciaCardiaca: formValues.frecuenciaCardiaca,
        costoAtencion: formValues.costoAtencion,
        motivo: formValues.motivo,
        planTratamiento: formValues.planTratamiento,
        fechaRegistro: Date.now(),
        // Enviamos la "fotografía" de cómo quedó el odontograma mapeado en este momento
        odontograma: {
          cuadrante1: this.cuadrante1,
          cuadrante2: this.cuadrante2,
          cuadrante3: this.cuadrante3,
          cuadrante4: this.cuadrante4
        }
      };

      // Guardamos en Firebase de verdad
      this.consultasService.addConsulta(nuevaConsulta)
        .then(() => {
          alert(`¡Consulta de ${this.pacienteNombre} registrada con éxito en Firestore!`);
          this.router.navigate(['/pacientes']); // Redirigimos al directorio de pacientes
        })
        .catch(error => {
          console.error('Error al guardar la historia clínica:', error);
          alert('Hubo un error al conectar con Firebase.');
        });

    } else {
      this.consultaForm.markAllAsTouched();
    }
  }
}