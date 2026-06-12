import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Evaluamos el estado del token de Firebase
  return user(auth).pipe(
    take(1),
    map(currentUser => {
      if (currentUser) {
        return true; // Acceso concedido
      } else {
        console.warn('🔒 Acceso denegado. Redirigiendo al Login.');
        router.navigate(['/login']);
        return false; // Acceso bloqueado
      }
    })
  );
};