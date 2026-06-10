import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss']
})
export class InicioComponent {
  // Datos duros iniciales que luego conectaremos de forma limpia a Firestore
  totalPacientes: number = 2;
  citasHoy: number = 0;
  ingresosMes: number = 55.00;
  mesActual: string = 'Mayo 2026';
}