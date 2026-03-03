export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface SessionUser {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface SessionData {
  token: string;
  tokenType: string;
  expiresAt: number;
  user: SessionUser;
}
