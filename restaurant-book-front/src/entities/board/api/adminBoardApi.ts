import { api } from "@/shared/api/axios";
import type {
  BoardComment,
  BoardDetail,
  BoardSummary,
  CreateBoardBody,
  PageResponse,
  UpdateBoardBody,
} from "../model/types";

export const adminBoardApi = {
  unansweredInquiryCount: () =>
    api.get<{ count: number }>("/api/admin/boards/inquiries/unanswered-count").then((r) => r.data),

  list: (code: string, page = 0, size = 20) =>
    api
      .get<PageResponse<BoardSummary>>(`/api/admin/boards/${code}`, { params: { page, size } })
      .then((r) => r.data),

  detail: (code: string, id: number) =>
    api.get<BoardDetail>(`/api/admin/boards/${code}/${id}`).then((r) => r.data),

  comments: (code: string, id: number) =>
    api.get<BoardComment[]>(`/api/admin/boards/${code}/${id}/comments`).then((r) => r.data),

  create: (code: string, body: CreateBoardBody) =>
    api.post<BoardDetail>(`/api/admin/boards/${code}`, body).then((r) => r.data),

  update: (code: string, id: number, body: UpdateBoardBody) =>
    api.patch<BoardDetail>(`/api/admin/boards/${code}/${id}`, body).then((r) => r.data),

  updateVisibility: (code: string, id: number, visible: boolean) =>
    api.patch(`/api/admin/boards/${code}/${id}/visibility`, { visible }),

  pin: (code: string, id: number) => api.patch(`/api/admin/boards/${code}/${id}/pin`),

  unpin: (code: string, id: number) => api.patch(`/api/admin/boards/${code}/${id}/unpin`),

  createComment: (code: string, id: number, content: string) =>
    api
      .post<BoardComment>(`/api/admin/boards/${code}/${id}/comments`, { content })
      .then((r) => r.data),

  updateComment: (commentId: number, content: string) =>
    api.patch<BoardComment>(`/api/admin/boards/comments/${commentId}`, { content }).then((r) => r.data),

  deleteComment: (commentId: number) => api.delete(`/api/admin/boards/comments/${commentId}`),

  delete: (code: string, id: number) => api.delete(`/api/admin/boards/${code}/${id}`),
};
