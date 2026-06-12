import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Importaciones de Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth'; // 👈 NUEVA IMPORTACIÓN PARA SEGURIDAD
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    // Configuración Base de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    
    // Proveedor de Cloud Firestore (Base de datos en tiempo real)
    provideFirestore(() => getFirestore()),
    
    // Proveedor de Firebase Authentication (Módulo de Sesiones Protegidas)
    provideAuth(() => getAuth()) // 👈 SELLO DE SEGURIDAD ACTIVADO
  ]
};