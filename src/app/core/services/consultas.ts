import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// Interfaz interna para tipar los insumos consumidos dentro de la consulta
export interface InsumoUsado {
  insumoId: string;
  nombre: string;
  cantidad: number;
}

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
  insumosUtilizados?: InsumoUsado[]; // 👈 ¡ESTA ES LA LÍNEA CRÍTICA QUE FALTABA!
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

  // Método para guardar la consulta
  addConsulta(consulta: Consulta) {
    return addDoc(this.consultasRef, consulta);
  }

  // Lector en tiempo real ordenado cronológicamente
  public consultas$: Observable<Consulta[]> = new Observable((subscriber) => {
    const unsubscribe = onSnapshot(this.consultasRef, (snapshot) => {
      const consultas: Consulta[] = [];
      
      snapshot.forEach((doc) => {
        consultas.push({ id: doc.id, ...doc.data() } as Consulta);
      });
      
      // Ordenamos para que la última atención aparezca arriba
      consultas.sort((a, b) => b.fechaRegistro - a.fechaRegistro);
      
      subscriber.next(consultas);
    }, (error) => {
      subscriber.error(error);
    });

    return () => unsubscribe();
  });
}