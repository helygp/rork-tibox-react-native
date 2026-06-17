import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  CalendarHeart,
  Gift,
  Sparkles,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
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
import Colors, { Gradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    icon: Gift,
    gradient: Gradients.brand,
    title: "Crie presentes emocionais",
    subtitle:
      "Combine fotos, vídeos, música e uma mensagem especial em um miniclipe único feito com IA.",
  },
  {
    icon: CalendarHeart,
    gradient: Gradients.hero,
    title: "Agende a entrega perfeita",
    subtitle:
      "Escolha a data e a hora exata para o presente chegar. Nem um minuto antes, nem um minuto depois.",
  },
  {
    icon: Sparkles,
    gradient: Gradients.brand,
    title: "Surpreenda com um link mágico",
    subtitle:
      "O destinatário recebe um link com QR Code e desbloqueia o presente com uma senha de 4 dígitos.",
  },
];

function MiniLogo() {
  const scale = useSharedValue(1);
  const opacityRing = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: 2000 }),
      -1,
      true,
    );
    opacityRing.value = withDelay(
      400,
      withRepeat(withTiming(0.15, { duration: 2000 }), -1, true),
    );
  }, [scale, opacityRing]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacityRing.value,
  }));

  return (
    <View style={styles.miniLogoWrap}>
      <Animated.View style={[styles.miniLogoRing, ringStyle]}>
        <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient colors={Gradients.brand} style={styles.miniLogo}>
        <Gift size={22} color={Colors.white} />
      </LinearGradient>
    </View>
  );
}

function Dots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {SLIDES.map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { continueAsGuest } = useSession();
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      setCurrent(idx);
      currentRef.current = idx;
    },
    [],
  );

  const goNext = useCallback(() => {
    const next = currentRef.current + 1;
    if (next < SLIDES.length) {
      currentRef.current = next;
      setCurrent(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    }
  }, []);

  const enterAsGuest = useCallback(() => {
    continueAsGuest();
    router.replace("/(tabs)");
  }, [continueAsGuest, router]);

  const goToSignIn = useCallback(() => {
    router.replace("/(auth)/sign-in");
  }, [router]);

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top row: mini logo + skip */}
      <View style={styles.topRow}>
        <MiniLogo />
        <Pressable
          onPress={enterAsGuest}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.skipPressed]}
        >
          <Text style={styles.skipText}>Pular</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.slides}
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
              <Animated.View
                entering={FadeInRight.delay(100).springify()}
                style={styles.slideIconWrap}
              >
                <LinearGradient
                  colors={slide.gradient as readonly [string, string, ...string[]]}
                  style={styles.slideIcon}
                >
                  <Icon size={48} color={Colors.white} />
                </LinearGradient>
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(200).springify()}
                style={styles.slideTitle}
              >
                {slide.title}
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300).springify()}
                style={styles.slideSub}
              >
                {slide.subtitle}
              </Animated.Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Dots current={current} />

        {isLast ? (
          <View style={styles.lastActions}>
            <GradientButton
              label="Entrar na minha conta"
              onPress={goToSignIn}
              icon={<ArrowRight size={20} color={Colors.white} />}
            />
            <Pressable onPress={enterAsGuest} style={styles.guestLink}>
              <Text style={styles.guestLinkText}>Continuar sem login</Text>
            </Pressable>
          </View>
        ) : (
          <GradientButton
            label="Próximo"
            onPress={goNext}
            variant="ghost"
            icon={<ArrowRight size={20} color={Colors.textPrimary} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 56,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.inkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipPressed: {
    opacity: 0.7,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  miniLogoWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
  },
  miniLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  miniLogoRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  slides: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 20,
    paddingBottom: 40,
  },
  slideIconWrap: {
    marginBottom: 8,
  },
  slideIcon: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slideSub: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 24,
  },
  lastActions: {
    gap: 12,
  },
  guestLink: {
    alignSelf: "center",
    paddingVertical: 6,
  },
  guestLinkText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.plum,
    width: 24,
  },
});
