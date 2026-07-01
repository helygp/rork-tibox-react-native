import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, CheckCircle2, Clock, Gift as GiftIcon, Sparkles } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors, useGradients } from "@/constants/colors";
import { Gift, GiftStatus } from "@/types/gift";

interface Props {
  gift: Gift;
  onPress: (gift: Gift) => void;
}

export default function GiftCard({ gift, onPress }: Props) {
  const C = useColors();
  const G = useGradients();
  const cover = gift.media[0]?.uri;
  const handlePress = useCallback(() => onPress(gift), [gift, onPress]);

  const meta = useMemo<Record<GiftStatus, { label: string; color: string }>>(
    () => ({
      draft: { label: "Rascunho", color: C.textMuted },
      generating: { label: "Gerando", color: C.gold },
      scheduled: { label: "Agendado", color: C.plum },
      ready: { label: "Pronto", color: C.success },
      opened: { label: "Aberto", color: C.rose },
      delivered: { label: "Entregue", color: C.coral },
    }),
    [C],
  );

  const statusMeta = meta[gift.status];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row" as const,
          backgroundColor: C.inkCard,
          borderRadius: 20,
          padding: 12,
          gap: 14,
          borderWidth: 1,
          borderColor: C.border,
          alignItems: "center" as const,
        },
        pressed: {
          opacity: 0.85,
          transform: [{ scale: 0.99 }],
        },
        thumb: {
          width: 60,
          height: 60,
          borderRadius: 16,
          overflow: "hidden" as const,
          alignItems: "center" as const,
          justifyContent: "center" as const,
        },
        thumbIcon: {
          position: "absolute" as const,
          backgroundColor: "rgba(0,0,0,0.25)",
          borderRadius: 999,
          padding: 6,
        },
        body: {
          flex: 1,
          gap: 4,
        },
        name: {
          color: C.textPrimary,
          fontSize: 16,
          fontWeight: "700" as const,
        },
        sub: {
          color: C.textSecondary,
          fontSize: 13,
        },
        badge: {
          flexDirection: "row" as const,
          alignItems: "center" as const,
          gap: 5,
          alignSelf: "flex-start" as const,
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: 999,
          marginTop: 2,
        },
        badgeText: {
          fontSize: 12,
          fontWeight: "700" as const,
        },
      }),
    [C],
  );

  const StatusIcon = useMemo(() => {
    function Icon({ status, color }: { status: GiftStatus; color: string }) {
      if (status === "scheduled") return <Calendar size={13} color={color} />;
      if (status === "generating") return <Sparkles size={13} color={color} />;
      if (status === "opened" || status === "delivered") return <CheckCircle2 size={13} color={color} />;
      return <Clock size={13} color={color} />;
    }
    return Icon;
  }, []);

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={G.brandDeep as readonly [string, string]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.thumbIcon}>
          <GiftIcon size={18} color={C.white} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {gift.recipientName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {gift.occasion ?? "Presente Tibox"}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${statusMeta.color}22` }]}>
          <StatusIcon status={gift.status} color={statusMeta.color} />
          <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}
