import { api } from "@/shared/api/axios";
import type {
  EmailSendCodeRequest,
  EmailVerifyCodeRequest,
  EmailVerifyCodeResponse,
  LoginRequest,
  SignupRequest,
  SignupResponse,
  TokenResponse,
  User,
} from "../model/types";

export const authApi = {
  signup: (body: SignupRequest) =>
    api.post<SignupResponse>("/api/auth/signup", body).then((r) => r.data),

  sendEmailCode: (body: EmailSendCodeRequest) =>
    api.post<void>("/api/auth/email/send-code", body).then((r) => r.data),

  verifyEmailCode: (body: EmailVerifyCodeRequest) =>
    api.post<EmailVerifyCodeResponse>("/api/auth/email/verify-code", body).then((r) => r.data),

  checkEmail: (email: string) =>
    api
      .get<{ available: boolean }>("/api/auth/check-email", { params: { email } })
      .then((r) => r.data.available),

  login: (body: LoginRequest) =>
    api.post<TokenResponse>("/api/auth/login", body).then((r) => r.data),

  me: () =>
    api.get<User>("/api/auth/me").then((r) => r.data),

  logout: () =>
    api.post<void>("/api/auth/logout"),
};
