import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-home-redirect',
  template: ''
})
export class HomeRedirectComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const isCollaborator = this.authService.hasRole('COLABORADOR');
    this.router.navigateByUrl(isCollaborator ? '/contacts/geral' : '/default', { replaceUrl: true });
  }
}
