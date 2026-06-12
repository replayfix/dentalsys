import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioService, Insumo } from '../../core/services/inventario';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.scss']
})
export class InventarioComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  insumos: Insumo[] = [];
  insumosFiltrados: Insumo[] = []; // 👈 Controla lo que se dibuja en pantalla
  cargando: boolean = true;
  mostrarModal: boolean = false;
  insumoForm: FormGroup;
  categorias: string[] = ['Materiales', 'Anestésicos', 'Desinfectantes', 'Epps / Desechables', 'Instrumental'];

  // Variables CRUD y Filtros
  terminoBusqueda: string = ''; // 👈 Guarda palabra clave
  editandoMode: boolean = false;
  insumoSeleccionadoId: string | null = null;
  mostrarModalEliminar: boolean = false;
  insumoAEliminar: Insumo | null = null;

  constructor() {
    this.insumoForm = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['Materiales', Validators.required],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.inventarioService.insumos$.subscribe({
      next: (data) => {
        this.insumos = data;
        this.aplicarFiltro(); // 👈 Refiltra si cambian stocks en la nube
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al leer inventario:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- LOGICA DE FILTRADO DE COMPONENTES ---
  onBuscarInsumo(event: any) {
    this.terminoBusqueda = event.target.value.toLowerCase();
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (!this.terminoBusqueda.trim()) {
      this.insumosFiltrados = [...this.insumos];
    } else {
      this.insumosFiltrados = this.insumos.filter(i => 
        i.nombre.toLowerCase().includes(this.terminoBusqueda) || 
        i.categoria.toLowerCase().includes(this.terminoBusqueda)
      );
    }
    this.cdr.detectChanges();
  }

  // --- FLUJO ELIMINAR ---
  abrirModalEliminar(insumo: Insumo) {
    this.insumoAEliminar = insumo;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.insumoAEliminar = null;
  }

  confirmarEliminacion() {
    if (this.insumoAEliminar?.id) {
      this.inventarioService.eliminarInsumo(this.insumoAEliminar.id)
        .then(() => {
          this.cerrarModalEliminar();
          this.cdr.detectChanges();
        })
        .catch(error => console.error('Error al remover material:', error));
    }
  }

  // --- CONTROLES MODALES ---
  abrirModalEditar(insumo: Insumo) {
    this.editandoMode = true;
    this.insumoSeleccionadoId = insumo.id || null;
    this.insumoForm.patchValue({
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      stockActual: insumo.stockActual,
      stockMinimo: insumo.stockMinimo
    });
    this.mostrarModal = true;
  }

  abrirModal() { this.editandoMode = false; this.insumoSeleccionadoId = null; this.mostrarModal = true; }
  cerrarModal() { this.mostrarModal = false; this.insumoForm.reset({ categoria: 'Materiales', stockActual: 0, stockMinimo: 0 }); }

  guardarInsumo() {
    if (this.insumoForm.valid) {
      const datosInsumo = this.insumoForm.value;

      if (this.editandoMode && this.insumoSeleccionadoId) {
        this.inventarioService.actualizarStock(this.insumoSeleccionadoId, Number(datosInsumo.stockActual))
          .then(() => { this.cerrarModal(); this.cdr.detectChanges(); });
      } else {
        const nuevoInsumo: Insumo = { ...datosInsumo, fechaActualizacion: Date.now() };
        this.inventarioService.addInsumo(nuevoInsumo).then(() => { this.cerrarModal(); this.cdr.detectChanges(); });
      }
    } else {
      this.insumoForm.markAllAsTouched();
    }
  }
}