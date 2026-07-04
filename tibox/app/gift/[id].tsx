import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, Eye, Gift, Heart,
  MessageCircle, Sparkles,
} from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift as GiftType, GiftStatus } from "@/types/gift";

function OpenedView({ gift }: { gift: GiftType }) {
  const C = useColors();
  const G = useGradients();
  const openedAt = gift.openedAt ? new Date(gift.openedAt).toLocaleString("pt-BR") : "agora";
  const styles = useMemo(() => StyleSheet.create({
    openedWrap: { gap: 16, paddingVertical: 8 },
    openedHero: { borderRadius: 20, padding: 32, alignItems: "center" as const, gap: 10 },
    openedHeroText: { color: C.white, fontSize: 20, fontWeight: "800" as const },
    openedHeroSub: { color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center" as const, lineHeight: 20 },
    playerCard: { height: 200, borderRadius: 20, overflow: "hidden" as const, backgroundColor: C.inkCard },
  }), [C]);

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.openedWrap}>
      <LinearGradient colors={G.hero as readonly [string, string, string]} style={styles.openedHero}>
        <Heart size={40} color={C.white} />
        <Text style={styles.openedHeroText}>Presente aberto!</Text>
        <Text style={styles.openedHeroSub}>{gift.recipientName} abriu seu presente em {openedAt}</Text>
      </LinearGradient>
      {gift.clipUri && (
        <View style={styles.playerCard}>
          <Video source={{ uri: gift.clipUri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay={false} useNativeControls isLooping />
        </View>
      )}
      <GradientButton label="Criar outro presente" onPress={() => {}} variant="ghost" icon={<Gift size={16} color={C.textPrimary} />} />
    </Animated.View>
  );
}

function StatusBadge({ meta }: { meta: { label: string; color: string; icon: React.FC<{ size: number; color: string }> } }) {
  const StatusIcon = meta.icon;
  return (
    <Animated.View entering={FadeInRight.springify()} style={[{ flexDirection: "row" as const, alignItems: "center" as const, gap: 6, alignSelf: "flex-start" as const, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16, backgroundColor: `${meta.color}18` }]}>
      <StatusIcon size={14} color={meta.color} />
      <Text style={[{ fontSize: 12, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, color: meta.color }]}>{meta.label}</Text>
    </Animated.View>
  );
}

export default function GiftDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const G = useGradients();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useGiftStore();
  const gift = useMemo(() => (id ? getById(id) : undefined), [id, getById]);

  const STATUS_META = useMemo<Record<GiftStatus, { label: string; color: string; icon: React.FC<{ size: number; color: string }> }>>(() => ({
    draft: { label: "Rascunho", color: C.textMuted, icon: Clock },
    generating: { label: "Gerando clipe", color: C.gold, icon: Sparkles },
    scheduled: { label: "Agendado", color: C.plum, icon: Calendar },
    ready: { label: "Pronto", color: C.success, icon: CheckCircle2 },
    opened: { label: "Aberto", color: C.rose, icon: Eye },
    delivered: { label: "Entregue", color: C.coral, icon: CheckCircle2 },
  }), [C]);

  const meta = gift ? STATUS_META[gift.status] : undefined;

  useFocusEffect(useCallback(() => {
    if (!gift || !id) return;
    if (gift.status === "generating") { router.replace(`/gift/${gift.id}/generating`); }
    else if (gift.status === "ready" || gift.status === "scheduled") { router.replace(`/gift/${gift.id}/ready`); }
  }, [gift, id, router]));

  const styles = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.ink },
    center: { alignItems: "center" as const, justifyContent: "center" as const },
    topBack: { position: "absolute" as const, top: 60, left: 16, width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const, zIndex: 10 },
    notFoundText: { color: C.textSecondary, fontSize: 16 },
    header: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 16, height: 52 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
    backBtnPressed: { backgroundColor: C.inkCard },
    headerTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "700" as const, flex: 1, textAlign: "center" as const },
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 20, paddingBottom: 40 },
    infoCard: { flexDirection: "row" as const, gap: 14, backgroundColor: C.inkCard, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    infoAvatar: { width: 56, height: 56, borderRadius: 20, alignItems: "center" as const, justifyContent: "center" as const },
    infoAvatarText: { color: C.white, fontSize: 24, fontWeight: "800" as const },
    infoBody: { flex: 1, justifyContent: "center" as const, gap: 2 },
    infoName: { color: C.textPrimary, fontSize: 18, fontWeight: "800" as const },
    infoOccasion: { color: C.textSecondary, fontSize: 14 },
    infoDate: { color: C.gold, fontSize: 13, fontWeight: "600" as const, marginTop: 2, textTransform: "capitalize" as const },
    msgCard: { backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20, flexDirection: "row" as const, gap: 10 },
    msgIcon: { marginTop: 3 },
    msgText: { color: C.textSecondary, fontSize: 15, lineHeight: 22, flex: 1 },
    draftNotice: { backgroundColor: C.inkCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border, marginTop: 16, alignItems: "center" as const, gap: 12 },
    draftNoticeText: { color: C.textMuted, fontSize: 14, textAlign: "center" as const, lineHeight: 21 },
  }), [C]);

  if (!gift) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.topBack}><ArrowLeft size={22} color={C.textSecondary} /></Pressable>
        <Text style={styles.notFoundText}>Presente não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft size={22} color={C.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{gift.recipientName}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {meta && <StatusBadge meta={meta} />}

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.infoCard}>
          <LinearGradient colors={G.hero as readonly [string, string, string]} style={styles.infoAvatar}>
            <Text style={styles.infoAvatarText}>{gift.recipientName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.infoBody}>
            <Text style={styles.infoName}>{gift.recipientName}</Text>
            <Text style={styles.infoOccasion}>{gift.occasion ?? "Presente Tibox"}</Text>
            {gift.scheduledFor && (
              <Text style={styles.infoDate}><Calendar size={12} color={C.gold} /> {new Date(gift.scheduledFor).toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" })}</Text>
            )}
          </View>
        </Animated.View>

        {gift.message ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.msgCard}>
            <MessageCircle size={14} color={C.plum} style={styles.msgIcon} />
            <Text style={styles.msgText}>{gift.message}</Text>
          </Animated.View>
        ) : null}

        {gift.status === "opened" && <OpenedView gift={gift} />}
        {gift.status === "draft" && (
          <View style={styles.draftNotice}>
            <Gift size={24} color={C.textMuted} />
            <Text style={styles.draftNoticeText}>Este presente está em rascunho. Finalize a criação para gerar o clipe.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
