export interface WhatsappSessionInfo {
  connected: boolean;
  displayName?: string | null;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  provider?: string | null;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
}

export interface WhatsappQrCodeResponse {
  qrCodeBase64: string;
  expiresAt?: string | null;
}
