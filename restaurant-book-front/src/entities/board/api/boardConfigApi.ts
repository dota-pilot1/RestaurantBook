import { api } from "@/shared/api/axios";
import type {
  BoardConfig,
  CreateBoardConfigBody,
  UpdateBoardConfigBody,
} from "../model/types";

export const boardConfigApi = {
  list: () => api.get<BoardConfig[]>("/api/admin/board-configs").then((r) => r.data),

  create: (body: CreateBoardConfigBody) =>
    api.post<BoardConfig>("/api/admin/board-configs", body).then((r) => r.data),

  update: (code: string, body: UpdateBoardConfigBody) =>
    api.patch<BoardConfig>(`/api/admin/board-configs/${code}`, body).then((r) => r.data),

  deactivate: (code: string) => api.delete(`/api/admin/board-configs/${code}`),
};
