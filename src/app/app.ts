import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 1. 👇 Importante para usar *ngIf
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { NavbarComponent } from './shared/navbar/navbar'; 
import { AuthService } from './core/services/auth'; // 2. 👇 Importamos el servicio

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NavbarComponent], // 3. 👇 Agregado CommonModule
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  title = 'dentalsys';
  private authService = inject(AuthService);
  
  usuarioLogueado: any = null;

  ngOnInit() {
    // Escuchamos en tiempo real si el doctor está dentro del sistema
    this.authService.user$.subscribe(user => {
      this.usuarioLogueado = user;
    });
  }
}