export type RoleSummary = {
  id: number;
  code: string;
  name: string;
};

export type Role = RoleSummary & {
  description?: string | null;
  systemRole: boolean;
  permissions?: PermissionSummary[];
};

export type PermissionSummary = {
  id: number;
  code: string;
  name: string;
  category: string;
};

export type User = {
  id: number;
  email: string;
  username: string;
  role: RoleSummary;
  permissions: string[];
  createdAt?: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  username: string;
  verifiedToken: string;
};

export type SignupResponse = TokenResponse;

export type EmailSendCodeRequest = {
  email: string;
};

export type EmailVerifyCodeRequest = {
  email: string;
  code: string;
};

export type EmailVerifyCodeResponse = {
  verifiedToken: string;
  expiresInSec: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec: number;
  user: User;
};

export type UserListItem = {
  id: number;
  email: string;
  username: string;
  role: RoleSummary;
  active: boolean;
  createdAt: string;
};

export type UserPage = {
  content: UserListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
