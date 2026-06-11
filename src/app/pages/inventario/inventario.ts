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
  cargando: boolean = true;
  mostrarModal: boolean = false;
  insumoForm: FormGroup;

  // Lista predefinida de categorías dentales
  categorias: string[] = ['Materiales', 'Anestésicos', 'Desinfectantes', 'Epps / Desechables', 'Instrumental'];

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
        this.cargando = false;
        this.cdr.detectChanges(); // Forzar actualización de pantalla limpia
      },
      error: (error) => {
        console.error('Error al leer inventario:', error);
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
    this.insumoForm.reset({ categoria: 'Materiales', stockActual: 0, stockMinimo: 0 });
  }

  guardarInsumo() {
    if (this.insumoForm.valid) {
      const nuevoInsumo: Insumo = {
        ...this.insumoForm.value,
        fechaActualizacion: Date.now()
      };

      this.inventarioService.addInsumo(nuevoInsumo)
        .then(() => {
          this.cerrarModal();
          this.cdr.detectChanges();
        })
        .catch(error => console.error('Error al registrar material:', error));
    } else {
      this.insumoForm.markAllAsTouched();
    }
  }
}