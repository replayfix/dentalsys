import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TratamientosService, TratamientoCatalogo } from '../../core/services/tratamientos';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tratamientos.html',
  styleUrls: ['./tratamientos.scss']
})
export class TratamientosComponent implements OnInit {
  private tratamientosService = inject(TratamientosService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  tratamientos: TratamientoCatalogo[] = [];
  tratamientosFiltrados: TratamientoCatalogo[] = [];
  cargando: boolean = true;
  
  // Modales
  mostrarModal: boolean = false;
  mostrarModalEliminar: boolean = false;
  
  tratamientoForm: FormGroup;
  terminoBusqueda: string = '';
  tratamientoAEliminar: TratamientoCatalogo | null = null;

  constructor() {
    this.tratamientoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['General', Validators.required]
    });
  }

  ngOnInit() {
    this.tratamientosService.tratamientos$.subscribe({
      next: (data) => {
        this.tratamientos = data;
        this.aplicarFiltro();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar catálogo de tratamientos:', err);
        this.cargando = false;
      }
    });
  }

  onBuscar(event: any) {
    this.terminoBusqueda = event.target.value.toLowerCase();
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (!this.terminoBusqueda.trim()) {
      this.tratamientosFiltrados = [...this.tratamientos];
    } else {
      this.tratamientosFiltrados = this.tratamientos.filter(t => 
        t.nombre.toLowerCase().includes(this.terminoBusqueda) ||
        t.categoria.toLowerCase().includes(this.terminoBusqueda)
      );
    }
    this.cdr.detectChanges();
  }

  // Controles Modal Registro
  abrirModal() { this.mostrarModal = true; }
  cerrarModal() { this.mostrarModal = false; this.tratamientoForm.reset({ categoria: 'General' }); }

  guardarTratamiento() {
    if (this.tratamientoForm.valid) {
      const valores = this.treatmentFormValueCleaned();
      this.tratamientosService.addTratamiento(valores)
        .then(() => this.cerrarModal())
        .catch(err => console.error('Error al registrar procedimiento:', err));
    } else {
      this.tratamientoForm.markAllAsTouched();
    }
  }

  private treatmentFormValueCleaned() {
    const raw = this.tratamientoForm.value;
    return {
      nombre: raw.nombre.trim().toUpperCase(), // Todo a mayúsculas como en tu buscador
      categoria: raw.categoria,
      fechaRegistro: Date.now()
    };
  }

  // Controles Modal Eliminar
  abrirModalEliminar(tratamiento: TratamientoCatalogo) {
    this.tratamientoAEliminar = tratamiento;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.tratamientoAEliminar = null;
  }

  confirmarEliminacion() {
    if (this.tratamientoAEliminar?.id) {
      this.tratamientosService.deleteTratamiento(this.tratamientoAEliminar.id)
        .then(() => this.cerrarModalEliminar())
        .catch(err => console.error('Error al remover tratamiento del catálogo:', err));
    }
  }
}