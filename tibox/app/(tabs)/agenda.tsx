import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Clock } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "@/components/Screen";
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift } from "@/types/gift";

function EmptyAgenda() {
  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.empty}>
      <LinearGradient colors={Gradients.gold} style={styles.emptyIcon}>
        <Calendar size={32} color={Colors.ink} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Nenhum presente agendado</Text>
      <Text style={styles.emptySub}>
        Crie um presente e escolha a data{"\n"}perfeita para a entrega.
      </Text>
    </Animated.View>
  );
}

function AgendaGift({ gift, index }: { gift: Gift; index: number }) {
  const date = gift.scheduledFor
    ? new Date(gift.scheduledFor).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        weekday: "long",
      })
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.row}>
      <View style={styles.dateDot}>
        <Clock size={16} color={Colors.gold} />
      </View>
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
  const { gifts } = useGiftStore();

  const scheduled = gifts.filter((g) => g.deliveryMode === "scheduled" || g.status === "scheduled");

  const renderItem = useCallback(
    ({ item, index }: { item: Gift; index: number }) => <AgendaGift gift={item} index={index} />,
    [],
  );

  const keyExtractor = useCallback((item: Gift) => item.id, []);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Presentes programados para o futuro</Text>

        {scheduled.length === 0 ? (
          <EmptyAgenda />
        ) : (
          <FlatList
            data={scheduled}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + Platform.OS === "ios" ? 100 : 80 },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
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
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginBottom: 24,
  },
  list: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.inkCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateDot: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(244,199,123,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  rowOccasion: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  rowDate: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "capitalize",
  },
  sep: {
    height: 10,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 14,
    marginTop: -40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  emptySub: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
