import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  emailUsuario: string = 'Dr. Admin';

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) this.emailUsuario = user.email;
    });
  }
}