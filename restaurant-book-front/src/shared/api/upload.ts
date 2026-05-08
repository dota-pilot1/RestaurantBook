import { api } from "./axios";

type PresignResponse = {
  presignedUrl: string;
  publicUrl: string;
  objectKey: string;
};

export async function uploadImage(file: File, folder = "site"): Promise<string> {
  const presign = await api
    .post<PresignResponse>("/api/upload/presign", {
      filename: file.name,
      contentType: file.type,
      folder,
    })
    .then((r) => r.data);

  const res = await fetch(presign.presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (${res.status})`);
  }

  return presign.publicUrl;
}

export async function uploadProfileImage(file: File): Promise<string> {
  const presign = await api
    .post<PresignResponse>("/api/upload/profile-image/presign", {
      filename: file.name,
      contentType: file.type,
    })
    .then((r) => r.data);

  const res = await fetch(presign.presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (${res.status})`);
  }

  return presign.publicUrl;
}

export async function uploadBoardImage(file: File): Promise<string> {
  const presign = await api
    .post<PresignResponse>("/api/upload/board-image/presign", {
      filename: file.name,
      contentType: file.type,
    })
    .then((r) => r.data);

  const res = await fetch(presign.presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (${res.status})`);
  }

  return presign.publicUrl;
}
