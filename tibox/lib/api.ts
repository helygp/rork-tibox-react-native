import { getAccessToken } from "./supabase";
import type {
  DeliveryMode,
  Gift,
  GiftStatus,
  GiftStyle,
  GiftType,
  MusicGenre,
} from "@/types/gift";

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
  "https://api.tibox.aurabr.app";

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

/* ── Gift DTOs ──
 * The backend accepts camelCase field names below (it also tolerates
 * snake_case aliases, but we always send the camelCase form).
 */

export interface CreateGiftPayload {
  recipientName: string;
  recipientWhatsapp?: string;
  /** Emotional vibe of the clip — backend field name is `mood`. */
  mood: GiftStyle;
  /** Music genre for the soundtrack — backend field name is `genre`. */
  genre?: MusicGenre;
  message: string;
  notifyWhatsapp: boolean;
  deliveryMode: DeliveryMode;
  scheduledFor?: string;
  unlockCode: string;
  /** Delivery city, required for physical gifts. */
  city?: string;
}

export interface UploadRequestResponse {
  uploadUrl: string;
  token?: string;
  storagePath: string;
}

export interface GenerationStartResponse {
  status: GiftStatus;
  taskId?: string;
  engine?: string;
}

export interface GiftStatusResponse {
  status: GiftStatus;
  clipUri?: string;
  publicId?: string;
}

/* ── Response normalization ──
 * The backend's exact response shape isn't fully documented (it tolerates
 * both camelCase and snake_case, and uses some different field names like
 * `clipUrl`/`mood`/`slug`). This reads every known alias so the rest of the
 * app keeps using the stable internal `Gift` shape.
 */

function pick<T = unknown>(raw: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key] as T;
  }
  return undefined;
}

function normalizeDeliveryMode(raw: Record<string, unknown>): DeliveryMode {
  const value = pick<string>(raw, "deliveryMode", "delivery_mode");
  if (value === "scheduled" || value === "schedule") return "scheduled";
  return "now";
}

function normalizeGift(raw: Record<string, unknown>, fallback?: Partial<Gift>): Gift {
  const mediaRaw = pick<Array<Record<string, unknown>>>(raw, "media") ?? [];
  return {
    id: pick<string>(raw, "id") ?? fallback?.id ?? "",
    recipientName:
      pick<string>(raw, "recipientName", "recipient_name") ?? fallback?.recipientName ?? "",
    recipientWhatsapp: pick<string>(
      raw,
      "recipientWhatsapp",
      "recipientPhone",
      "recipient_phone",
    ) ?? fallback?.recipientWhatsapp,
    occasion: pick<string>(raw, "occasion") ?? fallback?.occasion,
    message: pick<string>(raw, "message") ?? fallback?.message ?? "",
    media: mediaRaw.length
      ? mediaRaw.map((m) => ({
          id: pick<string>(m, "id", "storagePath", "storage_path") ?? "",
          uri: pick<string>(m, "uri", "url") ?? "",
          kind: (pick<string>(m, "kind", "type") === "video" ? "video" : "image") as
            | "image"
            | "video",
        }))
      : fallback?.media ?? [],
    type: (fallback?.type as GiftType) ?? "digital",
    style: (pick<string>(raw, "mood", "style") as GiftStyle) ?? fallback?.style ?? "romantico",
    genre: (pick<string>(raw, "genre") as MusicGenre | undefined) ?? fallback?.genre,
    city: pick<string>(raw, "city") ?? fallback?.city,
    deliveryMode: normalizeDeliveryMode(raw),
    scheduledFor: pick<string>(raw, "scheduledFor", "deliveryDate", "delivery_date") ?? fallback?.scheduledFor,
    notifyWhatsapp:
      pick<boolean>(raw, "notifyWhatsapp", "notifyWhats", "notify_whats") ?? fallback?.notifyWhatsapp ?? false,
    unlockCode: pick<string>(raw, "unlockCode", "passcode") ?? fallback?.unlockCode ?? "",
    status: (pick<string>(raw, "status") as GiftStatus) ?? fallback?.status ?? "draft",
    clipUri: pick<string>(raw, "clipUrl", "clip_url", "clipUri") ?? fallback?.clipUri,
    publicId: pick<string>(raw, "publicId", "public_id", "slug") ?? fallback?.publicId ?? "",
    createdAt: pick<string>(raw, "createdAt", "created_at") ?? fallback?.createdAt ?? new Date().toISOString(),
    openedAt: pick<string>(raw, "openedAt", "opened_at") ?? fallback?.openedAt,
  };
}

/* ── Gifts CRUD ── */

/** List gifts for the current user. Falls back gracefully if endpoint not yet available. */
export async function listGifts(): Promise<Gift[]> {
  try {
    const data = await apiFetch<Array<Record<string, unknown>>>("/gifts");
    return data.map((g) => normalizeGift(g));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      console.log("[API] GET /gifts not yet available on backend.");
      return [];
    }
    throw err;
  }
}

/** Create a gift (without media — media is uploaded afterwards via uploadMedia). */
export async function createGift(payload: CreateGiftPayload): Promise<Gift> {
  const data = await apiFetch<Record<string, unknown>>("/gifts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeGift(data, { style: payload.mood, genre: payload.genre, city: payload.city });
}

/** Get single gift by ID. */
export async function getGift(id: string): Promise<Gift> {
  const data = await apiFetch<Record<string, unknown>>(`/gifts/${id}`);
  return normalizeGift(data);
}

/** Update gift status / fields. */
export async function updateGift(
  id: string,
  patch: Partial<Pick<Gift, "status" | "clipUri" | "openedAt">>,
): Promise<Gift> {
  const body: Record<string, unknown> = {};
  if (patch.status) body.status = patch.status;
  if (patch.clipUri) body.clipUrl = patch.clipUri;
  if (patch.openedAt) body.openedAt = patch.openedAt;
  const data = await apiFetch<Record<string, unknown>>(`/gifts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeGift(data);
}

/** Delete a gift. */
export async function deleteGift(id: string): Promise<void> {
  await apiFetch(`/gifts/${id}`, { method: "DELETE" });
}

/* ── Media Upload ──
 * Flow: 1) request a signed upload slot for the gift, 2) PUT the binary
 * straight to the returned URL (Supabase Storage), 3) keep the storage path
 * as the media reference.
 */

/** Step 1: ask the backend for a signed upload URL for one file. */
export async function requestMediaUpload(
  giftId: string,
  fileName: string,
  mimeType: string,
  orderIndex: number,
): Promise<UploadRequestResponse> {
  return apiFetch<UploadRequestResponse>("/gifts/upload", {
    method: "POST",
    body: JSON.stringify({ giftId, fileName, mimeType, orderIndex }),
  });
}

/** Step 2: PUT the local file binary straight to the signed URL. */
export async function putMediaFile(
  uploadUrl: string,
  localUri: string,
  mimeType: string,
  token?: string,
): Promise<void> {
  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(uploadUrl, { method: "PUT", headers, body: blob });
  if (!res.ok) throw new ApiError(`Upload failed: ${res.status}`, res.status);
}

/** Convenience: upload one local media file for a gift that already exists. */
export async function uploadGiftMedia(
  giftId: string,
  localUri: string,
  kind: "image" | "video",
  orderIndex: number,
): Promise<{ id: string; uri: string; kind: "image" | "video" }> {
  const fileName = localUri.split("/").pop() ?? `media-${orderIndex}`;
  const mimeType = kind === "image" ? "image/jpeg" : "video/mp4";
  const { uploadUrl, token, storagePath } = await requestMediaUpload(
    giftId,
    fileName,
    mimeType,
    orderIndex,
  );
  await putMediaFile(uploadUrl, localUri, mimeType, token);
  return { id: storagePath, uri: storagePath, kind };
}

/* ── Generation ── */

/** Trigger video generation for a gift. */
export async function startGeneration(giftId: string): Promise<GenerationStartResponse> {
  return apiFetch<GenerationStartResponse>(`/gifts/${giftId}/generate`, {
    method: "POST",
  });
}

/** Poll the generation status for a gift. */
export async function getGenerationStatus(giftId: string): Promise<GiftStatusResponse> {
  const data = await apiFetch<Record<string, unknown>>(`/gifts/${giftId}/status`);
  return {
    status: (pick<string>(data, "status") as GiftStatus) ?? "generating",
    clipUri: pick<string>(data, "clipUrl", "clip_url"),
    publicId: pick<string>(data, "slug", "publicId"),
  };
}

/* ── Public ── */

/** Fetch a public gift by its publicId (no auth needed). */
export async function getPublicGift(publicId: string): Promise<Gift> {
  const res = await fetch(`${BASE_URL}/public/gifts/${publicId}`);
  if (!res.ok) throw new ApiError(`Public gift not found: ${res.status}`, res.status);
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeGift(data, { publicId });
}

/** Unlock a public gift by validating its 4-digit passcode. */
export async function unlockPublicGift(
  publicId: string,
  code: string,
): Promise<{ unlocked: boolean; gift: Gift }> {
  const res = await fetch(`${BASE_URL}/public/gifts/${publicId}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode: code, unlockCode: code }),
  });
  if (!res.ok) throw new ApiError(`Unlock failed: ${res.status}`, res.status);
  const data = (await res.json()) as Record<string, unknown>;
  return {
    unlocked: pick<boolean>(data, "unlocked") ?? false,
    gift: normalizeGift(data, { publicId }),
  };
}
