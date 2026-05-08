import { api } from "@/shared/api/axios";
import type {
  BoardComment,
  BoardConfig,
  BoardDetail,
  BoardSummary,
  CreateBoardBody,
  PageResponse,
  UpdateBoardBody,
} from "../model/types";

export const boardApi = {
  configs: () => api.get<BoardConfig[]>("/api/boards/configs").then((r) => r.data),

  list: (code: string, page = 0, size = 20) =>
    api
      .get<PageResponse<BoardSummary>>(`/api/boards/${code}`, { params: { page, size } })
      .then((r) => r.data),

  detail: (code: string, id: number) =>
    api.get<BoardDetail>(`/api/boards/${code}/${id}`).then((r) => r.data),

  comments: (code: string, id: number) =>
    api.get<BoardComment[]>(`/api/boards/${code}/${id}/comments`).then((r) => r.data),

  createComment: (code: string, id: number, content: string) =>
    api.post<BoardComment>(`/api/boards/${code}/${id}/comments`, { content }).then((r) => r.data),

  create: (code: string, body: CreateBoardBody) =>
    api.post<BoardDetail>(`/api/boards/${code}`, body).then((r) => r.data),

  update: (code: string, id: number, body: UpdateBoardBody) =>
    api.patch<BoardDetail>(`/api/boards/${code}/${id}`, body).then((r) => r.data),

  delete: (code: string, id: number) => api.delete(`/api/boards/${code}/${id}`),
};
