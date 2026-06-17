import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Gift,
  Heart,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CodeInput from "@/components/CodeInput";
import GradientButton from "@/components/GradientButton";
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift as GiftType, GiftStatus } from "@/types/gift";

const STATUS_META: Record<GiftStatus, { label: string; color: string; icon: React.FC<{ size: number; color: string }> }> = {
  draft: { label: "Rascunho", color: Colors.textMuted, icon: Clock },
  generating: { label: "Gerando clipe", color: Colors.gold, icon: Sparkles },
  scheduled: { label: "Agendado", color: Colors.plum, icon: Calendar },
  ready: { label: "Pronto", color: Colors.success, icon: CheckCircle2 },
  opened: { label: "Aberto", color: Colors.rose, icon: Eye },
  delivered: { label: "Entregue", color: Colors.coral, icon: CheckCircle2 },
};

function OpenedView({ gift }: { gift: GiftType }) {
  const openedAt = gift.openedAt
    ? new Date(gift.openedAt).toLocaleString("pt-BR")
    : "agora";

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.openedWrap}>
      <LinearGradient colors={Gradients.hero} style={styles.openedHero}>
        <Heart size={40} color={Colors.white} />
        <Text style={styles.openedHeroText}>Presente aberto!</Text>
        <Text style={styles.openedHeroSub}>
          {gift.recipientName} abriu seu presente em {openedAt}
        </Text>
      </LinearGradient>

      {gift.clipUri && (
        <View style={styles.playerCard}>
          <Video
            source={{ uri: gift.clipUri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            useNativeControls
            isLooping
          />
        </View>
      )}

      <GradientButton
        label="Criar outro presente"
        onPress={() => {}}
        variant="ghost"
        icon={<Gift size={16} color={Colors.textPrimary} />}
      />
    </Animated.View>
  );
}

export default function GiftDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useGiftStore();

  const gift = useMemo(() => (id ? getById(id) : undefined), [id, getById]);

  const meta = gift ? STATUS_META[gift.status] : undefined;
  const StatusIcon = meta?.icon;

  // Redirect to dedicated full-screen routes for generating / ready / scheduled.
  useFocusEffect(
    useCallback(() => {
      if (!gift || !id) return;
      if (gift.status === "generating") {
        router.replace(`/gift/${gift.id}/generating`);
      } else if (gift.status === "ready" || gift.status === "scheduled") {
        router.replace(`/gift/${gift.id}/ready`);
      }
    }, [gift, id, router]),
  );

  if (!gift) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.topBack}>
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.notFoundText}>Presente não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {gift.recipientName}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        {meta && StatusIcon && (
          <Animated.View entering={FadeInRight.springify()} style={[styles.statusBadge, { backgroundColor: `${meta.color}18` }]}>
            <StatusIcon size={14} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </Animated.View>
        )}

        {/* Recipient card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.infoCard}>
          <LinearGradient colors={Gradients.hero} style={styles.infoAvatar}>
            <Text style={styles.infoAvatarText}>
              {gift.recipientName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.infoBody}>
            <Text style={styles.infoName}>{gift.recipientName}</Text>
            <Text style={styles.infoOccasion}>{gift.occasion ?? "Presente Tibox"}</Text>
            {gift.scheduledFor && (
              <Text style={styles.infoDate}>
                <Calendar size={12} color={Colors.gold} />{" "}
                {new Date(gift.scheduledFor).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                })}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Message */}
        {gift.message ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.msgCard}>
            <MessageCircle size={14} color={Colors.plum} style={styles.msgIcon} />
            <Text style={styles.msgText}>{gift.message}</Text>
          </Animated.View>
        ) : null}

        {/* Status-specific views */}
        {gift.status === "opened" && <OpenedView gift={gift} />}
        {gift.status === "draft" && (
          <View style={styles.draftNotice}>
            <Gift size={24} color={Colors.textMuted} />
            <Text style={styles.draftNoticeText}>
              Este presente está em rascunho. Finalize a criação para gerar o clipe.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  topBack: {
    position: "absolute",
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: {
    backgroundColor: Colors.inkCard,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  /* Status badge */
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  /* Info card */
  infoCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.inkCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  infoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoAvatarText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  infoBody: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  infoName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  infoOccasion: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  infoDate: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },
  /* Message */
  msgCard: {
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    flexDirection: "row",
    gap: 10,
  },
  msgIcon: {
    marginTop: 3,
  },
  msgText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  /* Draft notice */
  draftNotice: {
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
    alignItems: "center",
    gap: 12,
  },
  draftNoticeText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  /* Opened */
  openedWrap: {
    gap: 16,
    paddingVertical: 8,
  },
  openedHero: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  openedHeroText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  openedHeroSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  playerCard: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.inkCard,
  },
});
