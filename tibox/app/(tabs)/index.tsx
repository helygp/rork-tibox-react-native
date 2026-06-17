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
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore, useGiftSummary } from "@/providers/GiftStore";
import { useSession } from "@/providers/Session";
import type { Gift as GiftType } from "@/types/gift";

function StatPill({
  icon,
  value,
  label,
  index,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()} style={styles.pill}>
      <View style={styles.pillIcon}>{icon}</View>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </Animated.View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.empty}>
      <LinearGradient colors={Gradients.brandDeep} style={styles.emptyIconWrap}>
        <Gift size={40} color={Colors.white} />
        <Sparkles
          size={18}
          color={Colors.gold}
          style={styles.sparkle}
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Nenhum presente ainda</Text>
      <Text style={styles.emptySub}>
        Crie seu primeiro presente emocional e{"\n"}surpreenda alguém especial hoje.
      </Text>
      <GradientButton label="Criar presente" onPress={onCreate} icon={<Gift size={18} color={Colors.white} />} />
    </Animated.View>
  );
}

function HeroSummary() {
  const { total, people } = useGiftSummary();

  const stats = useMemo(
    () => [
      {
        icon: <TrendingUp size={17} color={Colors.gold} />,
        value: String(total),
        label: "Enviados",
      },
      {
        icon: <Users size={17} color={Colors.rose} />,
        value: String(people),
        label: "Pessoas",
      },
    ],
    [total, people],
  );

  if (total === 0) return null;

  return (
    <View style={styles.heroRow}>
      {stats.map((s, i) => (
        <StatPill key={s.label} {...s} index={i} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { gifts, isLoading } = useGiftStore();

  const handleCreate = useCallback(() => {
    router.push("/create");
  }, [router]);

  const handleGiftPress = useCallback(
    (gift: GiftType) => {
      router.push(`/gift/${gift.id}`);
    },
    [router],
  );

  const firstName = user?.name?.split(" ")[0] ?? "Você";

  const renderGift = useCallback(
    ({ item, index }: { item: GiftType; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={styles.giftRow}
      >
        <GiftCard gift={item} onPress={handleGiftPress} />
      </Animated.View>
    ),
    [handleGiftPress],
  );

  const keyExtractor = useCallback((item: GiftType) => item.id, []);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá, {firstName} <Text style={styles.wave}>👋</Text>
            </Text>
            <Text style={styles.subtitle}>Pronto para emocionar alguém hoje?</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarPressed]}
            onPress={() => router.push("/profile")}
          >
            <LinearGradient colors={Gradients.brand} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Summary pills */}
        <HeroSummary />

        {/* Section title */}
        {gifts.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus presentes</Text>
            <Text style={styles.sectionCount}>{gifts.length}</Text>
          </View>
        )}

        {/* List or empty state */}
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.rose} size="large" />
          </View>
        ) : gifts.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <FlatList
            data={gifts}
            renderItem={renderGift}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + Platform.OS === "ios" ? 100 : 80 },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  wave: {
    fontSize: 24,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  avatarBtn: {
    borderRadius: 999,
  },
  avatarPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: "800",
  },
  heroRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.inkCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  pillIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(122,77,158,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pillValue: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  pillLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: "800",
  },
  sectionCount: {
    color: Colors.rose,
    fontSize: 14,
    fontWeight: "800",
    backgroundColor: "rgba(143,209,79,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  list: {
    paddingBottom: 100,
  },
  giftRow: {
    marginBottom: 0,
  },
  separator: {
    height: 10,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  sparkle: {
    position: "absolute",
    top: 16,
    right: 14,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  emptySub: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
