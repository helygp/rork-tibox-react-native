import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Crown, Gift, Sparkles, Star, Zap } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { Gradients } from "@/constants/colors";
import Colors from "@/constants/colors";
import { useSession } from "@/providers/Session";
import { ThemeMode, useColors, useTheme } from "@/providers/Theme";

const PRO_BENEFITS = [
  { icon: Sparkles, text: "Presentes ilimitados — crie quantos quiser" },
  { icon: Star, text: "Miniclipes em HD com IA avançada" },
  { icon: Zap, text: "Entrega prioritária e agendamento flexível" },
  { icon: Crown, text: "Badge Pro no seu perfil e suporte VIP" },
];

function BenefitRow({
  icon: Icon,
  text,
  index,
}: {
  icon: React.FC<{ size: number; color: string }>;
  text: string;
  index: number;
}) {
  const C = useColors();
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={[styles.benefit, { backgroundColor: C.inkCard, borderColor: C.border }]}
    >
      <View style={styles.benefitIcon}>
        <Icon size={18} color={Colors.gold} />
      </View>
      <Text style={[styles.benefitText, { color: C.textPrimary }]}>{text}</Text>
    </Animated.View>
  );
}

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const { upgradeToPro } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    await upgradeToPro();
    setLoading(false);
    router.back();
  }, [upgradeToPro, router]);

  return (
    <View style={[styles.screen, { backgroundColor: C.ink, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        >
          <Text style={[styles.closeBtnText, { color: C.textSecondary }]}>Voltar</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          <LinearGradient colors={Gradients.brandDeep} style={styles.heroBadge}>
            <Crown size={36} color={Colors.white} />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: C.textPrimary }]}>Tibox Pro</Text>
          <Text style={[styles.heroSub, { color: C.textSecondary }]}>
            Libere todo o poder dos presentes emocionais.
          </Text>
        </Animated.View>

        {/* Plan cards */}
        <View style={styles.plansRow}>
          {/* Free */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={[styles.planCard, { backgroundColor: C.inkCard, borderColor: C.border }]}
          >
            <Text style={[styles.planName, { color: C.textSecondary }]}>Free</Text>
            <Text style={[styles.planPrice, { color: C.textPrimary }]}>Grátis</Text>
            <Text style={[styles.planDesc, { color: C.textMuted }]}>
              3 presentes{"\n"}Clipes em SD{"\n"}Suporte básico
            </Text>
          </Animated.View>

          {/* Pro */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.planCard, styles.planCardPro]}
          >
            <LinearGradient colors={Gradients.brand} style={styles.proBadge}>
              <Text style={styles.proBadgeText}>Recomendado</Text>
            </LinearGradient>
            <Text style={styles.planNamePro}>Pro</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPricePro}>R$ 19,90</Text>
              <Text style={styles.planPeriod}>/mês</Text>
            </View>
            <Text style={styles.planDescPro}>
              Presentes ilimitados{"\n"}Clipes em HD{"\n"}Suporte prioritário
            </Text>
          </Animated.View>
        </View>

        {/* Benefits */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
            Por que assinar o Pro?
          </Text>
          {PRO_BENEFITS.map((b, i) => (
            <BenefitRow key={b.text} {...b} index={i} />
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.cta}>
          <GradientButton
            label={loading ? "Processando..." : "Assinar Tibox Pro"}
            onPress={handleSubscribe}
            loading={loading}
            icon={<Crown size={20} color={Colors.white} />}
          />
          <Text style={[styles.terms, { color: C.textMuted }]}>
            Assinatura renovável automaticamente. Cancele quando quiser.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
  },
  plansRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  planCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 8,
    position: "relative",
  },
  planCardPro: {
    borderColor: Colors.rose,
    backgroundColor: Colors.inkCard,
    shadowColor: Colors.rose,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  proBadge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planNamePro: {
    color: Colors.rose,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "800",
  },
  planPricePro: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: "800",
  },
  planPeriod: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  planDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  planDescPro: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: 28,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(244,199,123,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  cta: {
    gap: 12,
    marginBottom: 8,
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
