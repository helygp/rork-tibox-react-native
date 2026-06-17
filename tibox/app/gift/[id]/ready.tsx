import { Video, ResizeMode } from "expo-av";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Gift,
  LinkIcon,
  MessageCircle,
  Share2,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import type { Gift as GiftType } from "@/types/gift";

const WEB_BASE = "https://tibox.aurabr.app/g";

export default function ReadyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useGiftStore();

  const gift: GiftType | undefined = useMemo(
    () => (id ? getById(id) : undefined),
    [id, getById],
  );

  const publicLink = gift ? `${WEB_BASE}/${gift.publicId}` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${encodeURIComponent("220x220")}&data=${encodeURIComponent(publicLink)}&margin=8`;

  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicLink]);

  const handleShare = useCallback(async () => {
    try {
      await Sharing.shareAsync(publicLink, {
        mimeType: "text/plain",
        dialogTitle: "Compartilhar presente Tibox",
      });
    } catch {
      // user cancelled
    }
  }, [publicLink]);

  const handleBack = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  if (!gift) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={handleBack} style={styles.topBack}>
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.notFound}>Presente não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Presente pronto!</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero thumbnail */}
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          {gift.media[0] ? (
            <Image source={{ uri: gift.media[0].uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={Gradients.hero} style={StyleSheet.absoluteFill} />
          )}
          <BlurView intensity={25} style={styles.heroOverlay}>
            <LinearGradient colors={Gradients.brand} style={styles.heroBadge}>
              <CheckCircle2 size={28} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.heroText}>Seu presente está pronto!</Text>
            <Text style={styles.heroSub}>
              Compartilhe o link com {gift.recipientName.split(" ")[0]} agora.
            </Text>
          </BlurView>
        </Animated.View>

        {/* Link card with full width copy/share */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.linkCard}>
          <View style={styles.linkIconRow}>
            <LinkIcon size={18} color={Colors.rose} />
            <Text style={styles.linkLabel}>Link do presente</Text>
          </View>
          <Text style={styles.linkUrl} numberOfLines={2} selectable>
            {publicLink}
          </Text>
          <View style={styles.linkButtons}>
            <Pressable onPress={handleCopy} style={styles.linkBtn}>
              {copied ? (
                <CheckCircle2 size={18} color={Colors.success} />
              ) : (
                <Copy size={18} color={Colors.textSecondary} />
              )}
              <Text style={styles.linkBtnText}>
                {copied ? "Copiado!" : "Copiar link"}
              </Text>
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.linkBtn, styles.linkBtnAlt]}>
              <Share2 size={18} color={Colors.rose} />
              <Text style={[styles.linkBtnText, styles.linkBtnTextAlt]}>Compartilhar</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* QR Code — large and centered */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.qrWrapper}>
          <View style={styles.qrCard}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              contentFit="contain"
            />
          </View>
          <Text style={styles.qrHint}>
            Mostre este QR Code para o destinatário escanear
          </Text>
        </Animated.View>

        {/* Unlock code reveal */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.codeRow}>
          <Pressable
            style={styles.codeCard}
            onPress={() => setShowCode((v) => !v)}
          >
            <View style={styles.codeBody}>
              <Text style={styles.codeLabel}>Senha de desbloqueio</Text>
              {showCode ? (
                <Text style={styles.codeValue}>{gift.unlockCode}</Text>
              ) : (
                <Text style={styles.codeHidden}>••••</Text>
              )}
            </View>
            {showCode ? (
              <EyeOff size={20} color={Colors.textSecondary} />
            ) : (
              <Eye size={20} color={Colors.textSecondary} />
            )}
          </Pressable>
        </Animated.View>

        {/* Message preview */}
        {gift.message ? (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.msgCard}>
            <MessageCircle size={14} color={Colors.plum} />
            <Text style={styles.msgText} numberOfLines={4}>
              {gift.message}
            </Text>
          </Animated.View>
        ) : null}

        {/* Bottom actions */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.actions}>
          <GradientButton
            label="Voltar para o início"
            onPress={handleBack}
            variant="ghost"
            icon={<ArrowLeft size={18} color={Colors.textPrimary} />}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  topBack: {
    position: "absolute",
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  notFound: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: {
    backgroundColor: Colors.inkCard,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  hero: {
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.inkCard,
    marginBottom: 16,
  },
  heroOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  heroSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  linkCard: {
    backgroundColor: Colors.inkCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 12,
  },
  linkIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  linkUrl: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  linkButtons: {
    flexDirection: "row",
    gap: 10,
  },
  linkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(199,178,206,0.1)",
  },
  linkBtnAlt: {
    backgroundColor: "rgba(143,209,79,0.1)",
    borderWidth: 1,
    borderColor: "rgba(143,209,79,0.25)",
  },
  linkBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  linkBtnTextAlt: {
    color: Colors.rose,
  },
  qrWrapper: {
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  qrCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.rose,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  qrHint: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  codeRow: {
    marginBottom: 16,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.inkCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeBody: {
    gap: 4,
  },
  codeLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeValue: {
    color: Colors.gold,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 6,
  },
  codeHidden: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 8,
  },
  msgCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  msgText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
  actions: {
    gap: 12,
    paddingTop: 4,
  },
});
