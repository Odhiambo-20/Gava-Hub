export type Role = "ROLE_USER" | "ROLE_ADMIN" | "ROLE_VERIFIER";

export interface TokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  userId: string;
  roles: Role[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  accountType: "CANDIDATE" | "EMPLOYER" | "INSTITUTION";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiErrorBody {
  status?: number;
  message?: string;
  violations?: Record<string, string>;
}
