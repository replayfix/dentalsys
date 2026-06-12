import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Cita {
  id?: string;
  pacienteId: string;
  pacienteNombre: string;
  fecha: string;        // Formato estable: YYYY-MM-DD
  hora: string;         // Formato: HH:MM
  estado: 'Pendiente' | 'Confirmada' | 'Atendida' | 'No Asistió'; // 👈 CORREGIDO: Agregamos el estado de inasistencia
  motivo: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private firestore = inject(Firestore);
  private citasRef = collection(this.firestore, 'citas');

  // Lector reactivo global de citas en tiempo real
  public citas$: Observable<Cita[]> = new Observable((subscriber) => {
    const unsubscribe = onSnapshot(this.citasRef, (snapshot) => {
      const citas: Cita[] = [];
      snapshot.forEach((doc) => {
        citas.push({ id: doc.id, ...doc.data() } as Cita);
      });
      subscriber.next(citas);
    }, (error) => {
      subscriber.error(error);
    });
    return () => unsubscribe();
  });

  // Agendar nueva cita
  addCita(cita: Cita) {
    return addDoc(this.citasRef, cita);
  }

  // Cambiar estado (Pendiente -> Confirmada -> Atendida -> No Asistió)
  actualizarEstadoCita(id: string, nuevoEstado: 'Pendiente' | 'Confirmada' | 'Atendida' | 'No Asistió') { // 👈 CORREGIDO AQUÍ TAMBIÉN
    const docRef = doc(this.firestore, `citas/${id}`);
    return updateDoc(docRef, { estado: nuevoEstado });
  }

  // Cancelar / Eliminar cita
  eliminarCita(id: string) {
    const docRef = doc(this.firestore, `citas/${id}`);
    return deleteDoc(docRef);
  }
}