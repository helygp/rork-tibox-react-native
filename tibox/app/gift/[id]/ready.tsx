import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowLeft, CheckCircle2, Copy, Eye, EyeOff, Gift, LinkIcon, MessageCircle, Share2 } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";

const WEB_BASE = "https://tibox.aurabr.app/g";

export default function ReadyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const G = useGradients();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useGiftStore();

  const gift = useMemo(() => (id ? getById(id) : undefined), [id, getById]);
  const publicLink = gift ? `${WEB_BASE}/${gift.publicId}` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${encodeURIComponent("220x220")}&data=${encodeURIComponent(publicLink)}&margin=8`;
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.ink },
    center: { alignItems: "center" as const, justifyContent: "center" as const },
    topBack: { position: "absolute" as const, top: 60, left: 16, width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const, zIndex: 10 },
    notFound: { color: C.textSecondary, fontSize: 16 },
    header: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 16, height: 52 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
    backBtnPressed: { backgroundColor: C.inkCard },
    headerTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "700" as const },
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 20, paddingTop: 8 },
    hero: { height: 200, borderRadius: 24, overflow: "hidden" as const, backgroundColor: C.inkCard, marginBottom: 16 },
    heroOverlay: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 10, paddingHorizontal: 32 },
    heroBadge: { width: 56, height: 56, borderRadius: 20, alignItems: "center" as const, justifyContent: "center" as const },
    heroText: { color: C.white, fontSize: 22, fontWeight: "800" as const, textAlign: "center" as const },
    heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center" as const, lineHeight: 20 },
    linkCard: { backgroundColor: C.inkCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16, gap: 12 },
    linkIconRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
    linkLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8 },
    linkUrl: { color: C.textSecondary, fontSize: 14, lineHeight: 21 },
    linkButtons: { flexDirection: "row" as const, gap: 10 },
    linkBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(199,178,206,0.1)" },
    linkBtnAlt: { backgroundColor: "rgba(143,209,79,0.1)", borderWidth: 1, borderColor: "rgba(143,209,79,0.25)" },
    linkBtnText: { color: C.textSecondary, fontSize: 14, fontWeight: "600" as const },
    linkBtnTextAlt: { color: C.rose },
    qrWrapper: { alignItems: "center" as const, marginBottom: 16, gap: 10 },
    qrCard: { backgroundColor: C.white, borderRadius: 24, padding: 20, shadowColor: C.rose, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
    qrImage: { width: 200, height: 200, borderRadius: 8 },
    qrHint: { color: C.textMuted, fontSize: 13, textAlign: "center" as const },
    codeRow: { marginBottom: 16 },
    codeCard: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, backgroundColor: C.inkCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
    codeBody: { gap: 4 },
    codeLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
    codeValue: { color: C.gold, fontSize: 26, fontWeight: "800" as const, letterSpacing: 6 },
    codeHidden: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: 8 },
    msgCard: { flexDirection: "row" as const, gap: 10, backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, alignItems: "flex-start" as const },
    msgText: { color: C.textSecondary, fontSize: 14, lineHeight: 21, flex: 1 },
    actions: { gap: 12, paddingTop: 4 },
  }), [C]);

  const handleCopy = useCallback(async () => { await Clipboard.setStringAsync(publicLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }, [publicLink]);
  const handleShare = useCallback(async () => { try { await Sharing.shareAsync(publicLink, { mimeType: "text/plain", dialogTitle: "Compartilhar presente Tibox" }); } catch {} }, [publicLink]);
  const handleBack = useCallback(() => { router.replace("/(tabs)"); }, [router]);

  if (!gift) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={handleBack} style={styles.topBack}><ArrowLeft size={22} color={C.textSecondary} /></Pressable>
        <Text style={styles.notFound}>Presente não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft size={22} color={C.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Presente pronto!</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          {gift.media[0] ? <Image source={{ uri: gift.media[0].uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <LinearGradient colors={G.hero as readonly [string, string, string]} style={StyleSheet.absoluteFill} />}
          <BlurView intensity={25} style={styles.heroOverlay}>
            <LinearGradient colors={G.brand as readonly [string, string]} style={styles.heroBadge}><CheckCircle2 size={28} color={C.white} /></LinearGradient>
            <Text style={styles.heroText}>Seu presente está pronto!</Text>
            <Text style={styles.heroSub}>Compartilhe o link com {gift.recipientName.split(" ")[0]} agora.</Text>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.linkCard}>
          <View style={styles.linkIconRow}><LinkIcon size={18} color={C.rose} /><Text style={styles.linkLabel}>Link do presente</Text></View>
          <Text style={styles.linkUrl} numberOfLines={2} selectable>{publicLink}</Text>
          <View style={styles.linkButtons}>
            <Pressable onPress={handleCopy} style={styles.linkBtn}>
              {copied ? <CheckCircle2 size={18} color={C.success} /> : <Copy size={18} color={C.textSecondary} />}
              <Text style={styles.linkBtnText}>{copied ? "Copiado!" : "Copiar link"}</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.linkBtn, styles.linkBtnAlt]}>
              <Share2 size={18} color={C.rose} /><Text style={[styles.linkBtnText, styles.linkBtnTextAlt]}>Compartilhar</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.qrWrapper}>
          <View style={styles.qrCard}><Image source={{ uri: qrUrl }} style={styles.qrImage} contentFit="contain" /></View>
          <Text style={styles.qrHint}>Mostre este QR Code para o destinatário escanear</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.codeRow}>
          <Pressable style={styles.codeCard} onPress={() => setShowCode((v) => !v)}>
            <View style={styles.codeBody}>
              <Text style={styles.codeLabel}>Senha de desbloqueio</Text>
              {showCode ? <Text style={styles.codeValue}>{gift.unlockCode}</Text> : <Text style={styles.codeHidden}>••••</Text>}
            </View>
            {showCode ? <EyeOff size={20} color={C.textSecondary} /> : <Eye size={20} color={C.textSecondary} />}
          </Pressable>
        </Animated.View>

        {gift.message ? (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.msgCard}>
            <MessageCircle size={14} color={C.plum} /><Text style={styles.msgText} numberOfLines={4}>{gift.message}</Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.actions}>
          <GradientButton label="Voltar para o início" onPress={handleBack} variant="ghost" icon={<ArrowLeft size={18} color={C.textPrimary} />} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
