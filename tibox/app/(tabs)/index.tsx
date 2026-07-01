import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Gift, Sparkles, TrendingUp, Users } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GiftCard from "@/components/GiftCard";
import GradientButton from "@/components/GradientButton";
import Screen from "@/components/Screen";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore, useGiftSummary } from "@/providers/GiftStore";
import { useSession } from "@/providers/Session";
import type { Gift as GiftType } from "@/types/gift";

function StatPill({ icon, value, label, index }: { icon: React.ReactNode; value: string; label: string; index: number }) {
  const C = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: { flex: 1, backgroundColor: C.inkCard, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border, gap: 6 },
        pillIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(122,77,158,0.18)", alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 4 },
        pillValue: { color: C.textPrimary, fontSize: 24, fontWeight: "800" as const },
        pillLabel: { color: C.textMuted, fontSize: 13, fontWeight: "600" as const },
      }),
    [C],
  );
  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()} style={styles.pill}>
      <View style={styles.pillIcon}>{icon}</View>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </Animated.View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const C = useColors();
  const G = useGradients();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        empty: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 28, gap: 16 },
        emptyIconWrap: { width: 96, height: 96, borderRadius: 30, alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 4 },
        sparkle: { position: "absolute" as const, top: 16, right: 14 },
        emptyTitle: { color: C.textPrimary, fontSize: 22, fontWeight: "800" as const },
        emptySub: { color: C.textSecondary, fontSize: 15, textAlign: "center" as const, lineHeight: 22 },
      }),
    [C],
  );
  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.empty}>
      <LinearGradient colors={G.brandDeep as readonly [string, string]} style={styles.emptyIconWrap}>
        <Gift size={40} color={C.white} />
        <Sparkles size={18} color={C.gold} style={styles.sparkle} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Nenhum presente ainda</Text>
      <Text style={styles.emptySub}>Crie seu primeiro presente emocional e{"\n"}surpreenda alguém especial hoje.</Text>
      <GradientButton label="Criar presente" onPress={onCreate} icon={<Gift size={18} color={C.white} />} />
    </Animated.View>
  );
}

function HeroSummary() {
  const C = useColors();
  const { total, people } = useGiftSummary();
  const stats = useMemo(
    () => [
      { icon: <TrendingUp size={17} color={C.gold} />, value: String(total), label: "Enviados" },
      { icon: <Users size={17} color={C.rose} />, value: String(people), label: "Pessoas" },
    ],
    [total, people, C],
  );
  if (total === 0) return null;
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
      {stats.map((s, i) => <StatPill key={s.label} {...s} index={i} />)}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const G = useGradients();
  const { user } = useSession();
  const { gifts, isLoading } = useGiftStore();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, paddingHorizontal: 20 },
        header: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 20 },
        greeting: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5 },
        wave: { fontSize: 24 },
        subtitle: { color: C.textSecondary, fontSize: 15, marginTop: 4 },
        avatarBtn: { borderRadius: 999 },
        avatarPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
        avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center" as const, justifyContent: "center" as const },
        avatarText: { color: C.white, fontSize: 19, fontWeight: "800" as const },
        sectionHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 14 },
        sectionTitle: { color: C.textPrimary, fontSize: 19, fontWeight: "800" as const },
        sectionCount: { color: C.rose, fontSize: 14, fontWeight: "800" as const, backgroundColor: "rgba(143,209,79,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden" as const },
        list: { paddingBottom: 100 },
        giftRow: { marginBottom: 0 },
        separator: { height: 10 },
        loading: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const },
      }),
    [C],
  );

  const handleCreate = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/create");
  }, [router]);

  const handleGiftPress = useCallback((gift: GiftType) => { router.push(`/gift/${gift.id}`); }, [router]);

  const firstName = user?.name?.split(" ")[0] ?? "Você";

  const renderGift = useCallback(
    ({ item, index }: { item: GiftType; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.giftRow}>
        <GiftCard gift={item} onPress={handleGiftPress} />
      </Animated.View>
    ),
    [handleGiftPress, styles.giftRow],
  );

  const keyExtractor = useCallback((item: GiftType) => item.id, []);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {firstName} <Text style={styles.wave}>👋</Text></Text>
            <Text style={styles.subtitle}>Pronto para emocionar alguém hoje?</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarPressed]} onPress={() => router.push("/profile")}>
            <LinearGradient colors={G.brand as readonly [string, string]} style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <HeroSummary />

        {gifts.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus presentes</Text>
            <Text style={styles.sectionCount}>{gifts.length}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loading}><ActivityIndicator color={C.rose} size="large" /></View>
        ) : gifts.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <FlatList data={gifts} renderItem={renderGift} keyExtractor={keyExtractor} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "ios" ? 120 : 100) }]} showsVerticalScrollIndicator={false} ItemSeparatorComponent={() => <View style={styles.separator} />} />
        )}
      </View>
    </Screen>
  );
}
