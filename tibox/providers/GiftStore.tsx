import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createGift,
  deleteGift,
  getGenerationStatus,
  getPublicGift,
  listGifts,
  startGeneration,
  updateGift,
  uploadGiftMedia,
} from "@/lib/api";
import { useSession } from "@/providers/Session";
import { PHYSICAL_GIFT_TYPES } from "@/types/gift";
import type { DraftGift, Gift, GiftMedia } from "@/types/gift";

const STORAGE_CACHE_KEY = "tibox.gifts.v1.cache";

/* ── Helpers ── */

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makePublicId(): string {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6)
  );
}

function generateUnlockCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function loadCachedGifts(): Promise<Gift[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Gift[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persistCachedGifts(gifts: Gift[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(gifts));
  } catch {
    // Silently fail — cache is best-effort.
  }
}

/* ── Provider ── */

export const [GiftStoreProvider, useGiftStore] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, getToken } = useSession();
  const [draft, setDraft] = useState<DraftGift>({});
  const [localGifts, setLocalGifts] = useState<Gift[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Fetch gifts from API on mount / when user changes.
  const giftsQuery = useQuery({
    queryKey: ["gifts", user?.id],
    queryFn: async (): Promise<Gift[]> => {
      if (!user) return [];
      try {
        const apiGifts = await listGifts();
        setIsOffline(false);
        // Merge with local cache (keep local gifts that haven't been synced).
        await persistCachedGifts(apiGifts);
        return apiGifts;
      } catch (err) {
        console.log("[GiftStore] API fetch failed, falling back to cache.", err);
        setIsOffline(true);
        return loadCachedGifts();
      }
    },
    enabled: !!user,
    staleTime: 10_000,
  });

  // Hydrate local cache on first load.
  useEffect(() => {
    if (!user) {
      setLocalGifts([]);
      return;
    }
    loadCachedGifts().then((cached) => {
      if (cached.length > 0 && localGifts.length === 0) {
        setLocalGifts(cached);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const gifts: Gift[] = useMemo(() => {
    if (giftsQuery.data && giftsQuery.data.length > 0) return giftsQuery.data;
    if (isOffline) return localGifts;
    if (!giftsQuery.isFetched && localGifts.length > 0) return localGifts;
    return giftsQuery.data ?? localGifts;
  }, [giftsQuery.data, giftsQuery.isFetched, isOffline, localGifts]);

  /* ── Draft helpers ── */

  const updateDraft = useCallback((patch: DraftGift) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft({});
  }, []);

  /* ── Finalize: create gift via API ── */

  const finalizeGift = useCallback(async (): Promise<Gift | null> => {
    const now = new Date().toISOString();
    const media = draft.media ?? [];
    const unlockCode = draft.unlockCode ?? generateUnlockCode();

    const isPhysical = PHYSICAL_GIFT_TYPES.includes(draft.type ?? "digital");

    const giftPayload: Gift = {
      id: makeId(),
      publicId: makePublicId(),
      recipientName: draft.recipientName ?? "Alguém especial",
      recipientWhatsapp: draft.recipientWhatsapp,
      occasion: draft.occasion,
      message: draft.message ?? "",
      media,
      type: draft.type ?? "digital",
      style: draft.style ?? "romantico",
      song: draft.song,
      genre: draft.genre,
      city: isPhysical ? draft.city : undefined,
      deliveryMode: draft.deliveryMode ?? "now",
      scheduledFor: draft.scheduledFor,
      notifyWhatsapp: draft.notifyWhatsapp ?? false,
      unlockCode,
      status: "draft" as const,
      createdAt: now,
    };

    // Try API first.
    try {
      // 1. Create the gift first — the server expects an ID before any media.
      const created = await createGift({
        recipientName: giftPayload.recipientName,
        recipientWhatsapp: giftPayload.recipientWhatsapp,
        mood: giftPayload.style,
        genre: giftPayload.genre,
        message: giftPayload.message,
        notifyWhatsapp: giftPayload.notifyWhatsapp,
        deliveryMode: giftPayload.deliveryMode,
        scheduledFor: giftPayload.scheduledFor,
        unlockCode,
        city: giftPayload.city,
      });

      // 2. Upload each media file now that we have a gift ID.
      const uploadedMedia: GiftMedia[] = [];
      for (let i = 0; i < media.length; i++) {
        const m = media[i];
        try {
          const uploaded = await uploadGiftMedia(created.id, m.uri, m.kind, i);
          uploadedMedia.push(uploaded);
        } catch {
          // Keep the local URI if upload fails.
          uploadedMedia.push(m);
        }
      }

      // 3. Start generation.
      const gift: Gift = {
        ...giftPayload,
        id: created.id,
        publicId: created.publicId || giftPayload.publicId,
        status: "generating",
        media: uploadedMedia,
      };

      // Fire generation (don't block).
      void startGeneration(created.id).catch((err) =>
        console.log("[GiftStore] generate error", err),
      );

      // Invalidate and cache.
      setLocalGifts((prev) => {
        const next = [gift, ...prev];
        void persistCachedGifts(next);
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["gifts"] });
      return gift;
    } catch (err) {
      console.log("[GiftStore] API create failed, using local fallback.", err);
      // Fallback: local-only gift.
      const gift: Gift = {
        ...giftPayload,
        status: "ready", // Skip generation in offline mode.
      };
      setLocalGifts((prev) => {
        const next = [gift, ...prev];
        void persistCachedGifts(next);
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["gifts"] });
      return gift;
    }
  }, [draft, queryClient]);

  /* ── Poll generation status ── */

  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pollingIds.size === 0) return;
    const ids = [...pollingIds];
    const interval = setInterval(async () => {
      for (const id of ids) {
        try {
          const status = await getGenerationStatus(id);
          if (status.status === "ready" || status.status === "scheduled") {
            if (status.clipUri) {
              markReady(id, status.clipUri);
            }
          }
          if (status.status !== "generating" && status.status !== "draft") {
            setPollingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            queryClient.invalidateQueries({ queryKey: ["gifts"] });
            // Also refresh the specific gift status.
            queryClient.invalidateQueries({ queryKey: ["gift-status", id] });
          }
        } catch {
          // Silently ignore poll errors.
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingIds, queryClient]);

  const startPolling = useCallback((id: string) => {
    setPollingIds((prev) => new Set(prev).add(id));
  }, []);

  const markReady = useCallback(
    (id: string, clipUri: string) => {
      // Update via API.
      void updateGift(id, { status: "ready", clipUri }).catch(() =>
        console.log("[GiftStore] updateGift failed"),
      );
      // Update local cache immediately.
      const updateFn = (prev: Gift[] | undefined) =>
        (prev ?? []).map((g) =>
          g.id === id
            ? {
                ...g,
                status:
                  g.deliveryMode === "scheduled"
                    ? ("scheduled" as const)
                    : ("ready" as const),
                clipUri,
              }
            : g,
        );
      setLocalGifts((prev) => {
        const next = updateFn(prev);
        void persistCachedGifts(next);
        return next;
      });
      queryClient.setQueryData<Gift[]>(["gifts", user?.id], (prev: Gift[] | undefined) =>
        updateFn(prev),
      );
    },
    [queryClient, user?.id],
  );

  const markOpened = useCallback(
    (publicId: string) => {
      const updateFn = (prev: Gift[] | undefined) =>
        (prev ?? []).map((g) =>
          g.publicId === publicId
            ? { ...g, status: "opened" as const, openedAt: new Date().toISOString() }
            : g,
        );
      setLocalGifts((prev) => {
        const next = updateFn(prev);
        void persistCachedGifts(next);
        return next;
      });
      queryClient.setQueryData<Gift[]>(["gifts", user?.id], (prev: Gift[] | undefined) =>
        updateFn(prev),
      );
    },
    [queryClient, user?.id],
  );

  const getByPublicId = useCallback(
    (publicId: string): Gift | undefined => gifts.find((g) => g.publicId === publicId),
    [gifts],
  );

  const getById = useCallback(
    (id: string): Gift | undefined => gifts.find((g) => g.id === id),
    [gifts],
  );

  const removeGift = useCallback(
    async (id: string) => {
      void deleteGift(id).catch(() => {});
      const updateFn = (prev: Gift[] | undefined) => (prev ?? []).filter((g) => g.id !== id);
      setLocalGifts((prev) => {
        const next = updateFn(prev);
        void persistCachedGifts(next);
        return next;
      });
      queryClient.setQueryData<Gift[]>(["gifts", user?.id], (prev: Gift[] | undefined) =>
        updateFn(prev),
      );
    },
    [queryClient, user?.id],
  );

  return useMemo(
    () => ({
      gifts,
      isLoading: giftsQuery.isLoading && localGifts.length === 0,
      isOffline,
      draft,
      updateDraft,
      resetDraft,
      finalizeGift,
      markReady,
      markOpened,
      startPolling,
      getByPublicId,
      getById,
      removeGift,
    }),
    [
      gifts,
      giftsQuery.isLoading,
      isOffline,
      draft,
      updateDraft,
      resetDraft,
      finalizeGift,
      markReady,
      markOpened,
      startPolling,
      getByPublicId,
      getById,
      removeGift,
    ],
  );
});

/* ── Public gift (for the public page — no auth needed) ── */

export function usePublicGift(publicId: string | undefined) {
  return useQuery({
    queryKey: ["public-gift", publicId],
    queryFn: async () => {
      if (!publicId) return null;
      try {
        return await getPublicGift(publicId);
      } catch {
        // Fallback to local gift store.
        return null;
      }
    },
    enabled: !!publicId,
    staleTime: 30_000,
  });
}

/* ── Gift summary for home dashboard ── */

export function useGiftSummary() {
  const { gifts } = useGiftStore();
  return useMemo(() => {
    const sent = gifts.filter(
      (g) => g.status !== "draft",
    );
    const people = new Set(gifts.map((g) => g.recipientName)).size;
    return { total: sent.length, people };
  }, [gifts]);
}
