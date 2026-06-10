import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// Definimos la estructura exacta que tendrá cada paciente en la base de datos
export interface Paciente {
  id?: string;
  nombre: string;
  dni: string;
  telefono: string;
  fechaRegistro: number;
}

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  // Inyectamos el servicio moderno de Firestore
  private firestore = inject(Firestore);
  
  // Referencia a la colección 'pacientes' en Firebase
  private pacientesCollection = collection(this.firestore, 'pacientes');

  // Método para LEER los pacientes en tiempo real
  getPacientes(): Observable<Paciente[]> {
    return collectionData(this.pacientesCollection, { idField: 'id' }) as Observable<Paciente[]>;
  }

  // Método para CREAR un nuevo paciente
  addPaciente(paciente: Paciente) {
    return addDoc(this.pacientesCollection, paciente);
  }
}