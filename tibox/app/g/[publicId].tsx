import { Video, ResizeMode } from "expo-av";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { Heart, Lock, MessageCircle, ShieldQuestion, Sparkles, Star, Unlock, Calendar, Clock } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CodeInput from "@/components/CodeInput";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift } from "@/types/gift";

function LockedView({ gift, code, onChangeCode, error, onUnlock }: { gift: Gift; code: string; onChangeCode: (c: string) => void; error: boolean; onUnlock: () => void }) {
  const C = useColors();
  const G = useGradients();
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shakeX.value = withSequence(withTiming(-12, { duration: 60 }), withTiming(12, { duration: 60 }), withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(0, { duration: 40 }));
    }
  }, [error, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const styles = useMemo(() => StyleSheet.create({
    lockedWrap: { alignItems: "center" as const, gap: 16, paddingVertical: 20 },
    lockedIconWrap: { alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 8 },
    lockedIcon: { width: 88, height: 88, borderRadius: 32, alignItems: "center" as const, justifyContent: "center" as const },
    lockedRing: { position: "absolute" as const, width: 104, height: 104, borderRadius: 38, borderWidth: 2, borderColor: "rgba(143,209,79,0.3)" },
    lockedTitle: { color: C.textPrimary, fontSize: 24, fontWeight: "800" as const, textAlign: "center" as const, letterSpacing: -0.5 },
    lockedSub: { color: C.textSecondary, fontSize: 15, textAlign: "center" as const, lineHeight: 21 },
    codeWrap: { marginTop: 8, gap: 10 },
    errorText: { color: C.rose, fontSize: 13, fontWeight: "600" as const, textAlign: "center" as const },
    unlockBtn: { width: "100%" as const, borderRadius: 18, overflow: "hidden" as const },
    unlockBtnReady: { shadowColor: C.rose, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    unlockBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    unlockGradient: { height: 56, alignItems: "center" as const, justifyContent: "center" as const, flexDirection: "row" as const, gap: 10 },
    unlockText: { color: C.textMuted, fontSize: 16, fontWeight: "700" as const },
    unlockTextReady: { color: C.white },
    lockedHint: { color: C.textMuted, fontSize: 12, textAlign: "center" as const },
  }), [C]);

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.lockedWrap}>
      <View style={styles.lockedIconWrap}>
        <LinearGradient colors={G.brand as readonly [string, string]} style={styles.lockedIcon}><Lock size={28} color={C.white} /></LinearGradient>
        <View style={styles.lockedRing} />
      </View>
      <Text style={styles.lockedTitle}>Você recebeu um Tibox!</Text>
      <Text style={styles.lockedSub}>{gift.recipientName}, insira a senha de 4 dígitos{"\n"}para abrir seu presente.</Text>
      <Animated.View style={[styles.codeWrap, shakeStyle]}>
        <CodeInput value={code} onChange={onChangeCode} length={4} autoFocus />
        {error && <Text style={styles.errorText}>Senha incorreta. Tente novamente.</Text>}
      </Animated.View>
      <Pressable onPress={onUnlock} disabled={code.length < 4} style={({ pressed }) => [styles.unlockBtn, code.length === 4 && styles.unlockBtnReady, pressed && styles.unlockBtnPressed]}>
        <LinearGradient colors={(code.length === 4 ? G.brand : ["#2A1E30", "#2A1E30"]) as readonly [string, string]} style={styles.unlockGradient}>
          <Unlock size={18} color={code.length === 4 ? C.white : C.textMuted} />
          <Text style={[styles.unlockText, code.length === 4 && styles.unlockTextReady]}>Abrir presente</Text>
        </LinearGradient>
      </Pressable>
      <Text style={styles.lockedHint}>Peça a senha para quem enviou o presente.</Text>
    </Animated.View>
  );
}

function ScheduledView({ gift, unlockDate }: { gift: Gift; unlockDate: Date }) {
  const C = useColors();
  const G = useGradients();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const msRemaining = Math.max(0, unlockDate.getTime() - now);
  const days = Math.floor(msRemaining / 86_400_000);
  const hours = Math.floor((msRemaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((msRemaining % 3_600_000) / 60_000);
  const seconds = Math.floor((msRemaining % 60_000) / 1000);
  const dateStr = unlockDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" });
  const timeStr = unlockDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const styles = useMemo(() => StyleSheet.create({
    scheduledWrap: { alignItems: "center" as const, gap: 16, paddingVertical: 20 },
    scheduledIconWrap: { alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 8, width: 100, height: 100, borderRadius: 32 },
    scheduledTitle: { color: C.textPrimary, fontSize: 24, fontWeight: "800" as const, textAlign: "center" as const, letterSpacing: -0.5 },
    scheduledSub: { color: C.textSecondary, fontSize: 15, textAlign: "center" as const, lineHeight: 21 },
    countdownRow: { flexDirection: "row" as const, gap: 10, marginTop: 8 },
    countdownUnit: { alignItems: "center" as const, backgroundColor: C.inkCard, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, minWidth: 60 },
    countdownValue: { color: C.gold, fontSize: 24, fontWeight: "800" as const },
    countdownLabel: { color: C.textMuted, fontSize: 11, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
    dateInfo: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 4 },
    dateText: { color: C.gold, fontSize: 14, fontWeight: "600" as const },
    scheduledHint: { color: C.textMuted, fontSize: 13, textAlign: "center" as const, lineHeight: 18, paddingHorizontal: 12, marginTop: 8 },
  }), [C]);

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.scheduledWrap}>
      <LinearGradient colors={G.gold as readonly [string, string]} style={styles.scheduledIconWrap}>
        <Calendar size={40} color={C.ink} />
      </LinearGradient>
      <Text style={styles.scheduledTitle}>Quase lá!</Text>
      <Text style={styles.scheduledSub}>{gift.recipientName}, seu presente está pronto mas foi agendado para uma data especial.</Text>
      <View style={styles.countdownRow}>
        <View style={styles.countdownUnit}><Text style={styles.countdownValue}>{String(days).padStart(2, "0")}</Text><Text style={styles.countdownLabel}>dias</Text></View>
        <View style={styles.countdownUnit}><Text style={styles.countdownValue}>{String(hours).padStart(2, "0")}</Text><Text style={styles.countdownLabel}>hrs</Text></View>
        <View style={styles.countdownUnit}><Text style={styles.countdownValue}>{String(minutes).padStart(2, "0")}</Text><Text style={styles.countdownLabel}>min</Text></View>
        <View style={styles.countdownUnit}><Text style={styles.countdownValue}>{String(seconds).padStart(2, "0")}</Text><Text style={styles.countdownLabel}>seg</Text></View>
      </View>
      <View style={styles.dateInfo}>
        <Clock size={14} color={C.gold} />
        <Text style={styles.dateText}>{dateStr} às {timeStr}</Text>
      </View>
      <Text style={styles.scheduledHint}>Volte nessa data para abrir seu presente. Quem enviou escolheu esse momento com carinho.</Text>
    </Animated.View>
  );
}

function UnlockedView({ gift }: { gift: Gift }) {
  const C = useColors();
  const G = useGradients();
  const mediaUri = gift.media[0]?.uri;

  const styles = useMemo(() => StyleSheet.create({
    unlockedWrap: { gap: 14 },
    unlockedHero: { borderRadius: 20, padding: 28, alignItems: "center" as const, gap: 8 },
    unlockedSparkle: { marginBottom: 4 },
    unlockedHeroText: { color: C.white, fontSize: 22, fontWeight: "800" as const },
    unlockedHeroSub: { color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center" as const },
    unlockedMedia: { height: 200, borderRadius: 18, overflow: "hidden" as const, backgroundColor: C.inkCard },
    unlockedMediaOverlay: { position: "absolute" as const, bottom: 12, right: 12, width: 40, height: 40, borderRadius: 12, alignItems: "center" as const, justifyContent: "center" as const, overflow: "hidden" as const },
    clipCard: { height: 220, borderRadius: 18, overflow: "hidden" as const, backgroundColor: C.inkCard },
    clipPlaceholder: { backgroundColor: C.inkCard, borderRadius: 18, padding: 40, alignItems: "center" as const, gap: 10, borderWidth: 1, borderColor: C.border },
    clipPlaceholderText: { color: C.textPrimary, fontSize: 16, fontWeight: "700" as const },
    clipPlaceholderSub: { color: C.textSecondary, fontSize: 13, textAlign: "center" as const, lineHeight: 19 },
    unlockedMsg: { backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: "row" as const, gap: 10 },
    unlockedMsgIcon: { marginTop: 3 },
    unlockedMsgText: { color: C.textSecondary, fontSize: 15, lineHeight: 22, flex: 1 },
    gratitude: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 14, borderRadius: 14 },
    gratitudeText: { color: C.ink, fontSize: 14, fontWeight: "700" as const },
  }), [C]);

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.unlockedWrap}>
      <LinearGradient colors={G.hero as readonly [string, string, string]} style={styles.unlockedHero}>
        <Sparkles size={24} color={C.gold} style={styles.unlockedSparkle} />
        <Text style={styles.unlockedHeroText}>Presente aberto!</Text>
        <Text style={styles.unlockedHeroSub}>Alguém especial preparou isso para você.</Text>
      </LinearGradient>
      {mediaUri && (
        <View style={styles.unlockedMedia}>
          <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={20} style={styles.unlockedMediaOverlay}><Heart size={24} color={C.rose} /></BlurView>
        </View>
      )}
      {gift.clipUri ? (
        <View style={styles.clipCard}><Video source={{ uri: gift.clipUri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay={false} useNativeControls isLooping /></View>
      ) : (
        <View style={styles.clipPlaceholder}>
          <Sparkles size={40} color={C.gold} />
          <Text style={styles.clipPlaceholderText}>Miniclipe em produção</Text>
          <Text style={styles.clipPlaceholderSub}>O clipe emocional está sendo gerado.{"\n"}Volte em breve!</Text>
        </View>
      )}
      {gift.message ? (
        <View style={styles.unlockedMsg}>
          <MessageCircle size={14} color={C.plum} style={styles.unlockedMsgIcon} />
          <Text style={styles.unlockedMsgText}>{gift.message}</Text>
        </View>
      ) : null}
      <LinearGradient colors={G.gold as readonly [string, string]} style={styles.gratitude}>
        <Star size={16} color={C.ink} /><Text style={styles.gratitudeText}>Obrigado por abrir seu Tibox!</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function PublicGiftScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const G = useGradients();
  const { publicId } = useLocalSearchParams<{ publicId: string }>();
  const { getByPublicId, markOpened } = useGiftStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const gift = useMemo(() => (publicId ? getByPublicId(publicId) : undefined), [publicId, getByPublicId]);

  // Agendamento: se o presente tem scheduledFor no futuro, bloqueia o acesso
  // até a data — mesmo se o clipe já está pronto.
  const unlockDate = gift?.scheduledFor ? new Date(gift.scheduledFor) : null;
  const isLocked = unlockDate ? unlockDate.getTime() > Date.now() : false;

  useEffect(() => { if (gift && (gift.status === "opened" || gift.status === "delivered") && !isLocked) { setUnlocked(true); } }, [gift, isLocked]);

  const handleUnlock = useCallback(() => {
    if (!gift) return;
    if (code === gift.unlockCode) { setError(false); setUnlocked(true); void markOpened(gift.publicId); }
    else { setError(true); setCode(""); }
  }, [gift, code, markOpened]);

  const styles = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.ink },
    center: { alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 28 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
    notFoundIcon: { width: 72, height: 72, borderRadius: 24, alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 16 },
    notFoundTitle: { color: C.textPrimary, fontSize: 20, fontWeight: "800" as const, marginBottom: 8 },
    notFoundSub: { color: C.textSecondary, fontSize: 14, textAlign: "center" as const, lineHeight: 21 },
    brandHeader: { alignItems: "center" as const, paddingVertical: 12 },
    brandBar: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 12 },
    brandText: { color: C.white, fontSize: 13, fontWeight: "800" as const, letterSpacing: 3 },
    toBadge: { alignItems: "center" as const, marginVertical: 16, gap: 2 },
    toBadgeLabel: { color: C.textMuted, fontSize: 11, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 1.5 },
    toBadgeName: { color: C.textPrimary, fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.5 },
    footer: { alignItems: "center" as const, paddingHorizontal: 24, paddingTop: 12 },
    footerText: { color: C.textMuted, fontSize: 12 },
  }), [C]);

  if (!gift) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <LinearGradient colors={G.brand as readonly [string, string]} style={styles.notFoundIcon}><ShieldQuestion size={32} color={C.white} /></LinearGradient>
        <Text style={styles.notFoundTitle}>Presente não encontrado</Text>
        <Text style={styles.notFoundSub}>Verifique se o link está correto ou{"\n"}entre em contato com quem enviou.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.brandHeader}>
        <LinearGradient colors={G.brand as readonly [string, string]} style={styles.brandBar}><Text style={styles.brandText}>TIBOX</Text></LinearGradient>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.springify()} style={styles.toBadge}>
          <Text style={styles.toBadgeLabel}>Para</Text><Text style={styles.toBadgeName}>{gift.recipientName}</Text>
        </Animated.View>

        {isLocked && unlockDate ? (
          <ScheduledView gift={gift} unlockDate={unlockDate} />
        ) : unlocked ? (
          <UnlockedView gift={gift} />
        ) : (
          <LockedView gift={gift} code={code} onChangeCode={(c) => { setCode(c); setError(false); }} error={error} onUnlock={handleUnlock} />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>Envie seu próprio Tibox — baixe o app</Text>
      </View>
    </View>
  );
}
