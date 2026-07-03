import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowRight, CalendarHeart, Gift, Sparkles, UserPlus } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { useColors, useGradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";

const { width: SCREEN_W } = Dimensions.get("window");

function MiniLogo() {
  const C = useColors();
  const G = useGradients();
  const scale = useSharedValue(1);
  const opacityRing = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.08, { duration: 2000 }), -1, true);
    opacityRing.value = withDelay(400, withRepeat(withTiming(0.15, { duration: 2000 }), -1, true));
  }, [scale, opacityRing]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacityRing.value }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        miniLogoWrap: { alignItems: "center" as const, justifyContent: "center" as const, width: 52, height: 52 },
        miniLogo: { width: 42, height: 42, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
        miniLogoRing: { position: "absolute" as const, width: 52, height: 52, borderRadius: 16 },
      }),
    [],
  );

  return (
    <View style={styles.miniLogoWrap}>
      <Animated.View style={[styles.miniLogoRing, ringStyle]}>
        <LinearGradient colors={G.brand as readonly [string, string]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient colors={G.brand as readonly [string, string]} style={styles.miniLogo}>
        <Gift size={22} color={C.white} />
      </LinearGradient>
    </View>
  );
}

function Dots({ current }: { current: number }) {
  const C = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
      {[0, 1, 2].map((_, i) => (
        <View key={i} style={[{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === current ? C.plum : C.border }]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const G = useGradients();
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const SLIDES = useMemo(
    () => [
      { icon: Gift, gradient: G.brand, title: "Crie presentes emocionais", subtitle: "Combine fotos, vídeos, música e uma mensagem especial em um miniclipe único feito com IA." },
      { icon: CalendarHeart, gradient: G.hero, title: "Agende a entrega perfeita", subtitle: "Escolha a data e a hora exata para o presente chegar. Nem um minuto antes, nem um minuto depois." },
      { icon: Sparkles, gradient: G.brand, title: "Surpreenda com um link mágico", subtitle: "O destinatário recebe um link com QR Code e desbloqueia o presente com uma senha de 4 dígitos." },
    ],
    [G],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: C.ink },
        topRow: { flexDirection: "row" as const, justifyContent: "flex-start" as const, alignItems: "center" as const, paddingHorizontal: 20, height: 56 },
        slides: { flex: 1 },
        slide: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 40, gap: 20, paddingBottom: 40 },
        slideIconWrap: { marginBottom: 8 },
        slideIcon: { width: 120, height: 120, borderRadius: 36, alignItems: "center" as const, justifyContent: "center" as const },
        slideTitle: { color: C.textPrimary, fontSize: 24, fontWeight: "800" as const, textAlign: "center" as const, letterSpacing: -0.5 },
        slideSub: { color: C.textSecondary, fontSize: 15, textAlign: "center" as const, lineHeight: 23, paddingHorizontal: 8 },
        bottom: { paddingHorizontal: 24, gap: 24 },
        lastActions: { gap: 12 },
      }),
    [C],
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrent(idx);
    currentRef.current = idx;
  }, []);

  const goNext = useCallback(() => {
    const next = currentRef.current + 1;
    if (next < SLIDES.length) { currentRef.current = next; setCurrent(next); scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true }); }
  }, [SLIDES]);

  const goToSignIn = useCallback(() => { router.replace("/(auth)/sign-in"); }, [router]);
  const goToSignUp = useCallback(() => { router.replace("/(auth)/sign-up"); }, [router]);
  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <MiniLogo />
      </View>

      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} scrollEventThrottle={16} style={styles.slides}>
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
              <Animated.View entering={FadeInRight.delay(100).springify()} style={styles.slideIconWrap}>
                <LinearGradient colors={slide.gradient as readonly [string, string, ...string[]]} style={styles.slideIcon}>
                  <Icon size={48} color={C.white} />
                </LinearGradient>
              </Animated.View>
              <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.slideTitle}>{slide.title}</Animated.Text>
              <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.slideSub}>{slide.subtitle}</Animated.Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Dots current={current} />
        {isLast ? (
          <View style={styles.lastActions}>
            <GradientButton label="Entrar na minha conta" onPress={goToSignIn} icon={<ArrowRight size={20} color={C.white} />} />
            <GradientButton label="Criar conta" onPress={goToSignUp} variant="ghost" icon={<UserPlus size={20} color={C.textPrimary} />} />
          </View>
        ) : (
          <GradientButton label="Próximo" onPress={goNext} variant="ghost" icon={<ArrowRight size={20} color={C.textPrimary} />} />
        )}
      </View>
    </View>
  );
}
