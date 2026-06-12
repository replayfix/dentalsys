import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  // Emite el objeto del usuario si está logueado, o 'null' si no lo está
  public user$: Observable<any> = user(this.auth);

  // Método para validar credenciales
  login(correo: string, contrasenia: string) {
    return signInWithEmailAndPassword(this.auth, correo, contrasenia);
  }

  // Método para cerrar sesión de forma segura
  logout() {
    return signOut(this.auth);
  }
}