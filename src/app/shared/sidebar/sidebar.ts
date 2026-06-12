import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  ejecutarLogout() {
    if (confirm('¿Está seguro de que desea cerrar sesión en DentalSys?')) {
      this.authService.logout().then(() => {
        this.router.navigate(['/login']);
      });
    }
  }
}