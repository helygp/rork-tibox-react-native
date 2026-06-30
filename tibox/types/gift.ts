export type GiftStatus = "draft" | "generating" | "scheduled" | "ready" | "opened" | "delivered";

export type GiftType = "digital" | "flowers" | "cake" | "item" | "experience";

export type GiftStyle = "romantico" | "alegre" | "nostalgico" | "epico" | "fofo";

/** Music genre for the clip's soundtrack — maps to the backend's `genre` field. */
export type MusicGenre = "romantica" | "animada" | "acustica" | "eletronica" | "instrumental";

export type DeliveryMode = "now" | "scheduled";

/** Physical gift types that require a delivery city. */
export const PHYSICAL_GIFT_TYPES: readonly GiftType[] = ["flowers", "cake", "item"];

export interface GiftMedia {
  id: string;
  uri: string;
  kind: "image" | "video";
}

export interface Gift {
  id: string;
  recipientName: string;
  recipientWhatsapp?: string;
  occasion?: string;
  message: string;
  media: GiftMedia[];
  type: GiftType;
  style: GiftStyle;
  song?: string;
  /** Music genre for the clip's soundtrack (backend field: `genre`). */
  genre?: MusicGenre;
  /** Delivery city, required for physical gifts (backend field: `city`). */
  city?: string;
  deliveryMode: DeliveryMode;
  scheduledFor?: string;
  notifyWhatsapp: boolean;
  unlockCode: string;
  status: GiftStatus;
  clipUri?: string;
  publicId: string;
  createdAt: string;
  openedAt?: string;
}

export type DraftGift = Partial<Gift>;
