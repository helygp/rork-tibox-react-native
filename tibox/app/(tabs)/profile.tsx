import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, LogOut, Mail, Moon, Shield, Sun } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Screen from "@/components/Screen";
import { useColors, useGradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";
import { useTheme } from "@/providers/Theme";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const C = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14, backgroundColor: C.inkCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
        rowPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
        rowIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(199,178,206,0.1)", alignItems: "center" as const, justifyContent: "center" as const },
        rowIconDanger: { backgroundColor: "rgba(232,101,78,0.12)" },
        rowBody: { flex: 1, gap: 2 },
        rowLabel: { color: C.textPrimary, fontSize: 15, fontWeight: "600" as const },
        rowLabelDanger: { color: C.rose },
        rowValue: { color: C.textSecondary, fontSize: 13 },
      }),
    [C],
  );
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, upgradeToPro } = useSession();
  const [upgrading, setUpgrading] = useState(false);
  const C = useColors();
  const G = useGradients();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { paddingHorizontal: 20 },
        title: { color: C.textPrimary, fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 20 },
        card: { backgroundColor: C.inkCard, borderRadius: 24, padding: 24, alignItems: "center" as const, borderWidth: 1, borderColor: C.border, gap: 10, marginBottom: 28 },
        avatarBig: { width: 72, height: 72, borderRadius: 36, alignItems: "center" as const, justifyContent: "center" as const },
        avatarBigText: { color: C.white, fontSize: 28, fontWeight: "800" as const },
        cardName: { color: C.textPrimary, fontSize: 20, fontWeight: "800" as const },
        cardEmail: { color: C.textSecondary, fontSize: 14 },
        planBadge: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(232,196,91,0.12)" },
        planBadgePro: { backgroundColor: C.gold },
        planText: { color: C.gold, fontSize: 12, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
        planTextPro: { color: C.ink },
        section: { marginBottom: 20, gap: 8 },
        sectionLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4, marginLeft: 4 },
      }),
    [C],
  );

  const handleSignOut = useCallback(() => {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => { void signOut(); } },
    ]);
  }, [signOut]);

  const handleUpgrade = useCallback(async () => {
    setUpgrading(true);
    await upgradeToPro();
    setUpgrading(false);
    Alert.alert("✨ Plano Pro", "Funcionalidade em breve. Seus presentes serão ilimitados!");
  }, [upgradeToPro]);

  const firstName = user?.name?.split(" ")[0] ?? "Você";

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Perfil</Text>

        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
          <LinearGradient colors={G.hero as readonly [string, string, string]} style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>{firstName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.cardName}>{user?.name ?? "Usuário"}</Text>
          <Text style={styles.cardEmail}>{user?.email ?? ""}</Text>
          <View style={[styles.planBadge, user?.plan === "pro" && styles.planBadgePro]}>
            <Crown size={13} color={user?.plan === "pro" ? C.ink : C.gold} />
            <Text style={[styles.planText, user?.plan === "pro" && styles.planTextPro]}>{user?.plan === "pro" ? "Pro" : "Free"}</Text>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conta</Text>
          <SettingRow icon={<Mail size={18} color={C.textSecondary} />} label="Email" value={user?.email} onPress={() => {}} />
          <SettingRow icon={<Shield size={18} color={C.textSecondary} />} label="Privacidade e Termos" onPress={() => {}} />
          <SettingRow
            icon={mode === "dark" ? <Moon size={18} color={C.textSecondary} /> : <Sun size={18} color={C.gold} />}
            label="Tema"
            value={mode === "dark" ? "Escuro" : "Claro"}
            onPress={toggleTheme}
          />
        </View>

        {user?.plan !== "pro" && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <GradientButton label="Ver planos Tibox Pro" onPress={() => router.push("/upgrade")} loading={upgrading} icon={<Crown size={18} color={C.white} />} />
          </Animated.View>
        )}

        <SettingRow icon={<LogOut size={18} color={C.rose} />} label="Sair da conta" onPress={handleSignOut} danger />
      </ScrollView>
    </Screen>
  );
}
