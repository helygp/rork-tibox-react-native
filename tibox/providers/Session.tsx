import createContextHook from "@nkzw/create-context-hook";
import { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAccessToken,
  setSessionFromUrl,
  signInWithMagicLink,
  signInWithOAuth,
  signInWithPassword,
  signOutSupabase,
  supabase,
  verifyEmailOtp,
} from "@/lib/supabase";

export interface TiboxUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: "free" | "pro";
  isGuest: boolean;
}

/**
 * Modo de validação: entra automaticamente sem pedir login, pra validar as
 * jornadas sem fricção. Se a conta de teste fixa tiver credenciais reais
 * configuradas (EXPO_PUBLIC_TEST_ACCOUNT_EMAIL/PASSWORD), ela loga de
 * verdade no Supabase real; se não, cai automaticamente pra um visitante
 * local (Pro) — nunca fica travado na tela de login. Coloque
 * DEV_AUTO_LOGIN = false só quando for testar o fluxo de login manual.
 */
const DEV_AUTO_LOGIN = true;

const DEV_ACCOUNT_EMAIL = process.env.EXPO_PUBLIC_TEST_ACCOUNT_EMAIL as string | undefined;
const DEV_ACCOUNT_PASSWORD = process.env.EXPO_PUBLIC_TEST_ACCOUNT_PASSWORD as string | undefined;

function mapUser(session: Session | null): TiboxUser | null {
  const u: User | undefined = session?.user;
  if (!u) return null;
  const isDevAccount = DEV_AUTO_LOGIN && !!DEV_ACCOUNT_EMAIL && u.email === DEV_ACCOUNT_EMAIL;
  return {
    id: u.id,
    name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Você",
    email: u.email ?? "",
    avatarUrl: u.user_metadata?.avatar_url ?? undefined,
    // A conta de teste fixa sempre aparece como Pro para liberar todas as telas durante a validação.
    plan: isDevAccount ? "pro" : (u.app_metadata?.plan as "free" | "pro") ?? "free",
    isGuest: false,
  };
}

/**
 * Local fallback used while the fixed test account isn't authenticated for
 * real yet (missing credentials or login failure). Keeps the "always
 * logged in, Pro unlocked" dev experience so journeys never get stuck on the
 * sign-in screen, even though API calls won't carry a real JWT in this case.
 */
function makeDevGuest(): TiboxUser {
  return {
    id: "dev-guest",
    name: "Conta de Teste",
    email: "",
    plan: "pro",
    isGuest: true,
  };
}

export const [SessionProvider, useSession] = createContextHook(() => {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["supabase-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session ?? null;
    },
    staleTime: 60_000,
  });

  // Listen for auth state changes.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(["supabase-session"], session ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  // Silently sign in with the fixed test account once we know there's no
  // real session yet, so API calls carry a genuine Supabase JWT while still
  // keeping the "always logged in" dev experience. If real credentials aren't
  // configured yet (or the login fails), fall back to a local guest session
  // immediately instead of leaving the user stuck on the sign-in screen.
  const [devLoginAttempted, setDevLoginAttempted] = useState(false);
  const [devFallbackGuest, setDevFallbackGuest] = useState<TiboxUser | null>(null);
  useEffect(() => {
    if (!DEV_AUTO_LOGIN || sessionQuery.isLoading || devLoginAttempted || sessionQuery.data) {
      return;
    }
    setDevLoginAttempted(true);
    if (!DEV_ACCOUNT_EMAIL || !DEV_ACCOUNT_PASSWORD) {
      console.log("[Session] DEV_AUTO_LOGIN ligado mas faltam EXPO_PUBLIC_TEST_ACCOUNT_EMAIL/PASSWORD — entrando como visitante (Pro) pra não travar o teste das jornadas.");
      setDevFallbackGuest(makeDevGuest());
      return;
    }
    void signInWithPassword(DEV_ACCOUNT_EMAIL, DEV_ACCOUNT_PASSWORD).then((result) => {
      if (result.error) {
        console.log("[Session] Login da conta de teste falhou, entrando como visitante (Pro):", result.error);
        setDevFallbackGuest(makeDevGuest());
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["supabase-session"] });
    });
  }, [sessionQuery.isLoading, sessionQuery.data, devLoginAttempted, queryClient]);

  // Capture auth tokens when a magic-link / OAuth deep link opens the app.
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes("access_token")) {
        if (!url || (!url.includes("code=") && !url.includes("token_hash"))) {
          return;
        }
      }
      const result = await setSessionFromUrl(url);
      if (!result.error) {
        await queryClient.invalidateQueries({ queryKey: ["supabase-session"] });
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", (event) => {
      void handleUrl(event.url);
    });
    return () => sub.remove();
  }, [queryClient]);

  const user = useMemo<TiboxUser | null>(
    () => mapUser(sessionQuery.data ?? null) ?? devFallbackGuest,
    [sessionQuery.data, devFallbackGuest],
  );

  const isAuthenticated = !!user && !user.isGuest;
  // Keep the "loading" state while the silent dev login might still be in
  // flight, so the UI doesn't flash a sign-in screen before that resolves.
  const awaitingDevLogin =
    DEV_AUTO_LOGIN &&
    !sessionQuery.isLoading &&
    !sessionQuery.data &&
    !devLoginAttempted &&
    !devFallbackGuest;
  const isHydrated = !sessionQuery.isLoading && !awaitingDevLogin;

  const signIn = useCallback(
    async (
      provider: "google" | "apple" | "email",
      email?: string,
    ): Promise<{ error?: string }> => {
      if (provider === "email" && email) {
        const result = await signInWithMagicLink(email);
        if (result.error) return result;
        // Magic link — the user needs to click the link. We stay on the sign-in
        // screen until the session listener fires.
        return {};
      }
      if (provider === "google" || provider === "apple") {
        const result = await signInWithOAuth(provider);
        if (result.error) return result;
        // Refresh the session.
        await queryClient.invalidateQueries({ queryKey: ["supabase-session"] });
        return {};
      }
      return { error: "Provedor não suportado." };
    },
    [queryClient],
  );

  /** Finish sign-in from a pasted magic-link URL. */
  const signInWithUrl = useCallback(
    async (url: string): Promise<{ error?: string }> => {
      const result = await setSessionFromUrl(url);
      if (result.error) return result;
      await queryClient.invalidateQueries({ queryKey: ["supabase-session"] });
      return {};
    },
    [queryClient],
  );

  /** Finish sign-in from a 6-digit email OTP code. */
  const verifyCode = useCallback(
    async (email: string, code: string): Promise<{ error?: string }> => {
      const result = await verifyEmailOtp(email, code);
      if (result.error) return result;
      await queryClient.invalidateQueries({ queryKey: ["supabase-session"] });
      return {};
    },
    [queryClient],
  );

  const signOut = useCallback(async (): Promise<{ error?: string }> => {
    const result = await signOutSupabase();
    queryClient.setQueryData(["supabase-session"], null);
    queryClient.invalidateQueries({ queryKey: ["gifts"] });
    return result;
  }, [queryClient]);

  /** Get the current JWT for API calls. */
  const getToken = useCallback(async (): Promise<string | undefined> => {
    return getAccessToken();
  }, []);

  const continueAsGuest = useCallback(() => {
    const guest: TiboxUser = {
      id: `guest-${Date.now()}`,
      name: "Visitante",
      email: "",
      plan: "free",
      isGuest: true,
    };
    queryClient.setQueryData(["supabase-session"], null);
    return guest;
  }, [queryClient]);

  const upgradeToPro = useCallback(async () => {
    // Pro upgrade handled via RevenueCat / StoreKit — placeholder.
    console.log("[Session] upgradeToPro requested");
  }, []);

  const isGuest = user?.isGuest ?? false;

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isHydrated,
      isGuest,
      signIn,
      signInWithUrl,
      verifyCode,
      signOut,
      getToken,
      continueAsGuest,
      upgradeToPro,
    }),
    [user, isAuthenticated, isHydrated, isGuest, signIn, signInWithUrl, verifyCode, signOut, getToken, continueAsGuest, upgradeToPro],
  );
});
