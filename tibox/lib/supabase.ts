import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — auth will use mock fallback.");
}

const redirectUrl = Linking.createURL("/auth/callback");

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      storage: undefined, // React Native uses AsyncStorage adapter by default in newer versions
      autoRefreshToken: true,
      persistSession: true,
      // On web, Supabase can read the tokens straight from the URL hash.
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);

/** Open Supabase OAuth in a browser session, then set the session. */
export async function signInWithOAuth(
  provider: "google" | "apple",
): Promise<{ error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl, skipBrowserRedirect: false },
    });
    if (error) return { error: error.message };
    if (!data?.url) return { error: "No OAuth URL returned." };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== "success") return { error: "Login cancelado." };

    const url = result.url;
    const params = new URL(url).searchParams;
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return { error: "Tokens não encontrados na resposta." };
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) return { error: sessionError.message };

    return {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return { error: message };
  }
}

/** Send magic-link OTP to the given email. Returns success; the user clicks the link in their inbox. */
export async function signInWithMagicLink(
  email: string,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) return { error: error.message };
    return {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return { error: message };
  }
}

/**
 * Extract Supabase auth tokens from a redirect URL (hash or query) and set the
 * session. Works with the URL the magic-link email opens — paste it in or let
 * the deep-link handler feed it here. Also supports the `token_hash` PKCE form.
 */
export async function setSessionFromUrl(
  url: string,
): Promise<{ error?: string }> {
  try {
    const readParams = (raw: string): URLSearchParams => {
      const hashIndex = raw.indexOf("#");
      const queryIndex = raw.indexOf("?");
      const fragment =
        hashIndex >= 0
          ? raw.substring(hashIndex + 1)
          : queryIndex >= 0
            ? raw.substring(queryIndex + 1)
            : "";
      return new URLSearchParams(fragment);
    };

    const params = readParams(url.trim());
    const errorDescription = params.get("error_description");
    if (errorDescription) return { error: decodeURIComponent(errorDescription) };

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return { error: error.message };
      return {};
    }

    // PKCE / OTP code flow.
    const code = params.get("code") ?? params.get("token_hash");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { error: error.message };
      return {};
    }

    return {
      error:
        "Nenhum token encontrado no link. Copie o link completo do email (com #access_token=...).",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Não foi possível processar o link.";
    return { error: message };
  }
}

/** Verify a 6-digit email OTP code (when the email template includes a token). */
export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "email",
    });
    if (error) return { error: error.message };
    return {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Código inválido.";
    return { error: message };
  }
}

/** Sign out everywhere. */
export async function signOutSupabase(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return { error: error.message };
    return {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return { error: message };
  }
}

/** Get the current valid JWT (or undefined if not authenticated). */
export async function getAccessToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
