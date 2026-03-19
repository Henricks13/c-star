import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnamnesisService } from 'src/app/core/anamnesis/anamnesis.service';
import { AnamnesisQuestionItem, AnamnesisQuestionRequest } from 'src/app/core/anamnesis/anamnesis.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-settings-anamnesis-questions',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './settings-anamnesis-questions.component.html',
  styleUrl: './settings-anamnesis-questions.component.scss'
})
export class SettingsAnamnesisQuestionsComponent implements OnInit {
  loading = false;
  saving = false;
  togglingQuestionId: string | null = null;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  questions: AnamnesisQuestionItem[] = [];
  editingId: string | null = null;
  questionPendingDelete: AnamnesisQuestionItem | null = null;
  deleteModalOpen = false;

  form: AnamnesisQuestionRequest = this.defaultForm();

  constructor(private readonly anamnesisService: AnamnesisService) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.errorMessage = null;

    this.anamnesisService.listQuestions().subscribe({
      next: (response) => {
        this.questions = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar as perguntas de anamnese.';
        this.loading = false;
      }
    });
  }

  startCreate(): void {
    this.editingId = null;
    this.form = this.defaultForm();
    this.errorMessage = null;
    this.infoMessage = null;
  }

  startEdit(question: AnamnesisQuestionItem): void {
    this.editingId = question.id;
    this.form = {
      questionText: question.questionText,
      displayOrder: question.displayOrder,
      active: question.active
    };
    this.errorMessage = null;
    this.infoMessage = null;
  }

  cancelEdit(): void {
    this.startCreate();
  }

  save(): void {
    if (this.saving) {
      return;
    }

    const payload: AnamnesisQuestionRequest = {
      questionText: (this.form.questionText || '').trim(),
      displayOrder: Number(this.form.displayOrder || 0),
      active: !!this.form.active
    };

    if (!payload.questionText) {
      this.errorMessage = 'Digite a pergunta para salvar.';
      return;
    }

    if (payload.displayOrder < 0) {
      this.errorMessage = 'A ordem deve ser igual ou maior que zero.';
      return;
    }

    const hasDuplicateOrder = this.questions.some(
      (question) => question.displayOrder === payload.displayOrder && question.id !== this.editingId
    );

    if (hasDuplicateOrder) {
      this.errorMessage = 'Já existe uma pergunta nessa posição. Informe outra ordem.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    const request$ = this.editingId
      ? this.anamnesisService.updateQuestion(this.editingId, payload)
      : this.anamnesisService.createQuestion(payload);

    request$.subscribe({
      next: () => {
        this.infoMessage = this.editingId ? 'Pergunta atualizada com sucesso.' : 'Pergunta criada com sucesso.';
        this.saving = false;
        this.startCreate();
        this.loadQuestions();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível salvar a pergunta.';
        this.saving = false;
      }
    });
  }

  openDeleteModal(question: AnamnesisQuestionItem): void {
    this.questionPendingDelete = question;
    this.deleteModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteModal(): void {
    if (this.saving) {
      return;
    }

    this.deleteModalOpen = false;
    this.questionPendingDelete = null;
  }

  confirmDeleteQuestion(): void {
    if (!this.questionPendingDelete || this.saving) {
      return;
    }

    const question = this.questionPendingDelete;
    this.saving = true;

    this.errorMessage = null;
    this.infoMessage = null;

    this.anamnesisService.deleteQuestion(question.id).subscribe({
      next: () => {
        this.infoMessage = 'Pergunta excluída com sucesso.';
        if (this.editingId === question.id) {
          this.startCreate();
        }
        this.saving = false;
        this.closeDeleteModal();
        this.loadQuestions();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível excluir a pergunta.';
        this.saving = false;
      }
    });
  }

  toggleQuestionActive(question: AnamnesisQuestionItem, nextActive: boolean): void {
    if (this.togglingQuestionId) {
      return;
    }

    this.togglingQuestionId = question.id;
    this.errorMessage = null;
    this.infoMessage = null;

    const payload: AnamnesisQuestionRequest = {
      questionText: question.questionText,
      displayOrder: question.displayOrder,
      active: nextActive
    };

    this.anamnesisService.updateQuestion(question.id, payload).subscribe({
      next: (updated) => {
        question.active = updated.active;
        this.infoMessage = updated.active ? 'Pergunta ativada com sucesso.' : 'Pergunta desativada com sucesso.';
        this.togglingQuestionId = null;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível alterar o status da pergunta.';
        this.togglingQuestionId = null;
      }
    });
  }

  private defaultForm(): AnamnesisQuestionRequest {
    const nextOrder =
      this.questions.length > 0
        ? Math.max(...this.questions.map((question) => Number(question.displayOrder || 0))) + 1
        : 0;

    return {
      questionText: '',
      displayOrder: nextOrder,
      active: true
    };
  }
}
