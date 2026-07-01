import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Apple, CheckCircle2, Gift } from "lucide-react-native";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Screen from "@/components/Screen";
import Colors, { Gradients } from "@/constants/colors";
import { useSession } from "@/providers/Session";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, signIn, isAuthenticated, isHydrated } = useSession();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<"password" | "google" | "apple" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState<boolean>(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isHydrated, isAuthenticated, router]);

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length >= 4 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleCreateAccount = useCallback(async () => {
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading("password");
    try {
      const result = await signUp(name.trim(), email.trim(), password);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setConfirmationSent(true);
        return;
      }
      // Session created immediately — the effect above navigates.
    } finally {
      setLoading(null);
    }
  }, [signUp, name, email, password, confirmPassword]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      setErrorMsg(null);
      setLoading(provider);
      try {
        const result = await signIn(provider);
        if (result?.error) {
          setErrorMsg(result.error);
        }
        // Success navigates automatically via the effect above.
      } finally {
        setLoading(null);
      }
    },
    [signIn],
  );

  const goToSignIn = useCallback(() => {
    router.replace("/(auth)/sign-in");
  }, [router]);

  if (confirmationSent) {
    return (
      <Screen>
        <View
          style={[
            styles.confirmWrap,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.confirmIcon}>
            <CheckCircle2 size={56} color={Colors.rose} />
          </View>
          <Text style={styles.confirmTitle}>Quase lá!</Text>
          <Text style={styles.confirmText}>
            Enviamos um link de confirmação para {email.trim()}. Abra seu
            email e toque no link para ativar sua conta.
          </Text>
          <GradientButton label="Voltar para o login" onPress={goToSignIn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.hero}>
            <LinearGradient colors={Gradients.brand} style={styles.logo}>
              <Gift size={32} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              Comece a criar presentes que emocionam.
            </Text>
          </View>

          <View style={styles.form}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setErrorMsg(null);
              }}
              placeholder="Seu nome"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              style={styles.input}
            />
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
              autoCorrect={false}
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrorMsg(null);
              }}
              placeholder="Crie uma senha (mín. 6 caracteres)"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrorMsg(null);
              }}
              placeholder="Confirme sua senha"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />

            <GradientButton
              label="Criar conta"
              loading={loading === "password"}
              onPress={handleCreateAccount}
              disabled={!canSubmit}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <GradientButton
              label="Continuar com Google"
              variant="ghost"
              loading={loading === "google"}
              onPress={() => handleOAuth("google")}
            />
            {Platform.OS === "ios" && (
              <GradientButton
                label="Continuar com Apple"
                variant="ghost"
                icon={<Apple size={20} color={Colors.textPrimary} />}
                loading={loading === "apple"}
                onPress={() => handleOAuth("apple")}
              />
            )}

            <Pressable onPress={goToSignIn} style={styles.signInLink}>
              <Text style={styles.signInLinkText}>
                Já tem uma conta? <Text style={styles.signInLinkStrong}>Entrar</Text>
              </Text>
            </Pressable>
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
    gap: 12,
    marginBottom: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
  form: {
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  signInLink: {
    alignSelf: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  signInLinkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signInLinkStrong: {
    color: Colors.rose,
    fontWeight: "700",
  },
  confirmWrap: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  confirmIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(143,209,79,0.12)",
    marginBottom: 8,
  },
  confirmTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  confirmText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
});
