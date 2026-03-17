export interface ContactView {
  id: string;
  fullName: string | null;
  phone: string;
  stage: string;
  lastInteractionAt: string | null;
}

export interface ContactPageResponse {
  content: ContactView[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ContactSyncResponse {
  conversationsSynced: number;
  messagesProcessed: number;
}

export interface ContactResetResponse {
  contactsDeleted: number;
  conversationsDeleted: number;
  messagesDeleted: number;
}

export interface ContactMessage {
  id: string;
  direction: string;
  body: string | null;
  sentAt: string;
  waMessageId: string | null;
}
