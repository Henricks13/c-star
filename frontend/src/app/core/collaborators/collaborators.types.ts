export interface CollaboratorTaskView {
  id: string;
  title: string;
  completed: boolean;
  taskType: 'DAILY' | 'GENERAL';
  taskDate: string;
  createdAt: string;
  completedAt: string | null;
}

export interface CollaboratorTaskHistoryPageView {
  content: CollaboratorTaskView[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CollaboratorPanelItemView {
  userId: string;
  fullName: string;
  dailyGoalContacts: number;
  dailyAnsweredContacts: number;
  monthlySalesGoal: number;
  monthlySalesProgress: number;
  dailyTasksCompletionPercent: number;
  allTasksCompletionPercent: number;
  dailyTasks: CollaboratorTaskView[];
  generalTasks: CollaboratorTaskView[];
}

export interface CollaboratorPanelView {
  date: string;
  collaborators: CollaboratorPanelItemView[];
}

export interface MyPanelView {
  date: string;
  userId: string;
  fullName: string;
  goalContacts: number;
  answeredContacts: number;
  remainingContacts: number;
  totalTasks: number;
  completedTasks: number;
  dailyTasks: CollaboratorTaskView[];
  generalTasks: CollaboratorTaskView[];
  achievedDates: string[];
}

export interface CollaboratorMonthlyHistoryItemView {
  referenceMonth: string;
  targetAnsweredContacts: number;
  answeredContacts: number;
  targetSalesAmount: number;
  salesAmount: number;
  answeredGoalReached: boolean;
  salesGoalReached: boolean;
}

export interface CollaboratorManagementView {
  userId: string;
  fullName: string;
  date: string;
  dailyGoalContacts: number;
  dailyAnsweredContacts: number;
  monthlyGoalAnsweredContacts: number;
  monthlyAnsweredContacts: number;
  monthlyGoalSalesAmount: number;
  monthlySalesAmount: number;
  dailyTasksCompletionPercent: number;
  allTasksCompletionPercent: number;
  dailyTasks: CollaboratorTaskView[];
  generalTasks: CollaboratorTaskView[];
  monthlyHistory: CollaboratorMonthlyHistoryItemView[];
}

export interface SetCollaboratorGoalRequest {
  date: string;
  targetContacts: number;
}

export interface SetCollaboratorMonthlyGoalRequest {
  referenceMonth: string;
  targetAnsweredContacts: number;
  targetSalesAmount: number;
}

export interface AddCollaboratorTaskRequest {
  date?: string;
  title: string;
  taskType: 'DAILY' | 'GENERAL';
}

export interface UpdateCollaboratorTaskStatusRequest {
  completed: boolean;
}
