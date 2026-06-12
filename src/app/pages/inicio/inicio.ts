import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 👈 Importamos RouterModule para dar soporte a enlaces interactivos
import { combineLatest } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
// Importamos las configuraciones necesarias de Chart.js
import { Chart, registerables, ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { PacientesService } from '../../core/services/pacientes';
import { ConsultasService } from '../../core/services/consultas';
import { CitasService, Cita } from '../../core/services/citas'; // 👈 Importamos el servicio y la interfaz de citas

// Registro obligatorio global de los elementos de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule], // 👈 Agregamos el RouterModule a la lista de imports
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss']
})
export class InicioComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  private consultasService = inject(ConsultasService);
  private citasService = inject(CitasService); // 👈 Inyectamos el servicio de la agenda
  private cdr = inject(ChangeDetectorRef);

  // Variables para las tarjetas de métricas
  totalPacientes: number = 0;
  gananciasMes: number = 0;
  totalConsultas: number = 0;
  cargando: boolean = true;

  // 👈 Nuevas variables reactivas integradas para el widget del Dashboard
  citasHoy: Cita[] = [];
  cargandoCitas: boolean = true;

  nombreMeses: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  get currentMonthName(): string {
    return this.nombreMeses[new Date().getMonth()];
  }

  // --- CONFIGURACIÓN DE LA GRÁFICA DE LÍNEAS ---
  public lineChartType: ChartType = 'line';
  
  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        label: 'Ingresos Mensuales (S/)',
        backgroundColor: 'rgba(13, 110, 253, 0.06)',
        borderColor: '#0d6efd',
        pointBackgroundColor: '#0d6efd',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0d6efd',
        borderWidth: 3,
        fill: 'origin',
        tension: 0.35 // Curvatura estilizada elegante
      }
    ]
  };

  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false } // Ocultamos leyenda genérica para que se vea más limpio
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    }
  };

  ngOnInit() {
    // 1. 👈 Lanzamos la lectura paralela de los turnos programados para el día de hoy
    this.obtenerCitasDelDia();

    // 2. Escuchamos ambas colecciones de Firebase en tiempo real de forma unificada para el rendimiento financiero
    combineLatest([
      this.pacientesService.pacientes$,
      this.consultasService.consultas$
    ]).subscribe({
      next: ([pacientes, consultas]) => {
        this.totalPacientes = pacientes.length;
        this.totalConsultas = consultas.length;

        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth();
        const anioActual = fechaActual.getFullYear();

        let sumaMesActual = 0;
        const ingresosPorMes = new Array(12).fill(0);

        // Procesamos fila por fila el árbol de datos de consultas
        consultas.forEach(consulta => {
          const fechaConsulta = new Date(consulta.fechaRegistro);
          const mesC = fechaConsulta.getMonth();
          const anioC = fechaConsulta.getFullYear();

          // Agrupamos en el gráfico si pertenece al año en curso
          if (anioC === anioActual) {
            ingresosPorMes[mesC] += consulta.costoAtencion || 0;
          }

          // Sumamos al contador mensual si coincide con el mes corriente
          if (mesC === mesActual && anioC === anioActual) {
            sumaMesActual += consulta.costoAtencion || 0;
          }
        });

        this.gananciasMes = sumaMesActual;

        // Actualización inmutable del objeto de datos para obligar a Chart.js a redibujarse
        this.lineChartData = {
          ...this.lineChartData,
          datasets: [
            {
              ...this.lineChartData.datasets[0],
              data: ingresosPorMes
            }
          ]
        };

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al sincronizar métricas del Dashboard:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 👈 NUEVO MÉTODO INTEGRADO UNIFICADO
  obtenerCitasDelDia() {
    // Generar la fecha de hoy en formato exacto YYYY-MM-DD
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaHoyString = `${yyyy}-${mm}-${dd}`;

    // Escuchar la colección de Firestore en tiempo real
    this.citasService.citas$.subscribe({
      next: (todasLasCitas) => {
        // Filtrar solo las de hoy y ordenarlas cronológicamente por hora
        this.citasHoy = todasLasCitas
          .filter(cita => cita.fecha === fechaHoyString)
          .sort((a, b) => a.hora.localeCompare(b.hora));
        
        this.cargandoCitas = false;
        this.cdr.detectChanges(); // Forzar renderizado reactivo limpio en el widget
      },
      error: (err) => console.error('Error cargando citas en inicio:', err)
    });
  }
}