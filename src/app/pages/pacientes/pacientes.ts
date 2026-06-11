import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router'; // 1. 👇 ¡IMPORTA ESTO AQUÍ!
import { PacientesService, Paciente } from '../../core/services/pacientes';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  // 2. 👇 ¡AGREGA RouterLink EN ESTE ARREGLO DE IMPORTS!
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.scss']
})
export class PacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
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
          this.cdr.detectChanges();
        })
        .catch(error => console.error('Error al guardar:', error));
    } else {
      this.pacienteForm.markAllAsTouched();
    }
  }
}