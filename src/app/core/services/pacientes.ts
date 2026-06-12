import { Injectable, inject } from '@angular/core';
// Importamos las funciones nativas necesarias de Firebase para lectura, inserción y borrado
import { Firestore, collection, addDoc, onSnapshot, doc, deleteDoc } from '@angular/fire/firestore'; 
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

  // Método para registrar un nuevo paciente en la nube
  addPaciente(paciente: Paciente) {
    return addDoc(this.pacientesRef, paciente);
  }

  // NUEVO MÉTODO: Eliminar un paciente permanentemente de la nube
  eliminarPaciente(id: string) {
    const docRef = doc(this.firestore, `pacientes/${id}`);
    return deleteDoc(docRef);
  }
}