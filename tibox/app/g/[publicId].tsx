import { Video, ResizeMode } from "expo-av";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Heart,
  Lock,
  MessageCircle,
  ShieldQuestion,
  Sparkles,
  Star,
  Unlock,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CodeInput from "@/components/CodeInput";
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift } from "@/types/gift";

/* ── Locked state ── */
function LockedView({
  gift,
  code,
  onChangeCode,
  error,
  onUnlock,
}: {
  gift: Gift;
  code: string;
  onChangeCode: (c: string) => void;
  error: boolean;
  onUnlock: () => void;
}) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [error, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.lockedWrap}>
      {/* Glow icon */}
      <View style={styles.lockedIconWrap}>
        <LinearGradient colors={Gradients.brand} style={styles.lockedIcon}>
          <Lock size={28} color={Colors.white} />
        </LinearGradient>
        <View style={styles.lockedRing} />
      </View>

      <Text style={styles.lockedTitle}>Você recebeu um Tibox!</Text>
      <Text style={styles.lockedSub}>
        {gift.recipientName}, insira a senha de 4 dígitos{"\n"}para abrir seu presente.
      </Text>

      {/* Code input */}
      <Animated.View style={[styles.codeWrap, shakeStyle]}>
        <CodeInput
          value={code}
          onChange={onChangeCode}
          length={4}
          autoFocus
        />
        {error && (
          <Text style={styles.errorText}>Senha incorreta. Tente novamente.</Text>
        )}
      </Animated.View>

      {/* Unlock button */}
      <Pressable
        onPress={onUnlock}
        disabled={code.length < 4}
        style={({ pressed }) => [
          styles.unlockBtn,
          code.length === 4 && styles.unlockBtnReady,
          pressed && styles.unlockBtnPressed,
        ]}
      >
        <LinearGradient
          colors={code.length === 4 ? Gradients.brand : ["#2A1E30", "#2A1E30"]}
          style={styles.unlockGradient}
        >
          <Unlock size={18} color={code.length === 4 ? Colors.white : Colors.textMuted} />
          <Text style={[styles.unlockText, code.length === 4 && styles.unlockTextReady]}>
            Abrir presente
          </Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.lockedHint}>
        Peça a senha para quem enviou o presente.
      </Text>
    </Animated.View>
  );
}

/* ── Unlocked state ── */
function UnlockedView({ gift }: { gift: Gift }) {
  const mediaUri = gift.media[0]?.uri;

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.unlockedWrap}>
      {/* Hero */}
      <LinearGradient colors={Gradients.hero} style={styles.unlockedHero}>
        <Sparkles size={24} color={Colors.gold} style={styles.unlockedSparkle} />
        <Text style={styles.unlockedHeroText}>Presente aberto!</Text>
        <Text style={styles.unlockedHeroSub}>
          Alguém especial preparou isso para você.
        </Text>
      </LinearGradient>

      {/* Media */}
      {mediaUri && (
        <View style={styles.unlockedMedia}>
          <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={20} style={styles.unlockedMediaOverlay}>
            <Heart size={24} color={Colors.rose} />
          </BlurView>
        </View>
      )}

      {/* Real video player */}
      {gift.clipUri ? (
        <View style={styles.clipCard}>
          <Video
            source={{ uri: gift.clipUri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            useNativeControls
            isLooping
          />
        </View>
      ) : (
        <View style={styles.clipPlaceholder}>
          <Sparkles size={40} color={Colors.gold} />
          <Text style={styles.clipPlaceholderText}>Miniclipe em produção</Text>
          <Text style={styles.clipPlaceholderSub}>
            O clipe emocional está sendo gerado.{"\n"}Volte em breve!
          </Text>
        </View>
      )}

      {/* Message */}
      {gift.message ? (
        <View style={styles.unlockedMsg}>
          <MessageCircle size={14} color={Colors.plum} style={styles.unlockedMsgIcon} />
          <Text style={styles.unlockedMsgText}>{gift.message}</Text>
        </View>
      ) : null}

      {/* Gratitude */}
      <LinearGradient colors={Gradients.gold} style={styles.gratitude}>
        <Star size={16} color={Colors.ink} />
        <Text style={styles.gratitudeText}>Obrigado por abrir seu Tibox!</Text>
      </LinearGradient>
    </Animated.View>
  );
}

/* ── Main screen ── */
export default function PublicGiftScreen() {
  const insets = useSafeAreaInsets();
  const { publicId } = useLocalSearchParams<{ publicId: string }>();
  const { getByPublicId, markOpened } = useGiftStore();

  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const gift = useMemo(() => (publicId ? getByPublicId(publicId) : undefined), [publicId, getByPublicId]);

  // Auto-unlock if gift is already opened
  useEffect(() => {
    if (gift && (gift.status === "opened" || gift.status === "delivered")) {
      setUnlocked(true);
    }
  }, [gift]);

  const handleUnlock = useCallback(() => {
    if (!gift) return;
    if (code === gift.unlockCode) {
      setError(false);
      setUnlocked(true);
      void markOpened(gift.publicId);
    } else {
      setError(true);
      setCode("");
    }
  }, [gift, code, markOpened]);

  if (!gift) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <LinearGradient colors={Gradients.brand} style={styles.notFoundIcon}>
          <ShieldQuestion size={32} color={Colors.white} />
        </LinearGradient>
        <Text style={styles.notFoundTitle}>Presente não encontrado</Text>
        <Text style={styles.notFoundSub}>
          Verifique se o link está correto ou{"\n"}entre em contato com quem enviou.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Brand header */}
      <View style={styles.brandHeader}>
        <LinearGradient colors={Gradients.brand} style={styles.brandBar}>
          <Text style={styles.brandText}>TIBOX</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient badge */}
        <Animated.View entering={FadeInRight.springify()} style={styles.toBadge}>
          <Text style={styles.toBadgeLabel}>Para</Text>
          <Text style={styles.toBadgeName}>{gift.recipientName}</Text>
        </Animated.View>

        {unlocked ? (
          <UnlockedView gift={gift} />
        ) : (
          <LockedView
            gift={gift}
            code={code}
            onChangeCode={(c) => {
              setCode(c);
              setError(false);
            }}
            error={error}
            onUnlock={handleUnlock}
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>
          Envie seu próprio Tibox — baixe o app
        </Text>
      </View>
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
    paddingHorizontal: 28,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  /* Not found */
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  notFoundTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  notFoundSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  /* Brand header */
  brandHeader: {
    alignItems: "center",
    paddingVertical: 12,
  },
  brandBar: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 12,
  },
  brandText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
  },
  /* To badge */
  toBadge: {
    alignItems: "center",
    marginVertical: 16,
    gap: 2,
  },
  toBadgeLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  toBadgeName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  /* Locked */
  lockedWrap: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
  },
  lockedIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  lockedIcon: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedRing: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(143,209,79,0.3)",
  },
  lockedTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  lockedSub: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
  },
  codeWrap: {
    marginTop: 8,
    gap: 10,
  },
  errorText: {
    color: Colors.rose,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  unlockBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },
  unlockBtnReady: {
    shadowColor: Colors.rose,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  unlockBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  unlockGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  unlockText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  unlockTextReady: {
    color: Colors.white,
  },
  lockedHint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  /* Unlocked */
  unlockedWrap: {
    gap: 14,
  },
  unlockedHero: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  unlockedSparkle: {
    marginBottom: 4,
  },
  unlockedHeroText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  unlockedHeroSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
  },
  unlockedMedia: {
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.inkCard,
  },
  unlockedMediaOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  lockedBtn: {
    marginTop: 8,
  },
  /* Clip */
  clipCard: {
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.inkCard,
  },
  clipPlaceholder: {
    backgroundColor: Colors.inkCard,
    borderRadius: 18,
    padding: 40,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clipPlaceholderText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  clipPlaceholderSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  /* Message */
  unlockedMsg: {
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    gap: 10,
  },
  unlockedMsgIcon: {
    marginTop: 3,
  },
  unlockedMsgText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  /* Gratitude */
  gratitude: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  gratitudeText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  /* Footer */
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
