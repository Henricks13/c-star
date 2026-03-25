import { CommonModule } from '@angular/common';
import { Component, Type } from '@angular/core';

import { AuthService } from 'src/app/core/auth/auth.service';
import { CollaboratorsComponent } from '../collaborators/collaborators.component';
import { MyPanelComponent } from './my-panel.component';

@Component({
  selector: 'app-my-panel-shell',
  imports: [CommonModule],
  template: `<ng-container *ngComponentOutlet="targetComponent"></ng-container>`
})
export class MyPanelShellComponent {
  readonly targetComponent: Type<unknown>;

  constructor(private readonly authService: AuthService) {
    this.targetComponent = this.canSeeGlobalPanel() ? CollaboratorsComponent : MyPanelComponent;
  }

  private canSeeGlobalPanel(): boolean {
    return this.authService.hasAnyRole(['MASTER_ADMIN', 'DEV_SUPORTE']);
  }
}
