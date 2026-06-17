import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift as GiftType } from "@/types/gift";

function PulseRing({ delayMs }: { delayMs: number }) {
  const anim = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(delayMs),
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 2.2,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [anim, opacity, delayMs]);

  return (
    <Animated.View
      style={[
        styles.pulse,
        { transform: [{ scale: anim }], opacity },
      ]}
    />
  );
}

function ProcessingMessages() {
  const messages = [
    "Selecionando os melhores momentos...",
    "Criando transições suaves...",
    "Ajustando o ritmo da música...",
    "Adicionando toques de emoção...",
    "Quase pronto — montando o clipe final...",
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.Text
      key={idx}
      style={styles.progressText}
    >
      {messages[idx]}
    </Animated.Text>
  );
}

export default function GeneratingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useGiftStore();

  const gift: GiftType | undefined = useMemo(
    () => (id ? getById(id) : undefined),
    [id, getById],
  );
  const recipientName = gift?.recipientName ?? "alguém especial";
  const firstName = recipientName.split(" ")[0];

  const handleBack = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Gerando clipe</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Animated icon */}
        <View style={styles.iconArea}>
          <PulseRing delayMs={0} />
          <PulseRing delayMs={600} />
          <PulseRing delayMs={1200} />
          <LinearGradient colors={Gradients.brand} style={styles.iconCore}>
            <Sparkles size={40} color={Colors.white} />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Criando para {firstName}</Text>
        <Text style={styles.subtitle}>
          Estamos montando uma experiência emocional{'\n'}única com as mídias que você enviou.
        </Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </View>

        {/* Processing messages */}
        <View style={styles.messageBox}>
          <Clock size={14} color={Colors.gold} />
          <ProcessingMessages />
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Heart size={16} color={Colors.rose} />
          <Text style={styles.tipText}>
            Enquanto isso, que tal enviar uma mensagem no WhatsApp avisando que um presente especial está chegando?
          </Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <GradientButton
          label="Voltar para o início"
          onPress={handleBack}
          variant="ghost"
          icon={<ArrowLeft size={18} color={Colors.textPrimary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
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
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconArea: {
    alignItems: "center",
    justifyContent: "center",
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  iconCore: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: Colors.roseSoft,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    width: "65%",
    borderRadius: 3,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  progressText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  tipCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
    alignItems: "flex-start",
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 12,
  },
});
