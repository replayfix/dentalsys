import { Injectable, inject } from '@angular/core';
// Importamos onSnapshot (la función nativa de Firebase para lectura en tiempo real)
import { Firestore, collection, addDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  private firestore = inject(Firestore);
  private pacientesRef = collection(this.firestore, 'pacientes');

  // Construimos nuestro propio Observable usando la API nativa de Firebase.
  // ¡Esto esquiva por completo el bug de Angular Vite!
  public pacientes$: Observable<Paciente[]> = new Observable((subscriber) => {
    
    const unsubscribe = onSnapshot(this.pacientesRef, (snapshot) => {
      const pacientes: Paciente[] = [];
      
      snapshot.forEach((doc) => {
        // Extraemos el ID y los datos de cada paciente
        pacientes.push({ id: doc.id, ...doc.data() } as Paciente);
      });
      
      // Enviamos los datos procesados al componente visual
      subscriber.next(pacientes);
      
    }, (error) => {
      // Si hay un error real de conexión, lo reportamos
      subscriber.error(error);
    });

    // Cuando el usuario cambia de pantalla, limpiamos la conexión
    return () => unsubscribe();
  });

  addPaciente(paciente: Paciente) {
    return addDoc(this.pacientesRef, paciente);
  }
}