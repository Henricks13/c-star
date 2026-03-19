import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/core/auth/auth.service';
import { CreateUserRequest, UpdateUserRequest, UserListItem } from 'src/app/core/users/users.types';
import { UsersService } from 'src/app/core/users/users.service';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  loading = false;
  saving = false;
  savingPassword = false;
  togglingUserId: string | null = null;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  users: UserListItem[] = [];
  selectedUser: UserListItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  passwordModalOpen = false;

  form: CreateUserRequest = {
    fullName: '',
    email: '',
    password: '',
    roleCode: 'COLABORADOR'
  };

  editForm: UpdateUserRequest = {
    fullName: '',
    email: '',
    roleCode: 'COLABORADOR',
    enabled: true
  };

  passwordForm = {
    password: '',
    confirmPassword: ''
  };

  readonly roleOptions = [
    { value: 'COLABORADOR', label: 'Colaborador' },
    { value: 'MASTER_ADMIN', label: 'Master Admin' },
    { value: 'DEV_SUPORTE', label: 'Dev Suporte' }
  ];

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.canManageUsers()) {
      this.router.navigate(['/access-denied']);
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = null;

    this.usersService.list().subscribe({
      next: (response) => {
        this.users = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os usuários.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.errorMessage = null;
    this.infoMessage = null;
    this.form = {
      fullName: '',
      email: '',
      password: '',
      roleCode: 'COLABORADOR'
    };
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createUser(): void {
    if (this.saving) {
      return;
    }

    const payload: CreateUserRequest = {
      fullName: this.form.fullName.trim(),
      email: this.form.email.trim().toLowerCase(),
      password: this.form.password,
      roleCode: this.form.roleCode
    };

    if (!payload.fullName || !payload.email || !payload.password) {
      this.errorMessage = 'Preencha nome, e-mail e senha.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.usersService.create(payload).subscribe({
      next: () => {
        this.infoMessage = 'Usuário criado com sucesso.';
        this.closeCreateModal();
        this.saving = false;
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível criar o usuário.';
        this.saving = false;
      }
    });
  }

  openEditModal(user: UserListItem): void {
    this.selectedUser = user;
    this.editForm = {
      fullName: user.fullName,
      email: user.email,
      roleCode: user.roles?.[0] || 'COLABORADOR',
      enabled: user.enabled
    };
    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedUser = null;
  }

  saveEditUser(): void {
    if (!this.selectedUser || this.saving) {
      return;
    }

    const payload: UpdateUserRequest = {
      fullName: this.editForm.fullName.trim(),
      email: this.editForm.email.trim().toLowerCase(),
      roleCode: this.editForm.roleCode,
      enabled: this.editForm.enabled
    };

    if (!payload.fullName || !payload.email) {
      this.errorMessage = 'Preencha nome e e-mail.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.usersService.update(this.selectedUser.id, payload).subscribe({
      next: () => {
        this.infoMessage = 'Usuário atualizado com sucesso.';
        this.saving = false;
        this.closeEditModal();
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar o usuário.';
        this.saving = false;
      }
    });
  }

  openPasswordModal(user: UserListItem): void {
    this.selectedUser = user;
    this.passwordForm = {
      password: '',
      confirmPassword: ''
    };
    this.errorMessage = null;
    this.infoMessage = null;
    this.passwordModalOpen = true;
  }

  closePasswordModal(): void {
    this.passwordModalOpen = false;
    this.selectedUser = null;
  }

  saveUserPassword(): void {
    if (!this.selectedUser || this.savingPassword) {
      return;
    }

    const password = this.passwordForm.password;
    const confirmPassword = this.passwordForm.confirmPassword;

    if (!password || password.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    if (password !== confirmPassword) {
      this.errorMessage = 'Senha e confirmação não conferem.';
      return;
    }

    this.savingPassword = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.usersService.updatePassword(this.selectedUser.id, { password }).subscribe({
      next: () => {
        this.infoMessage = 'Senha atualizada com sucesso.';
        this.savingPassword = false;
        this.closePasswordModal();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar a senha.';
        this.savingPassword = false;
      }
    });
  }

  toggleUserEnabled(user: UserListItem, nextEnabled: boolean): void {
    if (this.togglingUserId) {
      return;
    }

    const payload: UpdateUserRequest = {
      fullName: user.fullName,
      email: user.email,
      roleCode: user.roles?.[0] || 'COLABORADOR',
      enabled: nextEnabled
    };

    this.togglingUserId = user.id;
    this.errorMessage = null;
    this.infoMessage = null;

    this.usersService.update(user.id, payload).subscribe({
      next: (updated) => {
        user.enabled = updated.enabled;
        this.infoMessage = updated.enabled ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.';
        this.togglingUserId = null;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível alterar o status do usuário.';
        this.togglingUserId = null;
      }
    });
  }

  private canManageUsers(): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    const email = (user.email || '').trim().toLowerCase();
    const roles = (user.roles || []).map((role) => (role || '').trim().toUpperCase());

    return email === 'carol@gmail.com' || roles.includes('DEV_SUPORTE') || roles.includes('MASTER_ADMIN');
  }
}
