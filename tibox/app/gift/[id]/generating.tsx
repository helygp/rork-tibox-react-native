import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, Heart, Sparkles } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift as GiftType } from "@/types/gift";

function PulseRing({ delayMs }: { delayMs: number }) {
  const C = useColors();
  const anim = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(delayMs),
      Animated.loop(
        Animated.parallel([
          Animated.sequence([Animated.timing(anim, { toValue: 2.2, duration: 1800, useNativeDriver: true }), Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true })]),
          Animated.sequence([Animated.timing(opacity, { toValue: 0, duration: 1800, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true })]),
        ]),
      ),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [anim, opacity, delayMs]);

  return <Animated.View style={[{ position: "absolute" as const, width: 88, height: 88, borderRadius: 32, backgroundColor: C.roseSoft, transform: [{ scale: anim }], opacity }]} />;
}

function ProcessingMessages() {
  const C = useColors();
  const messages = ["Selecionando os melhores momentos...", "Criando transições suaves...", "Ajustando o ritmo da música...", "Adicionando toques de emoção...", "Quase pronto — montando o clipe final..."];
  const [idx, setIdx] = useState(0);

  useEffect(() => { const interval = setInterval(() => { setIdx((prev) => (prev + 1) % messages.length); }, 4000); return () => clearInterval(interval); }, []);

  return <Animated.Text key={idx} style={{ color: C.gold, fontSize: 13, fontWeight: "600", textAlign: "center" }}>{messages[idx]}</Animated.Text>;
}

export default function GeneratingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const G = useGradients();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useGiftStore();

  const gift = useMemo(() => (id ? getById(id) : undefined), [id, getById]);
  const recipientName = gift?.recipientName ?? "alguém especial";
  const firstName = recipientName.split(" ")[0];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: C.ink },
        header: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 16, height: 52 },
        backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
        backBtnPressed: { backgroundColor: C.inkCard },
        headerTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "700" as const },
        content: { flexGrow: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 32, gap: 16, paddingTop: 20 },
        iconArea: { alignItems: "center" as const, justifyContent: "center" as const, width: 160, height: 160, marginBottom: 8 },
        iconCore: { width: 88, height: 88, borderRadius: 32, alignItems: "center" as const, justifyContent: "center" as const },
        title: { color: C.textPrimary, fontSize: 24, fontWeight: "800" as const, textAlign: "center" as const, letterSpacing: -0.5 },
        subtitle: { color: C.textSecondary, fontSize: 15, textAlign: "center" as const, lineHeight: 22 },
        progressTrack: { width: "100%" as const, height: 6, borderRadius: 3, backgroundColor: C.border, overflow: "hidden" as const, marginTop: 12 },
        progressFill: { height: "100%" as const, width: "65%" as const, borderRadius: 3 },
        messageBox: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingHorizontal: 4 },
        tipCard: { flexDirection: "row" as const, gap: 12, backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginTop: 16, alignItems: "flex-start" as const },
        tipText: { color: C.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
        bottom: { paddingHorizontal: 24, gap: 12, marginTop: 24, width: "100%" as const },
      }),
    [C],
  );

  const handleBack = useCallback(() => { router.replace("/(tabs)"); }, [router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft size={22} color={C.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Gerando clipe</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconArea}>
          <PulseRing delayMs={0} />
          <PulseRing delayMs={600} />
          <PulseRing delayMs={1200} />
          <LinearGradient colors={G.brand as readonly [string, string]} style={styles.iconCore}>
            <Sparkles size={40} color={C.white} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Criando para {firstName}</Text>
        <Text style={styles.subtitle}>Estamos montando uma experiência emocional{"\n"}única com as mídias que você enviou.</Text>

        <View style={styles.progressTrack}>
          <LinearGradient colors={G.brand as readonly [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFill} />
        </View>

        <View style={styles.messageBox}>
          <Clock size={14} color={C.gold} />
          <ProcessingMessages />
        </View>

        <View style={styles.tipCard}>
          <Heart size={16} color={C.rose} />
          <Text style={styles.tipText}>Enquanto isso, que tal enviar uma mensagem no WhatsApp avisando que um presente especial está chegando?</Text>
        </View>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
          <GradientButton label="Voltar para o início" onPress={handleBack} variant="ghost" icon={<ArrowLeft size={18} color={C.textPrimary} />} />
        </View>
      </ScrollView>
    </View>
  );
}
