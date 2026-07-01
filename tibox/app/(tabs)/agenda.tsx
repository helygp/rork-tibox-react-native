import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Clock } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "@/components/Screen";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift } from "@/types/gift";

function EmptyAgenda() {
  const C = useColors();
  const G = useGradients();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        empty: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 28, gap: 14, marginTop: -40 },
        emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center" as const, justifyContent: "center" as const },
        emptyTitle: { color: C.textPrimary, fontSize: 20, fontWeight: "800" as const },
        emptySub: { color: C.textSecondary, fontSize: 15, textAlign: "center" as const, lineHeight: 22 },
      }),
    [C],
  );

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.empty}>
      <LinearGradient colors={G.gold as readonly [string, string]} style={styles.emptyIcon}>
        <Calendar size={32} color={C.ink} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Nenhum presente agendado</Text>
      <Text style={styles.emptySub}>Crie um presente e escolha a data{"\n"}perfeita para a entrega.</Text>
    </Animated.View>
  );
}

function AgendaGift({ gift, index }: { gift: Gift; index: number }) {
  const C = useColors();
  const date = gift.scheduledFor
    ? new Date(gift.scheduledFor).toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" })
    : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: "row" as const, gap: 14, backgroundColor: C.inkCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
        dateDot: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(244,199,123,0.15)", alignItems: "center" as const, justifyContent: "center" as const },
        rowBody: { flex: 1, gap: 3 },
        rowName: { color: C.textPrimary, fontSize: 16, fontWeight: "700" as const },
        rowOccasion: { color: C.textSecondary, fontSize: 13 },
        rowDate: { color: C.gold, fontSize: 13, fontWeight: "600" as const, marginTop: 4, textTransform: "capitalize" as const },
      }),
    [C],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.row}>
      <View style={styles.dateDot}><Clock size={16} color={C.gold} /></View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{gift.recipientName}</Text>
        <Text style={styles.rowOccasion}>{gift.occasion ?? "Sem ocasião definida"}</Text>
        {date && <Text style={styles.rowDate}>{date}</Text>}
      </View>
    </Animated.View>
  );
}

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { gifts } = useGiftStore();
  const scheduled = gifts.filter((g) => g.deliveryMode === "scheduled" || g.status === "scheduled");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, paddingHorizontal: 20 },
        title: { color: C.textPrimary, fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 4 },
        subtitle: { color: C.textSecondary, fontSize: 15, marginBottom: 24 },
        list: { paddingBottom: 100 },
        sep: { height: 10 },
      }),
    [C],
  );

  const renderItem = useCallback(({ item, index }: { item: Gift; index: number }) => <AgendaGift gift={item} index={index} />, []);
  const keyExtractor = useCallback((item: Gift) => item.id, []);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Presentes programados para o futuro</Text>
        {scheduled.length === 0 ? (
          <EmptyAgenda />
        ) : (
          <FlatList data={scheduled} renderItem={renderItem} keyExtractor={keyExtractor} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "ios" ? 100 : 80) }]} showsVerticalScrollIndicator={false} ItemSeparatorComponent={() => <View style={styles.sep} />} />
        )}
      </View>
    </Screen>
  );
}
