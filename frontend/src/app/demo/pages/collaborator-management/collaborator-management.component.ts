import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CollaboratorsService } from 'src/app/core/collaborators/collaborators.service';
import { CollaboratorManagementView, CollaboratorTaskView } from 'src/app/core/collaborators/collaborators.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-collaborator-management',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './collaborator-management.component.html',
  styleUrls: ['./collaborator-management.component.scss']
})
export class CollaboratorManagementComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  collaboratorId: string | null = null;
  selectedDate = this.formatDateInput(new Date());
  selectedMonth = this.formatMonthInput(new Date());

  management: CollaboratorManagementView | null = null;

  dailyGoalDraft = 0;
  monthlyAnsweredGoalDraft = 0;
  monthlySalesGoalDraft = 0;

  newDailyTaskTitle = '';
  newGeneralTaskTitle = '';

  savingDailyGoal = false;
  savingMonthlyGoal = false;
  addingDailyTask = false;
  addingGeneralTask = false;
  togglingTaskId: string | null = null;
  deletingTaskId: string | null = null;
  confirmDeleteModalOpen = false;
  taskPendingDelete: CollaboratorTaskView | null = null;
  historyModalOpen = false;
  historyLoading = false;
  historyTasks: CollaboratorTaskView[] = [];
  historyPage = 0;
  historySize = 20;
  historyTotalPages = 0;
  historyTotalElements = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly collaboratorsService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    this.collaboratorId = this.route.snapshot.paramMap.get('userId');
    if (!this.collaboratorId) {
      this.errorMessage = 'Colaborador não encontrado.';
      return;
    }

    this.loadManagement();
  }

  searchDate(): void {
    this.loadManagement();
  }

  clearDate(): void {
    this.selectedDate = this.formatDateInput(new Date());
    this.loadManagement();
  }

  saveDailyGoal(): void {
    if (!this.collaboratorId || this.savingDailyGoal) {
      return;
    }

    this.savingDailyGoal = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.collaboratorsService
      .setGoal(this.collaboratorId, {
        date: this.selectedDate,
        targetContacts: Math.max(0, Number(this.dailyGoalDraft || 0))
      })
      .subscribe({
        next: () => {
          this.infoMessage = 'Meta diária atualizada com sucesso.';
          this.savingDailyGoal = false;
          this.loadManagement(false);
        },
        error: () => {
          this.errorMessage = 'Não foi possível atualizar a meta diária.';
          this.savingDailyGoal = false;
        }
      });
  }

  saveMonthlyGoal(): void {
    if (!this.collaboratorId || this.savingMonthlyGoal) {
      return;
    }

    const normalizedMonth = `${this.selectedMonth}-01`;

    this.savingMonthlyGoal = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.collaboratorsService
      .setMonthlyGoal(this.collaboratorId, {
        referenceMonth: normalizedMonth,
        targetAnsweredContacts: Math.max(0, Number(this.monthlyAnsweredGoalDraft || 0)),
        targetSalesAmount: Math.max(0, Number(this.monthlySalesGoalDraft || 0))
      })
      .subscribe({
        next: () => {
          this.infoMessage = 'Meta mensal atualizada com sucesso.';
          this.savingMonthlyGoal = false;
          this.loadManagement(false);
        },
        error: () => {
          this.errorMessage = 'Não foi possível atualizar a meta mensal.';
          this.savingMonthlyGoal = false;
        }
      });
  }

  addDailyTask(): void {
    if (!this.collaboratorId || this.addingDailyTask) {
      return;
    }

    const title = (this.newDailyTaskTitle || '').trim();
    if (!title) {
      this.errorMessage = 'Digite o título da tarefa diária.';
      return;
    }

    this.addingDailyTask = true;
    this.errorMessage = null;

    this.collaboratorsService
      .addTask(this.collaboratorId, {
        date: this.selectedDate,
        title,
        taskType: 'DAILY'
      })
      .subscribe({
        next: () => {
          this.newDailyTaskTitle = '';
          this.infoMessage = 'Tarefa diária adicionada com sucesso.';
          this.addingDailyTask = false;
          this.loadManagement(false);
        },
        error: () => {
          this.errorMessage = 'Não foi possível adicionar a tarefa diária.';
          this.addingDailyTask = false;
        }
      });
  }

  addGeneralTask(): void {
    if (!this.collaboratorId || this.addingGeneralTask) {
      return;
    }

    const title = (this.newGeneralTaskTitle || '').trim();
    if (!title) {
      this.errorMessage = 'Digite o título da tarefa.';
      return;
    }

    this.addingGeneralTask = true;
    this.errorMessage = null;

    this.collaboratorsService
      .addTask(this.collaboratorId, {
        title,
        taskType: 'GENERAL'
      })
      .subscribe({
        next: () => {
          this.newGeneralTaskTitle = '';
          this.infoMessage = 'Tarefa adicionada com sucesso.';
          this.addingGeneralTask = false;
          this.loadManagement(false);
        },
        error: () => {
          this.errorMessage = 'Não foi possível adicionar a tarefa.';
          this.addingGeneralTask = false;
        }
      });
  }

  toggleTask(task: CollaboratorTaskView, completed: boolean): void {
    if (!this.collaboratorId || this.togglingTaskId) {
      return;
    }

    this.togglingTaskId = task.id;
    this.errorMessage = null;

    this.collaboratorsService.updateTaskStatus(this.collaboratorId, task.id, { completed }).subscribe({
      next: () => {
        this.togglingTaskId = null;
        this.loadManagement(false);
      },
      error: () => {
        this.errorMessage = 'Não foi possível atualizar a tarefa.';
        this.togglingTaskId = null;
      }
    });
  }

  openDeleteConfirm(task: CollaboratorTaskView): void {
    if (!task || this.deletingTaskId) {
      return;
    }

    this.taskPendingDelete = task;
    this.confirmDeleteModalOpen = true;
  }

  openHistoryModal(): void {
    if (!this.collaboratorId) {
      return;
    }

    this.historyModalOpen = true;
    this.historyTasks = [];

    this.loadHistoryPage(0);
  }

  loadPreviousHistoryPage(): void {
    if (this.historyLoading || this.historyPage <= 0) {
      return;
    }

    this.loadHistoryPage(this.historyPage - 1);
  }

  loadNextHistoryPage(): void {
    if (this.historyLoading || this.historyPage >= this.historyTotalPages - 1) {
      return;
    }

    this.loadHistoryPage(this.historyPage + 1);
  }

  private loadHistoryPage(page: number): void {
    if (!this.collaboratorId) {
      return;
    }

    this.historyLoading = true;

    this.collaboratorsService.getTaskHistory(this.collaboratorId, page, this.historySize).subscribe({
      next: (response) => {
        this.historyTasks = response.content;
        this.historyPage = response.page;
        this.historyTotalPages = response.totalPages;
        this.historyTotalElements = response.totalElements;
        this.historyLoading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar o histórico de tarefas.';
        this.historyLoading = false;
      }
    });
  }

  closeHistoryModal(): void {
    if (this.historyLoading) {
      return;
    }

    this.historyModalOpen = false;
    this.historyTasks = [];
    this.historyPage = 0;
    this.historyTotalPages = 0;
    this.historyTotalElements = 0;
  }

  closeDeleteConfirm(): void {
    if (this.deletingTaskId) {
      return;
    }

    this.confirmDeleteModalOpen = false;
    this.taskPendingDelete = null;
  }

  confirmDeleteTask(): void {
    const task = this.taskPendingDelete;

    if (!task) {
      return;
    }

    this.confirmDeleteModalOpen = false;
    this.deleteTask(task);
  }

  private deleteTask(task: CollaboratorTaskView): void {
    if (!this.collaboratorId || this.deletingTaskId) {
      return;
    }

    this.deletingTaskId = task.id;
    this.errorMessage = null;

    this.collaboratorsService.deleteTask(this.collaboratorId, task.id).subscribe({
      next: () => {
        this.infoMessage = 'Tarefa removida com sucesso.';
        this.deletingTaskId = null;
        this.taskPendingDelete = null;
        this.loadManagement(false);
      },
      error: () => {
        this.errorMessage = 'Não foi possível remover a tarefa.';
        this.deletingTaskId = null;
        this.taskPendingDelete = null;
      }
    });
  }

  getAnsweredMonthPercent(item: { targetAnsweredContacts: number; answeredContacts: number }): number {
    if (!item.targetAnsweredContacts || item.targetAnsweredContacts <= 0) {
      return 0;
    }

    return Math.min(Math.round((item.answeredContacts / item.targetAnsweredContacts) * 100), 100);
  }

  getSalesMonthPercent(item: { targetSalesAmount: number; salesAmount: number }): number {
    if (!item.targetSalesAmount || item.targetSalesAmount <= 0) {
      return 0;
    }

    return Math.min(Math.round((item.salesAmount / item.targetSalesAmount) * 100), 100);
  }

  private loadManagement(showLoading = true): void {
    if (!this.collaboratorId) {
      return;
    }

    if (showLoading) {
      this.loading = true;
    }

    this.errorMessage = null;

    this.collaboratorsService.getCollaboratorManagement(this.collaboratorId, this.selectedDate).subscribe({
      next: (response) => {
        this.management = response;
        this.loading = false;

        this.dailyGoalDraft = response.dailyGoalContacts;
        this.monthlyAnsweredGoalDraft = response.monthlyGoalAnsweredContacts;
        this.monthlySalesGoalDraft = Number(response.monthlyGoalSalesAmount || 0);
      },
      error: () => {
        this.management = null;
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar a gestão do colaborador.';
      }
    });
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMonthInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }
}
