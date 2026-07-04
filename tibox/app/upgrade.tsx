import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Crown, Sparkles, Star, Zap } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { useColors, useGradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";

const PRO_BENEFITS = [
  { icon: Sparkles, text: "Presentes ilimitados — crie quantos quiser" },
  { icon: Star, text: "Miniclipes em HD com IA avançada" },
  { icon: Zap, text: "Entrega prioritária e agendamento flexível" },
  { icon: Crown, text: "Badge Pro no seu perfil e suporte VIP" },
];

function BenefitRow({ icon: Icon, text, index }: { icon: React.FC<{ size: number; color: string }>; text: string; index: number }) {
  const C = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        benefit: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14, borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: C.inkCard, borderColor: C.border },
        benefitIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(244,199,123,0.12)", alignItems: "center" as const, justifyContent: "center" as const },
        benefitText: { fontSize: 14, fontWeight: "600" as const, flex: 1, color: C.textPrimary },
      }),
    [C],
  );
  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()} style={styles.benefit}>
      <View style={styles.benefitIcon}><Icon size={18} color={C.gold} /></View>
      <Text style={styles.benefitText}>{text}</Text>
    </Animated.View>
  );
}

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const G = useGradients();
  const { upgradeToPro } = useSession();
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: C.ink },
        header: { flexDirection: "row" as const, alignItems: "center" as const, paddingHorizontal: 16, height: 52 },
        closeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
        closeBtnPressed: { opacity: 0.6 },
        closeBtnText: { fontSize: 15, fontWeight: "600" as const, color: C.textSecondary },
        body: { flex: 1 },
        bodyContent: { paddingHorizontal: 24 },
        hero: { alignItems: "center" as const, paddingVertical: 24, gap: 12 },
        heroBadge: { width: 80, height: 80, borderRadius: 28, alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 4 },
        heroTitle: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -1, color: C.textPrimary },
        heroSub: { fontSize: 15, textAlign: "center" as const, lineHeight: 21, color: C.textSecondary },
        plansRow: { flexDirection: "row" as const, gap: 12, marginBottom: 28 },
        planCard: { flex: 1, borderRadius: 20, padding: 20, borderWidth: 1, gap: 8, position: "relative" as const, backgroundColor: C.inkCard, borderColor: C.border },
        planCardPro: { borderColor: C.rose, backgroundColor: C.inkCard, shadowColor: C.rose, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
        proBadge: { position: "absolute" as const, top: -12, alignSelf: "center" as const, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
        proBadgeText: { color: C.white, fontSize: 11, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
        planName: { fontSize: 14, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, color: C.textSecondary },
        planNamePro: { color: C.rose, fontSize: 14, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
        priceRow: { flexDirection: "row" as const, alignItems: "baseline" as const, gap: 2 },
        planPrice: { fontSize: 24, fontWeight: "800" as const, color: C.textPrimary },
        planPricePro: { color: C.white, fontSize: 26, fontWeight: "800" as const },
        planPeriod: { color: C.textSecondary, fontSize: 13 },
        planDesc: { fontSize: 13, lineHeight: 20, color: C.textMuted },
        planDescPro: { color: C.textSecondary, fontSize: 13, lineHeight: 20 },
        benefitsSection: { marginBottom: 28, gap: 10 },
        sectionTitle: { fontSize: 18, fontWeight: "800" as const, marginBottom: 6, color: C.textPrimary },
        cta: { gap: 12, marginBottom: 8 },
        terms: { fontSize: 12, textAlign: "center" as const, lineHeight: 18, paddingHorizontal: 16, color: C.textMuted },
      }),
    [C],
  );

  const handleSubscribe = useCallback(async () => { setLoading(true); await upgradeToPro(); setLoading(false); router.back(); }, [upgradeToPro, router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}>
          <Text style={styles.closeBtnText}>Voltar</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          <LinearGradient colors={G.brandDeep as readonly [string, string]} style={styles.heroBadge}>
            <Crown size={36} color={C.white} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Tibox Pro</Text>
          <Text style={styles.heroSub}>Libere todo o poder dos presentes emocionais.</Text>
        </Animated.View>

        <View style={styles.plansRow}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.planCard}>
            <Text style={styles.planName}>Free</Text>
            <Text style={styles.planPrice}>Grátis</Text>
            <Text style={styles.planDesc}>3 presentes{"\n"}Clipes em SD{"\n"}Suporte básico</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.planCard, styles.planCardPro]}>
            <LinearGradient colors={G.brand as readonly [string, string]} style={styles.proBadge}>
              <Text style={styles.proBadgeText}>Recomendado</Text>
            </LinearGradient>
            <Text style={styles.planNamePro}>Pro</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPricePro}>R$ 19,90</Text>
              <Text style={styles.planPeriod}>/mês</Text>
            </View>
            <Text style={styles.planDescPro}>Presentes ilimitados{"\n"}Clipes em HD{"\n"}Suporte prioritário</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Por que assinar o Pro?</Text>
          {PRO_BENEFITS.map((b, i) => <BenefitRow key={b.text} {...b} index={i} />)}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.cta}>
          <GradientButton label={loading ? "Processando..." : "Assinar Tibox Pro"} onPress={handleSubscribe} loading={loading} icon={<Crown size={20} color={C.white} />} />
          <Text style={styles.terms}>Assinatura renovável automaticamente. Cancele quando quiser.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
