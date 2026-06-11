import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Definimos los estados posibles
export type EstadoZona = 'sano' | 'caries' | 'obturado';

// La nueva estructura del diente con sus 5 caras clínicas
export interface Diente {
  numero: number;
  top: EstadoZona;    // Vestibular (arriba)
  bottom: EstadoZona; // Lingual/Palatino (abajo)
  left: EstadoZona;   // Mesial/Distal (izquierda)
  right: EstadoZona;  // Mesial/Distal (derecha)
  center: EstadoZona; // Oclusal (centro)
}

@Component({
  selector: 'app-nueva-consulta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-consulta.html',
  styleUrls: ['./nueva-consulta.scss']
})
export class NuevaConsultaComponent {
  private fb = inject(FormBuilder);
  consultaForm: FormGroup;

  // Función auxiliar para inicializar los dientes en blanco (sanos)
  crearDiente = (n: number): Diente => ({ 
    numero: n, top: 'sano', bottom: 'sano', left: 'sano', right: 'sano', center: 'sano' 
  });

  // Generamos los cuadrantes con la nueva estructura
  cuadrante1: Diente[] = [18, 17, 16, 15, 14, 13, 12, 11].map(this.crearDiente);
  cuadrante2: Diente[] = [21, 22, 23, 24, 25, 26, 27, 28].map(this.crearDiente);
  cuadrante4: Diente[] = [48, 47, 46, 45, 44, 43, 42, 41].map(this.crearDiente);
  cuadrante3: Diente[] = [31, 32, 33, 34, 35, 36, 37, 38].map(this.crearDiente);

  constructor() {
    this.consultaForm = this.fb.group({
      pacienteId: ['Ej: 1', Validators.required],
      presionArterial: ['100/70'],
      frecuenciaCardiaca: ['67'],
      costoAtencion: ['0', [Validators.required, Validators.min(0)]],
      motivo: ['Escriba el motivo...', Validators.required],
      planTratamiento: ['Escriba el tratamiento...', Validators.required]
    });
  }

  // Ahora la función recibe el diente y la CARA exacta que se hizo clic
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
    if (this.consultaForm.valid) {
      console.log('Formulario:', this.consultaForm.value);
      console.log('Estado del Cuadrante 1:', this.cuadrante1);
      alert('¡Consulta Registrada exitosamente!');
    } else {
      this.consultaForm.markAllAsTouched();
    }
  }
}