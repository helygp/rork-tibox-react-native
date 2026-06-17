import { getAccessToken } from "./supabase";
import type { Gift, GiftStatus, GiftStyle, GiftType, DeliveryMode } from "@/types/gift";

const BASE_URL = "https://api.tibox.aurabr.app";

/** Generic API error thrown on non-2xx responses. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = `Erro ${res.status}`;
    try {
      const json = JSON.parse(body) as Record<string, unknown>;
      message = (json.message as string) || (json.error as string) || message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

/* ── Health ── */

export async function healthCheck(): Promise<boolean> {
  try {
    await apiFetch("/health");
    return true;
  } catch {
    return false;
  }
}

/* ── Gift DTOs ── */

export interface CreateGiftPayload {
  recipientName: string;
  recipientWhatsapp?: string;
  occasion?: string;
  message: string;
  type: GiftType;
  style: GiftStyle;
  deliveryMode: DeliveryMode;
  scheduledFor?: string;
  notifyWhatsapp: boolean;
  unlockCode: string;
  /** Array of media IDs already uploaded. */
  mediaIds?: string[];
}

export interface GiftResponse {
  id: string;
  publicId: string;
  recipientName: string;
  recipientWhatsapp?: string;
  occasion?: string;
  message: string;
  media: Array<{ id: string; uri: string; kind: "image" | "video" }>;
  type: GiftType;
  style: GiftStyle;
  deliveryMode: DeliveryMode;
  scheduledFor?: string;
  notifyWhatsapp: boolean;
  unlockCode: string;
  status: GiftStatus;
  clipUri?: string;
  createdAt: string;
  openedAt?: string;
}

export interface GiftStatusResponse {
  id: string;
  status: GiftStatus;
  clipUri?: string;
  progress?: number;
  error?: string;
}

export interface UploadResponse {
  id: string;
  uri: string;
  kind: "image" | "video";
}

function fromResponse(r: GiftResponse): Gift {
  return { ...r };
}

/* ── Gifts CRUD ── */

/** List gifts for the current user. Falls back gracefully if endpoint not yet available. */
export async function listGifts(): Promise<Gift[]> {
  try {
    const data = await apiFetch<GiftResponse[]>("/gifts");
    return data.map(fromResponse);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      console.log("[API] GET /gifts not yet available on backend.");
      return [];
    }
    throw err;
  }
}

/** Create a gift without media first, then upload media separately. */
export async function createGift(
  payload: CreateGiftPayload,
): Promise<GiftResponse> {
  const data = await apiFetch<GiftResponse>("/gifts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

/** Get single gift by ID. */
export async function getGift(id: string): Promise<GiftResponse> {
  return apiFetch<GiftResponse>(`/gifts/${id}`);
}

/** Update gift status / fields. */
export async function updateGift(
  id: string,
  patch: Partial<Pick<Gift, "status" | "clipUri" | "openedAt">>,
): Promise<GiftResponse> {
  return apiFetch<GiftResponse>(`/gifts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** Delete a gift. */
export async function deleteGift(id: string): Promise<void> {
  await apiFetch(`/gifts/${id}`, { method: "DELETE" });
}

/* ── Media Upload ── */

/** Upload a single file from a local URI. Returns the remote media object. */
export async function uploadMedia(
  localUri: string,
  kind: "image" | "video",
): Promise<UploadResponse> {
  const token = await getAccessToken();
  const form = new FormData();

  const fileName = localUri.split("/").pop() ?? "file";
  const mimeType = kind === "image" ? "image/jpeg" : "video/mp4";

  form.append("file", {
    uri: localUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/gifts/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new ApiError(`Upload failed: ${res.status}`, res.status);
  return (await res.json()) as UploadResponse;
}

/* ── Generation ── */

/** Trigger video generation for a gift. */
export async function startGeneration(giftId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/gifts/${giftId}/generate`, {
    method: "POST",
  });
}

/** Poll the generation status for a gift. */
export async function getGenerationStatus(
  giftId: string,
): Promise<GiftStatusResponse> {
  return apiFetch<GiftStatusResponse>(`/gifts/${giftId}/status`);
}

/* ── Public ── */

export interface PublicGiftResponse {
  id: string;
  publicId: string;
  recipientName: string;
  message: string;
  media: Array<{ id: string; uri: string; kind: "image" | "video" }>;
  type: GiftType;
  style: GiftStyle;
  unlockCode: string;
  status: GiftStatus;
  clipUri?: string;
}

/** Fetch a public gift by its publicId (no auth needed — or uses public anon key). */
export async function getPublicGift(
  publicId: string,
): Promise<PublicGiftResponse> {
  const res = await fetch(`${BASE_URL}/public/gifts/${publicId}`);
  if (!res.ok) throw new ApiError(`Public gift not found: ${res.status}`, res.status);
  return (await res.json()) as PublicGiftResponse;
}

/** Unlock a public gift (validate code). */
export async function unlockPublicGift(
  publicId: string,
  code: string,
): Promise<{ success: boolean; gift: PublicGiftResponse }> {
  return apiFetch<{ success: boolean; gift: PublicGiftResponse }>(
    `/public/gifts/${publicId}/unlock`,
    { method: "POST", body: JSON.stringify({ code }) },
  );
}
