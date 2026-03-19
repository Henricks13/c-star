import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AnamnesisService } from 'src/app/core/anamnesis/anamnesis.service';
import { PublicAnamnesisForm, SubmitPublicAnamnesisRequest } from 'src/app/core/anamnesis/anamnesis.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-public-anamnesis',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './public-anamnesis.component.html',
  styleUrl: './public-anamnesis.component.scss'
})
export class PublicAnamnesisComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  formData: PublicAnamnesisForm | null = null;

  clientIdQuery: string | null = null;
  cpfSearch = '';

  answersMap: Record<string, string> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly anamnesisService: AnamnesisService
  ) {}

  ngOnInit(): void {
    const clientId = (this.route.snapshot.queryParamMap.get('clientId') || '').trim();
    const cpf = (this.route.snapshot.queryParamMap.get('cpf') || '').trim();

    this.clientIdQuery = clientId || null;
    this.cpfSearch = cpf || '';

    if (this.clientIdQuery || this.cpfSearch) {
      this.fetchForm(this.clientIdQuery, this.cpfSearch || null);
    }
  }

  searchByCpf(): void {
    const cpf = (this.cpfSearch || '').trim();
    if (!cpf) {
      this.errorMessage = 'Informe o CPF para localizar a anamnese.';
      return;
    }

    this.fetchForm(null, cpf);
  }

  private fetchForm(clientId?: string | null, cpf?: string | null): void {
    this.loading = true;
    this.errorMessage = null;
    this.infoMessage = null;
    this.formData = null;
    this.answersMap = {};

    this.anamnesisService.getPublicForm(clientId || null, cpf || null).subscribe({
      next: (response) => {
        this.formData = response;

        if (!response.answered) {
          for (const question of response.questions) {
            this.answersMap[question.id] = '';
          }
        }

        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível carregar os dados da anamnese.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (!this.formData || this.formData.answered || this.saving) {
      return;
    }

    const answers = this.formData.questions.map((question) => ({
      questionId: question.id,
      answerText: (this.answersMap[question.id] || '').trim()
    }));

    const hasEmpty = answers.some((item) => !item.answerText);
    if (hasEmpty) {
      this.errorMessage = 'Responda todas as perguntas antes de enviar.';
      return;
    }

    const payload: SubmitPublicAnamnesisRequest = {
      clientId: this.formData.clientId,
      answers
    };

    this.saving = true;
    this.errorMessage = null;

    this.anamnesisService.submitPublic(payload).subscribe({
      next: (response) => {
        this.formData = response;
        this.saving = false;
        this.infoMessage = 'Anamnese enviada com sucesso.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível enviar a anamnese.';
        this.saving = false;
      }
    });
  }
}
