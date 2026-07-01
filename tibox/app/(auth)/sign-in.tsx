import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Apple, Gift, Mail } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Screen from "@/components/Screen";
import Colors, { Gradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";

function PulsingLogo() {
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.06, { duration: 2200 }),
      -1,
      true,
    );
    ringScale.value = withRepeat(
      withTiming(1.5, { duration: 2200 }),
      -1,
      true,
    );
    ringOpacity.value = withRepeat(
      withTiming(0.25, { duration: 2200 }),
      -1,
      true,
    );
  }, [scale, ringScale, ringOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.logoWrap}>
      <Animated.View style={[styles.logoRing, ringStyle]}>
        <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={logoStyle}>
        <LinearGradient colors={Gradients.brand} style={styles.logo}>
          <Gift size={40} color={Colors.white} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signInWithUrl, isAuthenticated, isHydrated } = useSession();
  const [emailMode, setEmailMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<
    "google" | "apple" | "email" | "link" | "password" | null
  >(null);
  const [sent, setSent] = useState(false);
  const [pastedLink, setPastedLink] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-navigate when auth resolves.
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isHydrated, isAuthenticated, router]);

  const handle = useCallback(
    async (provider: "google" | "apple" | "email") => {
      if (provider === "email" && !emailMode) {
        setEmailMode(true);
        return;
      }
      setErrorMsg(null);
      setLoading(provider);

      try {
        const result = await signIn(
          provider,
          provider === "email" ? email.trim() : undefined,
        );

        if (result?.error) {
          setErrorMsg(result.error);
          return;
        }

        if (provider === "email") {
          // Magic link sent — the user needs to check their inbox.
          setSent(true);
          return;
        }
        // OAuth providers redirect and auto-navigate via the effect above.
      } finally {
        setLoading(null);
      }
    },
    [signIn, emailMode, email],
  );

  const handlePastedLink = useCallback(async () => {
    setErrorMsg(null);
    setLoading("link");
    try {
      const result = await signInWithUrl(pastedLink.trim());
      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }
      // Success — AuthGate navigates automatically.
    } finally {
      setLoading(null);
    }
  }, [signInWithUrl, pastedLink]);

  const handlePasswordLogin = useCallback(async () => {
    setErrorMsg(null);
    setLoading("password");
    try {
      const result = await signIn("email", email.trim(), password);
      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }
      // Success — the effect above navigates once the session updates.
    } finally {
      setLoading(null);
    }
  }, [signIn, email, password]);

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.hero}>
            <PulsingLogo />
            <Text style={styles.brand}>Tibox</Text>
            <Text style={styles.tagline}>
              Presentes que emocionam,{"\n"}entregues na hora certa.
            </Text>
          </View>

          <View style={styles.actions}>
            {sent && (
              <>
                <View style={styles.sentBanner}>
                  <Mail size={18} color={Colors.gold} />
                  <Text style={styles.sentText}>
                    Link enviado para {email.trim()}. Abra o email e toque no
                    link. Se ele não abrir o app, copie o link completo e cole
                    abaixo.
                  </Text>
                </View>
                <TextInput
                  value={pastedLink}
                  onChangeText={(t) => {
                    setPastedLink(t);
                    setErrorMsg(null);
                  }}
                  placeholder="Cole aqui o link do email"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  style={[styles.input, styles.linkInput]}
                />
                <GradientButton
                  label="Entrar com o link"
                  loading={loading === "link"}
                  onPress={handlePastedLink}
                  disabled={!pastedLink.includes("access_token") && !pastedLink.includes("code=")}
                />
              </>
            )}

            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {emailMode && !sent && (
              <>
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrorMsg(null);
                  }}
                  placeholder="seu@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  style={styles.input}
                />
                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMsg(null);
                  }}
                  placeholder="Sua senha"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
                <GradientButton
                  label="Entrar"
                  loading={loading === "password"}
                  onPress={handlePasswordLogin}
                  disabled={email.trim().length < 4 || password.length < 4}
                />
              </>
            )}

            {!sent && (
              <GradientButton
                label={
                  emailMode
                    ? "Ou receber um link por email"
                    : "Continuar com email"
                }
                variant={emailMode ? "ghost" : undefined}
                icon={emailMode ? undefined : <Mail size={20} color={Colors.white} />}
                loading={loading === "email"}
                onPress={() => handle("email")}
                disabled={emailMode && email.trim().length < 4}
              />
            )}

            {!emailMode && !sent && (
              <>
                <GradientButton
                  label="Entrar com Google"
                  variant="ghost"
                  loading={loading === "google"}
                  onPress={() => handle("google")}
                />
                {Platform.OS === "ios" && (
                  <GradientButton
                    label="Entrar com Apple"
                    variant="ghost"
                    icon={
                      <Apple size={20} color={Colors.textPrimary} />
                    }
                    loading={loading === "apple"}
                    onPress={() => handle("apple")}
                  />
                )}
              </>
            )}

            {sent && (
              <GradientButton
                label="Voltar"
                variant="ghost"
                onPress={() => {
                  setSent(false);
                  setEmailMode(false);
                  setPastedLink("");
                  setErrorMsg(null);
                }}
              />
            )}

            {!sent && (
              <Pressable
                onPress={() => router.push("/(auth)/sign-up")}
                style={styles.signUpLink}
              >
                <Text style={styles.signUpLinkText}>
                  Não tem conta? <Text style={styles.signUpLinkStrong}>Criar conta</Text>
                </Text>
              </Pressable>
            )}

            <Text style={styles.terms}>
              Ao continuar, você concorda com os Termos de Uso e a Política de
              Privacidade do Tibox.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    marginTop: 40,
    gap: 16,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 30,
  },
  brand: {
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  actions: {
    gap: 14,
  },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.inkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  linkInput: {
    height: 72,
    paddingTop: 16,
    textAlignVertical: "top",
    fontSize: 13,
  },
  sentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,196,91,0.12)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(232,196,91,0.3)",
  },
  sentText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: "rgba(232,101,78,0.12)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(232,101,78,0.3)",
  },
  errorText: {
    color: "#E8654E",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  terms: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  signUpLink: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  signUpLinkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signUpLinkStrong: {
    color: Colors.rose,
    fontWeight: "700",
  },
});
