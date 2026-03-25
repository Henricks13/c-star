// Angular import
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

// third party import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ThemeMode, ThemeModeService } from 'src/app/core/theme/theme-mode.service';

@Component({
  selector: 'app-nav-right',
  imports: [RouterModule, SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeModeService = inject(ThemeModeService);

  themeMode: ThemeMode = this.themeModeService.getCurrentMode();

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get isDarkMode(): boolean {
    return this.themeMode === 'dark';
  }

  toggleTheme(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextMode: ThemeMode = input.checked ? 'dark' : 'light';
    this.themeMode = nextMode;
    this.themeModeService.setUserMode(nextMode);
  }
}
