import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Insumo {
  id?: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  fechaActualizacion: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private firestore = inject(Firestore);
  private inventarioRef = collection(this.firestore, 'inventario');

  // Registrar un nuevo insumo
  addInsumo(insumo: Insumo) {
    return addDoc(this.inventarioRef, insumo);
  }

  // NUEVO MÉTODO: Actualiza el stock de un insumo específico en la nube
  actualizarStock(id: string, nuevoStock: number) {
    const docRef = doc(this.firestore, `inventario/${id}`);
    return updateDoc(docRef, { 
      stockActual: nuevoStock, 
      fechaActualizacion: Date.now() 
    });
  }

  // Lector reactivo en tiempo real ordenado de la A a la Z
  public insumos$: Observable<Insumo[]> = new Observable((subscriber) => {
    const unsubscribe = onSnapshot(this.inventarioRef, (snapshot) => {
      const insumos: Insumo[] = [];
      snapshot.forEach((doc) => {
        insumos.push({ id: doc.id, ...doc.data() } as Insumo);
      });
      insumos.sort((a, b) => a.nombre.localeCompare(b.nombre));
      subscriber.next(insumos);
    }, (error) => {
      subscriber.error(error);
    });
    return () => unsubscribe();
  });
}