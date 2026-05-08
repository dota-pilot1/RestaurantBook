export type StaffCallStatus = "PENDING" | "ACKNOWLEDGED" | "CANCELED";

export type StaffCallType = "GENERAL" | "REFILL" | "QUESTION" | "PAYMENT" | "OTHER";

export type CreateStaffCallBody = {
  tableName: string;
  type?: StaffCallType;
  message?: string | null;
};

export type CancelStaffCallBody = {
  tableName: string;
};

export type StaffCall = {
  id: number;
  tableName: string;
  type: StaffCallType;
  message: string | null;
  status: StaffCallStatus;
  acknowledgedAt: string | null;
  acknowledgedBy: number | null;
  createdAt: string;
  updatedAt: string;
};
