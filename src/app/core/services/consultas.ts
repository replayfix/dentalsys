import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Consulta {
  id?: string;
  pacienteId: string;
  pacienteNombre: string;
  presionArterial: string;
  frecuenciaCardiaca: string;
  costoAtencion: number;
  motivo: string;
  planTratamiento: string;
  fechaRegistro: number;
  odontograma: {
    cuadrante1: any[];
    cuadrante2: any[];
    cuadrante3: any[];
    cuadrante4: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private firestore = inject(Firestore);
  private consultasRef = collection(this.firestore, 'consultas');

  // Método para guardar
  addConsulta(consulta: Consulta) {
    return addDoc(this.consultasRef, consulta);
  }

  // NUEVO MÉTODO: Escucha en tiempo real libre de bugs de proxy
  public consultas$: Observable<Consulta[]> = new Observable((subscriber) => {
    const unsubscribe = onSnapshot(this.consultasRef, (snapshot) => {
      const consultas: Consulta[] = [];
      
      snapshot.forEach((doc) => {
        consultas.push({ id: doc.id, ...doc.data() } as Consulta);
      });
      
      // Ordenamos las consultas para que la última atención aparezca primero
      consultas.sort((a, b) => b.fechaRegistro - a.fechaRegistro);
      
      subscriber.next(consultas);
    }, (error) => {
      subscriber.error(error);
    });

    return () => unsubscribe();
  });
}