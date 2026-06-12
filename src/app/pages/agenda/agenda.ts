import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CitasService, Cita } from '../../core/services/citas';
import { PacientesService } from '../../core/services/pacientes';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agenda.html',
  styleUrls: ['./agenda.scss']
})
export class AgendaComponent implements OnInit {
  private citasService = inject(CitasService);
  private pacientesService = inject(PacientesService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  citas: Cita[] = [];
  pacientes: any[] = [];
  cargando: boolean = true;
  mostrarModal: boolean = false;
  citaForm: FormGroup;

  // Variables de navegación del Calendario
  fechaActual: Date = new Date();
  nombreMes: string = '';
  diasDelMes: Date[] = [];
  nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // 👈 NUEVAS VARIABLES PARA LA GESTIÓN DE CITAS EXISTENTES
  mostrarModalGestion: boolean = false;
  citaSeleccionada: Cita | null = null;

  constructor() {
    this.citaForm = this.fb.group({
      pacienteIndex: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      estado: ['Pendiente', Validators.required],
      motivo: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.citasService.citas$.subscribe({
      next: (data) => {
        this.citas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    this.pacientesService.pacientes$.subscribe({
      next: (data) => {
        this.pacientes = data;
        this.cdr.detectChanges();
      }
    });

    this.generarCalendario();
  }

  generarCalendario() {
    const anyo = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    
    const textoMes = this.fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    this.nombreMes = textoMes.charAt(0).toUpperCase() + textoMes.slice(1);
    
    const primerDiaMes = new Date(anyo, mes, 1);
    let diaInicio = primerDiaMes.getDay(); 
    diaInicio = diaInicio === 0 ? 7 : diaInicio;
    
    const dias: Date[] = [];

    for (let i = diaInicio - 1; i > 0; i--) {
      dias.push(new Date(anyo, mes, 1 - i));
    }
    
    const ultimoDiaMes = new Date(anyo, mes + 1, 0).getDate();
    for (let i = 1; i <= ultimoDiaMes; i++) {
      dias.push(new Date(anyo, mes, i));
    }

    const totalCeldas = dias.length <= 35 ? 35 : 42;
    const huecosFinales = totalCeldas - dias.length;
    for (let i = 1; i <= huecosFinales; i++) {
      dias.push(new Date(anyo, mes + 1, i));
    }
    
    this.diasDelMes = dias;
    this.cdr.detectChanges();
  }

  cambiarMes(direccion: number) {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + direccion);
    this.fechaActual = new Date(this.fechaActual);
    this.generarCalendario();
  }

  formatearFecha(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getCitasDelDia(date: Date): Cita[] {
    const fechaString = this.formatearFecha(date);
    return this.citas
      .filter(c => c.fecha === fechaString)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  abrirModalNuevo(date: Date) {
    this.citaForm.reset({
      estado: 'Pendiente',
      fecha: this.formatearFecha(date)
    });
    this.mostrarModal = true;
  }

  cerrarModal() { this.mostrarModal = false; }

  guardarCita() {
    if (this.citaForm.valid) {
      const valores = this.citaForm.value;
      const paciente = this.pacientes[valores.pacienteIndex];

      const nuevaCita: Cita = {
        pacienteId: paciente.id,
        pacienteNombre: paciente.nombre,
        fecha: valores.fecha,
        hora: valores.hora,
        estado: valores.estado,
        motivo: valores.motivo
      };

      this.citasService.addCita(nuevaCita).then(() => {
        this.cerrarModal();
        this.cdr.detectChanges();
      }).catch(err => console.error('Error al agendar:', err));
    } else {
      this.citaForm.markAllAsTouched();
    }
  }

  // 👈 NUEVOS MÉTODOS PARA ACCIONES INTERACTIVAS SOBRE CITAS
  abrirModalGestion(cita: Cita, event: Event) {
    event.stopPropagation(); // Evita que el clic afecte a otros elementos del calendario
    this.citaSeleccionada = cita;
    this.mostrarModalGestion = true;
  }

  cerrarModalGestion() {
    this.mostrarModalGestion = false;
    this.citaSeleccionada = null;
  }

  cambiarEstadoCita(nuevoEstado: 'Pendiente' | 'Confirmada' | 'Atendida' | 'No Asistió') {
    if (this.citaSeleccionada?.id) {
      this.citasService.actualizarEstadoCita(this.citaSeleccionada.id, nuevoEstado as any)
        .then(() => {
          this.cerrarModalGestion();
          this.cdr.detectChanges();
        })
        .catch(err => console.error('Error al cambiar estado:', err));
    }
  }

  removerCita() {
    if (this.citaSeleccionada?.id) {
      this.citasService.eliminarCita(this.citaSeleccionada.id)
        .then(() => {
          this.cerrarModalGestion();
          this.cdr.detectChanges();
        })
        .catch(err => console.error('Error al eliminar cita:', err));
    }
  }

  esMesActual(date: Date): boolean { return date.getMonth() === this.fechaActual.getMonth(); }
  esHoy(date: Date): boolean {
    const hoy = new Date();
    return date.getDate() === hoy.getDate() && date.getMonth() === hoy.getMonth() && date.getFullYear() === hoy.getFullYear();
  }
}