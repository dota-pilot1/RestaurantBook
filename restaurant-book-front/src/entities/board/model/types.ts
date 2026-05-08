export type BoardKind = "NOTICE" | "INQUIRY" | "FAQ" | "EVENT";

export type BoardStatus = "PUBLISHED" | "HIDDEN" | "DRAFT";

export type BoardConfig = {
  id: number;
  code: string;
  kind: BoardKind;
  displayName: string;
  description: string | null;
  allowCustomerWrite: boolean;
  allowComment: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardSummary = {
  id: number;
  boardCode: string;
  title: string;
  authorName: string;
  status: BoardStatus;
  pinned: boolean;
  answered: boolean;
  viewCount: number;
  createdAt: string;
};

export type BoardDetail = BoardSummary & {
  content: string;
  canEdit: boolean;
  updatedAt: string;
};

export type BoardComment = {
  id: number;
  boardId: number;
  authorName: string;
  content: string;
  adminReply: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type CreateBoardBody = {
  title: string;
  content: string;
  status?: BoardStatus;
};

export type UpdateBoardBody = {
  title: string;
  content: string;
  status?: BoardStatus;
};

export type CreateBoardConfigBody = {
  code: string;
  kind: BoardKind;
  displayName: string;
  description?: string | null;
  allowCustomerWrite: boolean;
  allowComment: boolean;
  sortOrder: number;
};

export type UpdateBoardConfigBody = Omit<CreateBoardConfigBody, "code" | "kind"> & {
  active: boolean;
};
