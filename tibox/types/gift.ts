export type GiftStatus = "draft" | "generating" | "scheduled" | "ready" | "opened" | "delivered";

export type GiftType = "digital" | "flowers" | "cake" | "item" | "experience";

export type GiftStyle = "romantico" | "alegre" | "nostalgico" | "epico" | "fofo";

export type DeliveryMode = "now" | "scheduled";

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
