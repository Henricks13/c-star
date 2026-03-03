// angular import
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);

  submitted = signal(false);
  error = signal('');
  loading = signal(false);
  rememberMe = signal(false);

  loginModal = signal<{ email: string; password: string }>({
    email: '',
    password: ''
  });

  updateLoginField(field: 'email' | 'password', value: string) {
    this.loginModal.update((current) => ({ ...current, [field]: value }));
  }

  onSubmit(event: Event) {
    this.submitted.set(true);
    this.error.set('');

    event.preventDefault();
    const credentials = this.loginModal();

    if (!credentials.email || !credentials.password) {
      this.error.set('Informe e-mail e senha.');
      return;
    }

    this.loading.set(true);
    this.authService
      .login(credentials, this.rememberMe())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/default');
        },
        error: (err) => {
          if (err?.status === 0) {
            this.error.set('Não foi possível conectar ao servidor. Verifique se o backend está no ar.');
          } else if (err?.status === 401) {
            this.error.set('Senha incorreta. Tente novamente.');
          } else if (err?.status === 404) {
            this.error.set('Usuário não encontrado.');
          } else {
            this.error.set(err?.error?.message ?? 'Falha ao autenticar. Tente novamente.');
          }
          this.cd.detectChanges();
        }
      });
  }
}
