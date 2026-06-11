import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // Agregamos ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacientesService, Paciente } from '../../core/services/pacientes';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.scss']
})
export class PacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef); // Inyectamos el detector de cambios
  
  pacientes: Paciente[] = [];
  cargando: boolean = true;
  pacienteForm: FormGroup;
  mostrarModal: boolean = false;

  constructor() {
    this.pacienteForm = this.fb.group({
      nombre: ['', Validators.required],
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      telefono: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.pacientesService.pacientes$.subscribe({
      next: (data) => {
        this.pacientes = data;
        this.cargando = false;
        
        // LE DECIMOS A ANGULAR QUE SE ACTUALICE INMEDIATAMENTE
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('Error al leer datos:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.pacienteForm.reset();
  }

  guardarPaciente() {
    if (this.pacienteForm.valid) {
      const nuevoPaciente: Paciente = {
        ...this.pacienteForm.value,
        fechaRegistro: Date.now()
      };

      this.pacientesService.addPaciente(nuevoPaciente)
        .then(() => {
          this.cerrarModal();
          // También forzamos la actualización al cerrar el modal si es necesario
          this.cdr.detectChanges();
        })
        .catch(error => console.error('Error al guardar:', error));
    } else {
      this.pacienteForm.markAllAsTouched();
    }
  }
}