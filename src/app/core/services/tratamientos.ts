import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot, doc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface TratamientoCatalogo {
  id?: string;
  nombre: string;
  categoria: 'Cirugía' | 'Estética' | 'Preventivo' | 'General';
  fechaRegistro: number;
}

@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  private firestore = inject(Firestore);
  private tratamientosRef = collection(this.firestore, 'tratamientos');

  // Guardar un nuevo tratamiento en el catálogo
  addTratamiento(tratamiento: TratamientoCatalogo) {
    return addDoc(this.tratamientosRef, tratamiento);
  }

  // Eliminar un tratamiento del catálogo
  deleteTratamiento(idTratamiento: string) {
    const docRef = doc(this.firestore, `tratamientos/${idTratamiento}`);
    return deleteDoc(docRef);
  }

  // Lector en tiempo real ordenado alfabéticamente por nombre
  public tratamientos$: Observable<TratamientoCatalogo[]> = new Observable((subscriber) => {
    const unsubscribe = onSnapshot(this.tratamientosRef, (snapshot) => {
      const lista: TratamientoCatalogo[] = [];
      
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() } as TratamientoCatalogo);
      });
      
      // Ordenamos alfabéticamente para que sea fácil de buscar
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      subscriber.next(lista);
    }, (error) => {
      subscriber.error(error);
    });

    return () => unsubscribe();
  });
}