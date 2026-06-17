import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, LogOut, Mail, Moon, Shield, Sun } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Screen from "@/components/Screen";
import Colors, { Gradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";
import { useColors, useTheme } from "@/providers/Theme";

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
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
  const { mode, toggleTheme } = useTheme();

  const handleSignOut = useCallback(() => {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          void signOut();
        },
      },
    ]);
  }, [signOut]);

  const router = useRouter();

  const handleUpgrade = useCallback(async () => {
    setUpgrading(true);
    await upgradeToPro();
    setUpgrading(false);
    Alert.alert("✨ Plano Pro", "Funcionalidade em breve. Seus presentes serão ilimitados!");
  }, [upgradeToPro]);

  const firstName = user?.name?.split(" ")[0] ?? "Você";

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Perfil</Text>

        {/* Avatar card */}
        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
          <LinearGradient colors={Gradients.hero} style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>{firstName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.cardName}>{user?.name ?? "Usuário"}</Text>
          <Text style={styles.cardEmail}>{user?.email ?? ""}</Text>
          <View style={[styles.planBadge, user?.plan === "pro" && styles.planBadgePro]}>
            <Crown size={13} color={user?.plan === "pro" ? Colors.ink : Colors.gold} />
            <Text style={[styles.planText, user?.plan === "pro" && styles.planTextPro]}>
              {user?.plan === "pro" ? "Pro" : "Free"}
            </Text>
          </View>
        </Animated.View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conta</Text>
          <SettingRow
            icon={<Mail size={18} color={Colors.textSecondary} />}
            label="Email"
            value={user?.email}
            onPress={() => {}}
          />
          <SettingRow
            icon={<Shield size={18} color={Colors.textSecondary} />}
            label="Privacidade e Termos"
            onPress={() => {}}
          />
          <SettingRow
            icon={
              mode === "dark" ? (
                <Moon size={18} color={Colors.textSecondary} />
              ) : (
                <Sun size={18} color={Colors.gold} />
              )
            }
            label="Tema"
            value={mode === "dark" ? "Escuro" : "Claro"}
            onPress={toggleTheme}
          />
        </View>

        {/* Upgrade */}
        {user?.plan !== "pro" && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <GradientButton
              label="Ver planos Tibox Pro"
              onPress={() => router.push("/upgrade")}
              loading={upgrading}
              icon={<Crown size={18} color={Colors.white} />}
            />
          </Animated.View>
        )}

        {/* Sign out */}
        <SettingRow
          icon={<LogOut size={18} color={Colors.rose} />}
          label="Sair da conta"
          onPress={handleSignOut}
          danger
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.inkCard,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 28,
  },
  avatarBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBigText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "800",
  },
  cardName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  cardEmail: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(232,196,91,0.12)",
  },
  planBadgePro: {
    backgroundColor: Colors.gold,
  },
  planText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planTextPro: {
    color: Colors.ink,
  },
  section: {
    marginBottom: 20,
    gap: 8,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.inkCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(199,178,206,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: {
    backgroundColor: "rgba(232,101,78,0.12)",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  rowLabelDanger: {
    color: Colors.rose,
  },
  rowValue: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
