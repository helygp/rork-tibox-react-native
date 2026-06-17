import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, CheckCircle2, Clock, Gift as GiftIcon, Sparkles } from "lucide-react-native";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Colors, { Gradients } from "@/constants/colors";
import { Gift, GiftStatus } from "@/types/gift";

const STATUS_META: Record<GiftStatus, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: Colors.textMuted },
  generating: { label: "Gerando", color: Colors.gold },
  scheduled: { label: "Agendado", color: Colors.plum },
  ready: { label: "Pronto", color: Colors.success },
  opened: { label: "Aberto", color: Colors.rose },
  delivered: { label: "Entregue", color: Colors.coral },
};

function StatusIcon({ status, color }: { status: GiftStatus; color: string }) {
  if (status === "scheduled") return <Calendar size={13} color={color} />;
  if (status === "generating") return <Sparkles size={13} color={color} />;
  if (status === "opened" || status === "delivered") return <CheckCircle2 size={13} color={color} />;
  return <Clock size={13} color={color} />;
}

interface Props {
  gift: Gift;
  onPress: (gift: Gift) => void;
}

export default function GiftCard({ gift, onPress }: Props) {
  const meta = STATUS_META[gift.status];
  const cover = gift.media[0]?.uri;
  const handlePress = useCallback(() => onPress(gift), [gift, onPress]);

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={Gradients.brandDeep} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.thumbIcon}>
          <GiftIcon size={18} color={Colors.white} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {gift.recipientName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {gift.occasion ?? "Presente Tibox"}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${meta.color}22` }]}>
          <StatusIcon status={gift.status} color={meta.color} />
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.inkCard,
    borderRadius: 20,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 999,
    padding: 6,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
