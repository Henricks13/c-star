import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AddCollaboratorTaskRequest,
  CollaboratorManagementView,
  CollaboratorMonthlyHistoryItemView,
  CollaboratorPanelView,
  CollaboratorTaskHistoryPageView,
  CollaboratorTaskView,
  MyPanelView,
  SetCollaboratorGoalRequest,
  SetCollaboratorMonthlyGoalRequest,
  UpdateCollaboratorTaskStatusRequest
} from './collaborators.types';

@Injectable({
  providedIn: 'root'
})
export class CollaboratorsService {
  private readonly collaboratorsApiBase = '/api/collaborators';
  private readonly myPanelApiBase = '/api/me/panel';

  constructor(private readonly http: HttpClient) {}

  getMyPanel(date?: string): Observable<MyPanelView> {
    const params = date ? { date } : {};
    return this.http.get<MyPanelView>(this.myPanelApiBase, { params });
  }

  updateMyTaskStatus(taskId: string, payload: UpdateCollaboratorTaskStatusRequest): Observable<CollaboratorTaskView> {
    return this.http.patch<CollaboratorTaskView>(`${this.myPanelApiBase}/tasks/${taskId}`, payload);
  }

  getCollaboratorsPanel(date?: string): Observable<CollaboratorPanelView> {
    const params = date ? { date } : {};
    return this.http.get<CollaboratorPanelView>(`${this.collaboratorsApiBase}/panel`, { params });
  }

  getCollaboratorManagement(userId: string, date?: string): Observable<CollaboratorManagementView> {
    const params = date ? { date } : {};
    return this.http.get<CollaboratorManagementView>(`${this.collaboratorsApiBase}/${userId}/management`, { params });
  }

  getTaskHistory(userId: string, page = 0, size = 20): Observable<CollaboratorTaskHistoryPageView> {
    return this.http.get<CollaboratorTaskHistoryPageView>(`${this.collaboratorsApiBase}/${userId}/tasks/history`, {
      params: { page, size }
    });
  }

  getMonthlyHistory(userId: string, months = 6): Observable<CollaboratorMonthlyHistoryItemView[]> {
    return this.http.get<CollaboratorMonthlyHistoryItemView[]>(`${this.collaboratorsApiBase}/${userId}/monthly-history`, {
      params: { months }
    });
  }

  setGoal(userId: string, payload: SetCollaboratorGoalRequest): Observable<void> {
    return this.http.put<void>(`${this.collaboratorsApiBase}/${userId}/goal`, payload);
  }

  setMonthlyGoal(userId: string, payload: SetCollaboratorMonthlyGoalRequest): Observable<void> {
    return this.http.put<void>(`${this.collaboratorsApiBase}/${userId}/monthly-goal`, payload);
  }

  addTask(userId: string, payload: AddCollaboratorTaskRequest): Observable<CollaboratorTaskView> {
    return this.http.post<CollaboratorTaskView>(`${this.collaboratorsApiBase}/${userId}/tasks`, payload);
  }

  updateTaskStatus(userId: string, taskId: string, payload: UpdateCollaboratorTaskStatusRequest): Observable<CollaboratorTaskView> {
    return this.http.patch<CollaboratorTaskView>(`${this.collaboratorsApiBase}/${userId}/tasks/${taskId}`, payload);
  }

  deleteTask(userId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.collaboratorsApiBase}/${userId}/tasks/${taskId}`);
  }
}
