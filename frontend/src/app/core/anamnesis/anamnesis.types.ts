export interface AnamnesisQuestionItem {
  id: string;
  questionText: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnamnesisQuestionRequest {
  questionText: string;
  displayOrder: number;
  active: boolean;
}

export interface PublicAnamnesisQuestionItem {
  id: string;
  questionText: string;
  displayOrder: number;
}

export interface PublicAnamnesisAnsweredItem {
  questionIdSnapshot: string | null;
  questionText: string;
  answerText: string;
  displayOrder: number;
}

export interface PublicAnamnesisForm {
  clientId: string;
  clientName: string;
  cpf: string | null;
  answered: boolean;
  submittedAt: string | null;
  questions: PublicAnamnesisQuestionItem[];
  answers: PublicAnamnesisAnsweredItem[];
}

export interface SubmitPublicAnamnesisAnswerRequest {
  questionId: string;
  answerText: string;
}

export interface SubmitPublicAnamnesisRequest {
  clientId?: string | null;
  cpf?: string | null;
  answers: SubmitPublicAnamnesisAnswerRequest[];
}
