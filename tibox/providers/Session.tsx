import createContextHook from "@nkzw/create-context-hook";
import { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo } from "react";

import {
  getAccessToken,
  setSessionFromUrl,
  signInWithMagicLink,
  signInWithOAuth,
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
 * Modo de validação: entra direto numa conta única de teste, sem login.
 * Coloque DEV_AUTO_LOGIN = false quando for trabalhar no fluxo de login real.
 */
const DEV_AUTO_LOGIN = true;

const DEV_USER: TiboxUser = {
  id: "dev-tibox-account",
  name: "Conta de Teste",
  email: "teste@tibox.app",
  plan: "pro",
  isGuest: false,
};

function mapUser(session: Session | null): TiboxUser | null {
  const u: User | undefined = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Você",
    email: u.email ?? "",
    avatarUrl: u.user_metadata?.avatar_url ?? undefined,
    plan: (u.app_metadata?.plan as "free" | "pro") ?? "free",
    isGuest: false,
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

  const user = useMemo<TiboxUser | null>(() => {
    const real = mapUser(sessionQuery.data ?? null);
    if (real) return real;
    if (DEV_AUTO_LOGIN) return DEV_USER;
    return null;
  }, [sessionQuery.data]);

  const isAuthenticated = !!user;
  const isHydrated = !sessionQuery.isLoading;

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
