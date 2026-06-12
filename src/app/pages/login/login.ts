import { Component, inject, ChangeDetectorRef } from '@angular/core'; // 👈 Importamos ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // 👈 Inyectamos el detector de cambios

  loginForm: FormGroup;
  cargando: boolean = false;
  errorMensaje: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.cargando = true;
      this.errorMensaje = '';
      const { correo, contrasenia } = this.loginForm.value;

      this.authService.login(correo, contrasenia)
        .then(() => {
          this.router.navigate(['/inicio']);
        })
        .catch(error => {
          console.error('Error de login:', error);
          
          // Clasificamos el error para darle mejor feedback al doctor
          if (error.code === 'auth/api-key-not-valid') {
            this.errorMensaje = 'Error de configuración: La API Key de Firebase no es válida.';
          } else {
            this.errorMensaje = 'El correo o la contraseña son incorrectos.';
          }

          this.cargando = false;
          this.cdr.detectChanges(); // 👈 ¡MÁGICO! Fuerza a la interfaz a reaccionar y desbloquear el botón
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}