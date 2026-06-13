import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot, doc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// Interfaz interna para tipar los insumos consumidos dentro de la consulta
export interface InsumoUsado {
  insumoId: string;
  nombre: string;
  cantidad: number;
}

// Interfaz para tipar los tratamientos asignados desde el buscador interactivo
export interface TratamientoAsignado {
  idUnique: string;
  dienteNumero: number;
  cara: string;
  tratamientoNombre: string;
  tipoBoton: 'ENCONTRADO' | 'NO ATENDIDO';
}

export interface Consulta {
  id?: string;
  pacienteId: string;
  pacienteNombre: string;
  presionArterial: string;
  frecuenciaCardiaca: string;
  costoAtencion: number;
  motivo?: string;             // Opcional por si no se envía en el nuevo flujo
  planTratamiento?: string;    // Mantenido por retrocompatibilidad con registros antiguos
  planTratamientoLista?: TratamientoAsignado[]; // Estructura detallada pieza por pieza
  tratamientosSesionResumen?: string[]; // Nombres de los tratamientos cargados en la sesión
  fechaRegistro: number;
  insumosUtilizados?: InsumoUsado[];
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

  // 👈 MÉTODO OPERATIVO DE BORRADO DE DOCUMENTO EN FIRESTORE
  deleteConsulta(idConsulta: string) {
    const documentoEspecificoRef = doc(this.firestore, `consultas/${idConsulta}`);
    return deleteDoc(documentoEspecificoRef);
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