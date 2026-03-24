import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { CollaboratorsService } from 'src/app/core/collaborators/collaborators.service';
import { MyPanelView } from 'src/app/core/collaborators/collaborators.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-my-panel',
  imports: [CommonModule, CardComponent],
  templateUrl: './my-panel.component.html',
  styleUrls: ['./my-panel.component.scss']
})
export class MyPanelComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  panel: MyPanelView | null = null;
  updatingTaskId: string | null = null;

  ngOnInit(): void {
    this.loadPanel();
  }

  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  get progressPercent(): number {
    const goal = this.panel?.goalContacts || 0;
    const answered = this.panel?.answeredContacts || 0;

    if (goal <= 0) {
      return 0;
    }

    return Math.min(Math.round((answered / goal) * 100), 100);
  }

  toggleTask(taskId: string, completed: boolean): void {
    if (this.updatingTaskId) {
      return;
    }

    this.updatingTaskId = taskId;
    this.errorMessage = null;

    this.collaboratorsService.updateMyTaskStatus(taskId, { completed }).subscribe({
      next: () => {
        this.updatingTaskId = null;
        this.loadPanel(false);
      },
      error: () => {
        this.errorMessage = 'Não foi possível atualizar a tarefa agora.';
        this.updatingTaskId = null;
      }
    });
  }

  private loadPanel(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }

    this.errorMessage = null;

    this.collaboratorsService.getMyPanel().subscribe({
      next: (response) => {
        this.panel = response;
        this.loading = false;
      },
      error: () => {
        this.panel = null;
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar seu painel.';
      }
    });
  }
}
