import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PacientesService } from '../../core/services/pacientes';
import { ConsultasService } from '../../core/services/consultas'; // 👈 Inyectamos el servicio de atenciones para la cascada
import { take } from 'rxjs/operators'; // 👈 Operador para tomar una sola emisión y evitar bucles infinitos

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.scss']
})
export class PacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  private consultasService = inject(ConsultasService); // 👈 Inyección operativa del ConsultasService
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  pacientes: any[] = [];
  pacientesFiltrados: any[] = []; // Arreglo secundario que dibuja la tabla
  cargando: boolean = true;
  mostrarModal: boolean = false;
  pacienteForm: FormGroup;

  // Variables de control para búsqueda y eliminación
  terminoBusqueda: string = ''; // Almacena el texto de búsqueda
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
        this.aplicarFiltro(); // Filtra inmediatamente cuando Firestore emite cambios
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- MÉTODO INTERACTIVO DE BÚSQUEDA ---
  onBuscarPaciente(event: any) {
    this.terminoBusqueda = event.target.value.toLowerCase();
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (!this.terminoBusqueda.trim()) {
      this.pacientesFiltrados = [...this.pacientes];
    } else {
      this.pacientesFiltrados = this.pacientes.filter(p => 
        p.nombre.toLowerCase().includes(this.terminoBusqueda) || 
        p.dni.includes(this.terminoBusqueda)
      );
    }
    this.cdr.detectChanges();
  }

  // --- FLUJO ELIMINAR CON CASCADA TRANSACCIONAL ---
  abrirModalEliminar(paciente: any) {
    this.pacienteAEliminar = paciente;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.pacienteAEliminar = null;
  }

  confirmarEliminacion() {
    if (!this.pacienteAEliminar?.id) return;

    const idPaciente = this.pacienteAEliminar.id;
    console.log('🔄 Iniciando remoción en cascada para el paciente ID:', idPaciente);

    // 1. Buscamos y barremos las consultas asociadas en lote con take(1) para no generar bucles reactivos
    this.consultasService.consultas$.pipe(take(1)).subscribe({
      next: (todasLasConsultas) => {
        const consultasHuerfanas = todasLasConsultas.filter(c => c.pacienteId === idPaciente);
        
        console.log(`📦 Limpiando historial de atenciones: Se encontraron ${consultasHuerfanas.length} registros huérfanos.`);
        
        // Ejecutamos las promesas de borrado clínico en paralelo
        const promesasBorradoConsultas = consultasHuerfanas.map(consulta => {
          if (consulta.id) {
            console.log(`❌ Eliminando consulta vinculada: ${consulta.id}`);
            return this.consultasService.deleteConsulta(consulta.id);
          }
          return Promise.resolve();
        });

        // 2. Una vez vaciado e higienizado el historial del paciente, lo removemos a él de Firestore
        Promise.all(promesasBorradoConsultas)
          .then(() => {
            console.log('✅ Historial de atenciones purgado con éxito. Eliminando perfil de paciente...');
            return this.pacientesService.eliminarPaciente(idPaciente);
          })
          .then(() => {
            this.cerrarModalEliminar();
            this.cdr.detectChanges();
          })
          .catch(err => {
            console.error('❌ Error crítico en el flujo de borrado en cascada:', err);
            alert('Hubo un error al purgar los registros asociados.');
          });
      }
    });
  }

  // --- CONTROLES DE REGISTRO ---
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