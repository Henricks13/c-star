// angular import
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ThemeModeService } from 'src/app/core/theme/theme-mode.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly themeModeService = inject(ThemeModeService);

  submitted = signal(false);
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  registerModel = signal<{ email: string; password: string; firstName: string; lastName: string }>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  updateRegisterField(field: 'firstName' | 'lastName' | 'email' | 'password', value: string) {
    this.registerModel.update((current) => ({ ...current, [field]: value }));
  }

  onSubmit(event: Event) {
    this.submitted.set(true);
    this.error.set('');
    event.preventDefault();

    const form = this.registerModel();
    const fullName = `${form.firstName} ${form.lastName}`.trim();

    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      this.error.set('Preencha todos os campos.');
      return;
    }

    if (form.password.length < 8) {
      this.error.set('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    this.loading.set(true);
    this.authService
      .register({ email: form.email, password: form.password, fullName }, true)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/default'),
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Não foi possível concluir o cadastro.');
          this.cd.detectChanges();
        }
      });
  }

  get logoPath(): string {
    return this.themeModeService.getCurrentMode() === 'dark' ? 'assets/images/logo-dark.svg' : 'assets/images/logo.svg';
  }
}
