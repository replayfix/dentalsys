import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacientesService, Paciente } from '../../core/services/pacientes';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.scss']
})
export class PacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  
  // Observable que mantendrá la tabla sincronizada con Firebase
  pacientes$!: Observable<Paciente[]>;

  ngOnInit() {
    // Al cargar la pantalla, nos suscribimos a la colección
    this.pacientes$ = this.pacientesService.getPacientes();
  }

  // Función temporal para insertar un registro y probar la base de datos
  agregarPacientePrueba() {
    const nuevoPaciente: Paciente = {
      nombre: 'Juan Pérez',
      dni: '76543210',
      telefono: '987654321',
      fechaRegistro: Date.now()
    };

    this.pacientesService.addPaciente(nuevoPaciente)
      .then(() => console.log('¡Paciente guardado exitosamente en Firestore!'))
      .catch(error => console.error('Error al guardar:', error));
  }
}