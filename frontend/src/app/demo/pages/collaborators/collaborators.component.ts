import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CollaboratorsService } from 'src/app/core/collaborators/collaborators.service';
import { CollaboratorPanelItemView, CollaboratorPanelView } from 'src/app/core/collaborators/collaborators.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-collaborators',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './collaborators.component.html',
  styleUrls: ['./collaborators.component.scss']
})
export class CollaboratorsComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  panel: CollaboratorPanelView | null = null;
  selectedDate = this.formatDateInput(new Date());

  constructor(
    private readonly collaboratorsService: CollaboratorsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPanel();
  }

  searchDate(): void {
    this.loadPanel();
  }

  clearDate(): void {
    this.selectedDate = this.formatDateInput(new Date());
    this.loadPanel();
  }

  openManagement(item: CollaboratorPanelItemView): void {
    this.router.navigate(['/collaborators', item.userId]);
  }

  private loadPanel(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }

    this.errorMessage = null;

    this.collaboratorsService.getCollaboratorsPanel(this.selectedDate).subscribe({
      next: (response) => {
        this.panel = response;
        this.loading = false;
      },
      error: () => {
        this.panel = null;
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar o painel de colaboradores.';
      }
    });
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
