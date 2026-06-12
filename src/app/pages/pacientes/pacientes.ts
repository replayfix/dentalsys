import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PacientesService } from '../../core/services/pacientes'; // Ajusta la ruta exacta de tu servicio

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.scss']
})
export class PacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  pacientes: any[] = [];
  cargando: boolean = true;
  mostrarModal: boolean = false;
  pacienteForm: FormGroup;

  // Variables para el control del Modal de Eliminación
  mostrarModalEliminar: boolean = false;
  pacienteAEliminar: any = null;

  constructor() {
    this.pacienteForm = this.fb.group({
      nombre: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      telefono: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.pacientesService.pacientes$.subscribe({
      next: (data) => {
        this.pacientes = data;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- MÉTODOS DEL CRUD ELIMINAR ---
  abrirModalEliminar(paciente: any) {
    this.pacienteAEliminar = paciente;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.pacienteAEliminar = null;
  }

  confirmarEliminacion() {
    if (this.pacienteAEliminar?.id) {
      this.pacientesService.eliminarPaciente(this.pacienteAEliminar.id)
        .then(() => {
          this.cerrarModalEliminar();
          this.cdr.detectChanges();
        })
        .catch(err => console.error('Error al remover paciente:', err));
    }
  }

  // --- MÉTODOS ANTERIORES DE REGISTRO ---
  abrirModal() { this.mostrarModal = true; }
  cerrarModal() { this.mostrarModal = false; this.pacienteForm.reset(); }
  guardarPaciente() {
    if (this.pacienteForm.valid) {
      const nuevo = { ...this.pacienteForm.value, fechaRegistro: Date.now() };
      this.pacientesService.addPaciente(nuevo).then(() => this.cerrarModal());
    } else {
      this.pacienteForm.markAllAsTouched();
    }
  }
}