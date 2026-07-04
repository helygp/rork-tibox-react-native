import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ArrowLeft, ArrowRight, Calendar, Camera, Check, Clock,
  Film, Gift, ImageOff, ImagePlus, MapPin, MessageCircle, Palette, Sparkles,
  RefreshCw, User, Video, X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import { useColors, useGradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import { PHYSICAL_GIFT_TYPES } from "@/types/gift";
import type { GiftStyle, GiftType, MusicGenre, VideoType } from "@/types/gift";

const STEPS = [
  { icon: Film, label: "Vídeo" },
  { icon: User, label: "Quem" },
  { icon: MessageCircle, label: "Mensagem" },
  { icon: Camera, label: "Mídia" },
  { icon: Gift, label: "Tipo" },
  { icon: Palette, label: "Estilo" },
  { icon: Calendar, label: "Entrega" },
] as const;

const TOTAL_STEPS = STEPS.length;

const STYLES: { key: GiftStyle; label: string; emoji: string; gradient: readonly [string, string] }[] = [
  { key: "romantico", label: "Romântico", emoji: "❤️", gradient: ["#FF6F91", "#C44D6E"] },
  { key: "alegre", label: "Alegre", emoji: "🎉", gradient: ["#F4C77B", "#FF8A6B"] },
  { key: "nostalgico", label: "Nostálgico", emoji: "📸", gradient: ["#7A4D9E", "#A78BFA"] },
  { key: "epico", label: "Épico", emoji: "🔥", gradient: ["#FF8A6B", "#E04835"] },
  { key: "fofo", label: "Fofo", emoji: "🧸", gradient: ["#F9A8D4", "#EC4899"] },
];

const OCCASIONS = ["Aniversário", "Dia dos Namorados", "Pedido de Desculpas", "Saudade", "Conquista", "Sem motivo especial"];

const GENRES: { key: MusicGenre; label: string; emoji: string }[] = [
  { key: "romantica", label: "Romântica", emoji: "🎻" },
  { key: "animada", label: "Animada", emoji: "🎉" },
  { key: "acustica", label: "Acústica", emoji: "🎸" },
  { key: "eletronica", label: "Eletrônica", emoji: "🎹" },
  { key: "instrumental", label: "Instrumental", emoji: "🎼" },
];

const VIDEO_TYPES: { key: VideoType; label: string; emoji: string; desc: string }[] = [
  { key: "cinematic_slideshow", label: "Slideshow Cinematográfico", emoji: "🎬", desc: "2 a 9 fotos com movimento cinematográfico e narração" },
  { key: "living_photo", label: "Foto que Ganha Vida", emoji: "✨", desc: "Uma única foto ganha movimento com IA" },
  { key: "animated_card", label: "Cartão Animado", emoji: "💌", desc: "Cartão animado sem fotos, feito só com a mensagem" },
  { key: "raw_video", label: "Meu Próprio Vídeo", emoji: "🎥", desc: "Seu vídeo com trilha, legendas e enquadramento" },
  { key: "narrated_message", label: "Recado Narrado", emoji: "🎙️", desc: "Só a mensagem, narrada em PT-BR com imagens de banco" },
  { key: "budget_slideshow", label: "Slideshow Simples", emoji: "📸", desc: "Slideshow com fotos, mais leve e rápido" },
];

/** Types that use a 2–9 photo uploader. */
const PHOTO_MULTI_TYPES: readonly VideoType[] = ["cinematic_slideshow", "budget_slideshow"];
/** Types that use exactly one photo. */
const PHOTO_SINGLE_TYPES: readonly VideoType[] = ["living_photo"];
/** Types with no media — the message alone drives the video. */
const NO_MEDIA_VIDEO_TYPES: readonly VideoType[] = ["narrated_message", "animated_card"];

const GIFT_TYPES: { key: GiftType; label: string; emoji: string; desc: string }[] = [
  { key: "digital", label: "Digital", emoji: "✨", desc: "Miniclipe emocional com IA" },
  { key: "flowers", label: "Flores", emoji: "💐", desc: "Buquê físico entregue em casa" },
  { key: "cake", label: "Bolo", emoji: "🎂", desc: "Bolo personalizado" },
  { key: "item", label: "Item", emoji: "🎁", desc: "Presente físico especial" },
  { key: "experience", label: "Experiência", emoji: "🌟", desc: "Jantar, viagem, evento" },
];

/* ── Step Indicator ── */

function StepIndicator({ current }: { current: number }) {
  const C = useColors();
  const styles = useMemo(() => StyleSheet.create({
    stepsRow: { flexDirection: "row" as const, justifyContent: "center" as const, alignItems: "flex-start" as const },
    stepColumn: { alignItems: "center" as const, width: 38 },
    stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.inkCard, borderWidth: 1.5, borderColor: C.border, alignItems: "center" as const, justifyContent: "center" as const },
    stepDotDone: { backgroundColor: C.rose, borderColor: C.rose },
    stepDotActive: { backgroundColor: C.rose, borderColor: C.rose },
    lineWrap: { width: 8, height: 24, alignItems: "center" as const, justifyContent: "center" as const },
    stepLine: { width: 8, height: 1.5, backgroundColor: C.border },
    stepLineDone: { backgroundColor: C.rose },
    stepLabel: { color: C.textMuted, fontSize: 8, fontWeight: "700" as const, textAlign: "center" as const, marginTop: 4, width: 38 },
    stepLabelActive: { color: C.rose },
    stepLabelDone: { color: C.roseSoft },
  }), [C]);

  return (
    <View style={styles.stepsRow}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <View key={i} style={{ flexDirection: "row" as const, alignItems: "flex-start" as const }}>
            <View style={styles.stepColumn}>
              <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                {done ? <Check size={12} color={C.white} /> : <Icon size={12} color={active ? C.white : C.textMuted} />}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]} numberOfLines={1}>{step.label}</Text>
            </View>
            {i < TOTAL_STEPS - 1 && (
              <View style={styles.lineWrap}>
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/* ── Shared nav row ── */

function NavRow({ onNext, onBack, nextLabel, nextDisabled }: { onNext: () => void; onBack: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  const C = useColors();
  return (
    <View style={{ flexDirection: "row" as const, gap: 12, marginTop: "auto" as const, paddingBottom: 20 }}>
      <GradientButton label="Voltar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={C.textPrimary} />} style={{ flex: 1 }} />
      <GradientButton label={nextLabel ?? "Continuar"} onPress={onNext} disabled={nextDisabled} icon={<ArrowRight size={18} color={C.white} />} style={{ flex: 1 }} />
    </View>
  );
}

/* ── Step 1: Video Type ── */

function VideoTypeStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const { draft, updateDraft } = useGiftStore();
  const selected = (draft.videoType as VideoType) ?? "cinematic_slideshow";

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    grid: { gap: 10 },
    card: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14, backgroundColor: C.inkCard, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: C.border },
    cardSelected: { borderColor: C.rose, backgroundColor: "rgba(143,209,79,0.08)" },
    cardDisabled: { opacity: 0.55 },
    cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    emojiWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.inkCardSoft, alignItems: "center" as const, justifyContent: "center" as const },
    emojiWrapSelected: { backgroundColor: "rgba(143,209,79,0.15)" },
    emoji: { fontSize: 24 },
    body: { flex: 1, gap: 2 },
    labelRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, flexWrap: "wrap" as const },
    label: { color: C.textPrimary, fontSize: 15, fontWeight: "700" as const },
    labelSelected: { color: C.rose },
    desc: { color: C.textMuted, fontSize: 12 },
    soonBadge: { backgroundColor: C.inkCardSoft, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    soonText: { color: C.gold, fontSize: 10, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
    check: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.rose, alignItems: "center" as const, justifyContent: "center" as const },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Que tipo de vídeo?</Text>
      <Text style={styles.stepSub}>Escolha como o seu presente ganhará vida.</Text>
      <View style={styles.grid}>
        {VIDEO_TYPES.map((v) => {
          const isSelected = selected === v.key;
          return (
            <Pressable
              key={v.key}
              onPress={() => updateDraft({ videoType: v.key })}
              style={({ pressed }) => [styles.card, isSelected && styles.cardSelected, pressed && styles.cardPressed]}
            >
              <View style={[styles.emojiWrap, isSelected && styles.emojiWrapSelected]}><Text style={styles.emoji}>{v.emoji}</Text></View>
              <View style={styles.body}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, isSelected && styles.labelSelected]}>{v.label}</Text>
                </View>
                <Text style={styles.desc}>{v.desc}</Text>
              </View>
              {isSelected && <View style={styles.check}><Check size={12} color={C.white} /></View>}
            </Pressable>
          );
        })}
      </View>
      <NavRow onNext={onNext} onBack={onBack} />
    </Animated.View>
  );
}

/* ── Step 2: Recipient ── */

function RecipientStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const { draft, updateDraft } = useGiftStore();

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: C.inkCard, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: C.textPrimary, fontSize: 16 },
    chipGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.inkCard, borderWidth: 1, borderColor: C.border },
    chipSelected: { backgroundColor: "rgba(143,209,79,0.15)", borderColor: C.rose },
    chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" as const },
    chipTextSelected: { color: C.rose },
    nextBtn: { marginTop: 32 },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Para quem é o presente?</Text>
      <Text style={styles.stepSub}>Conte um pouco sobre a pessoa especial.</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nome do destinatário</Text>
        <TextInput style={styles.input} placeholder="Ex: Maria" placeholderTextColor={C.textMuted} value={draft.recipientName ?? ""} onChangeText={(t) => updateDraft({ recipientName: t })} autoFocus />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Ocasião</Text>
        <View style={styles.chipGrid}>
          {OCCASIONS.map((occ) => {
            const selected = draft.occasion === occ;
            return (
              <Pressable key={occ} onPress={() => updateDraft({ occasion: selected ? undefined : occ })} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{occ}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <NavRow onNext={onNext} onBack={onBack} nextDisabled={!draft.recipientName?.trim()} />
    </Animated.View>
  );
}

/* ── Step 3: Message ── */

function MessageStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const { draft, updateDraft } = useGiftStore();
  const videoType = (draft.videoType as VideoType) ?? "cinematic_slideshow";
  const messageRequired = NO_MEDIA_VIDEO_TYPES.includes(videoType);

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    fieldGroup: { marginBottom: 20 },
    input: { backgroundColor: C.inkCard, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: C.textPrimary, fontSize: 16 },
    textArea: { minHeight: 120, paddingTop: 14 },
    charCount: { color: C.textMuted, fontSize: 12, textAlign: "right" as const, marginTop: 6, marginRight: 4 },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Escreva sua mensagem</Text>
      <Text style={styles.stepSub}>O que você gostaria de dizer?</Text>
      <View style={styles.fieldGroup}>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Escreva aqui sua mensagem especial..." placeholderTextColor={C.textMuted} value={draft.message ?? ""} onChangeText={(t) => updateDraft({ message: t })} multiline numberOfLines={5} textAlignVertical="top" autoFocus />
        <Text style={styles.charCount}>{(draft.message ?? "").length} caracteres</Text>
      </View>
      <NavRow onNext={onNext} onBack={onBack} nextDisabled={messageRequired && !draft.message?.trim()} />
    </Animated.View>
  );
}

/* ── Step 4: Media ── */

function MediaStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const G = useGradients();
  const { draft, updateDraft } = useGiftStore();
  const media = draft.media ?? [];
  const videoType = (draft.videoType as VideoType) ?? "cinematic_slideshow";

  const isSingle = PHOTO_SINGLE_TYPES.includes(videoType);
  const usesPhotos = PHOTO_MULTI_TYPES.includes(videoType) || isSingle;
  const isRawVideo = videoType === "raw_video";
  const noPhotos = NO_MEDIA_VIDEO_TYPES.includes(videoType);

  const minPhotos = isSingle ? 1 : 2;
  const maxPhotos = isSingle ? 1 : 9;
  const photoCount = media.filter((m) => m.kind === "image").length;
  const photosValid = !usesPhotos || (photoCount >= minPhotos && photoCount <= maxPhotos);
  const rawVideo = media.find((m) => m.kind === "video");
  const nextDisabled = (usesPhotos && !photosValid) || (isRawVideo && !rawVideo);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: !isSingle, selectionLimit: isSingle ? 1 : 9 });
    if (result.canceled || !result.assets) return;
    const added = result.assets.map((a) => ({ id: Math.random().toString(36).slice(2), uri: a.uri, kind: "image" as const }));
    if (isSingle) { updateDraft({ media: added.slice(0, 1) }); return; }
    const current = (draft.media ?? []).filter((m) => m.kind === "image");
    updateDraft({ media: [...current, ...added].slice(0, 9) });
  }, [draft.media, updateDraft, isSingle]);

  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.8, allowsMultipleSelection: false, videoMaxDuration: 30 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (typeof asset.duration === "number" && asset.duration > 31) {
      Alert.alert("Vídeo muito longo", "Escolha um vídeo de até 30 segundos.");
      return;
    }
    updateDraft({ media: [{ id: Math.random().toString(36).slice(2), uri: asset.uri, kind: "video" as const }] });
  }, [updateDraft]);

  const removeMedia = useCallback((id: string) => { updateDraft({ media: media.filter((m) => m.id !== id) }); }, [media, updateDraft]);

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    mediaGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10 },
    mediaThumb: { width: 92, height: 92, borderRadius: 14, overflow: "hidden" as const, backgroundColor: C.inkCard },
    mediaVideoLabel: { color: C.white, fontSize: 28, textAlign: "center" as const, lineHeight: 92 },
    mediaRemove: { position: "absolute" as const, top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center" as const, justifyContent: "center" as const },
    mediaAdd: { width: 92, height: 92, borderRadius: 14, borderWidth: 2, borderColor: C.border, borderStyle: "dashed" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 4 },
    mediaAddText: { color: C.rose, fontSize: 11, fontWeight: "600" as const },
    countHint: { color: C.textMuted, fontSize: 12, marginTop: 12, marginLeft: 4 },
    countHintWarn: { color: C.gold },
    noticeCard: { flexDirection: "row" as const, gap: 14, alignItems: "center" as const, backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
    noticeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(143,209,79,0.12)", alignItems: "center" as const, justifyContent: "center" as const },
    noticeBody: { flex: 1, gap: 2 },
    noticeTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "700" as const },
    noticeText: { color: C.textMuted, fontSize: 13, lineHeight: 18 },
    videoTile: { width: "100%" as const, height: 200, borderRadius: 18, overflow: "hidden" as const, backgroundColor: C.inkCard },
    videoAdd: { width: "100%" as const, height: 200, borderRadius: 18, borderWidth: 2, borderColor: C.border, borderStyle: "dashed" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8 },
    videoAddText: { color: C.rose, fontSize: 14, fontWeight: "700" as const },
    videoAddHint: { color: C.textMuted, fontSize: 12 },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      {noPhotos ? (
        <>
          <Text style={styles.stepTitle}>Sem fotos necessárias</Text>
          <Text style={styles.stepSub}>Este formato não usa suas fotos.</Text>
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}><ImageOff size={20} color={C.rose} /></View>
            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle}>Sem fotos</Text>
              <Text style={styles.noticeText}>Vamos usar imagens que combinam com o clima escolhido.</Text>
            </View>
          </View>
        </>
      ) : isRawVideo ? (
        <>
          <Text style={styles.stepTitle}>Envie seu vídeo</Text>
          <Text style={styles.stepSub}>Um vídeo de até 30 segundos (MP4 ou MOV).</Text>
          {rawVideo ? (
            <View style={styles.videoTile}>
              <LinearGradient colors={G.brandDeep as readonly [string, string]} style={StyleSheet.absoluteFill}><Text style={[styles.mediaVideoLabel, { lineHeight: 200 }]}>🎥</Text></LinearGradient>
              <Pressable style={styles.mediaRemove} onPress={() => removeMedia(rawVideo.id)}><X size={12} color={C.white} /></Pressable>
            </View>
          ) : (
            <Pressable onPress={pickVideo} style={styles.videoAdd}>
              <Video size={32} color={C.rose} />
              <Text style={styles.videoAddText}>Selecionar vídeo</Text>
              <Text style={styles.videoAddHint}>Máx. 30s · MP4/MOV</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <Text style={styles.stepTitle}>{isSingle ? "Adicione sua foto" : "Adicione suas fotos"}</Text>
          <Text style={styles.stepSub}>{isSingle ? "Escolha 1 foto que vai ganhar vida com IA." : "Escolha de 2 a 9 fotos para o seu clipe."}</Text>
          <View style={styles.mediaGrid}>
            {media.filter((m) => m.kind === "image").map((m) => (
              <View key={m.id} style={styles.mediaThumb}>
                <Image source={{ uri: m.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <Pressable style={styles.mediaRemove} onPress={() => removeMedia(m.id)}><X size={12} color={C.white} /></Pressable>
              </View>
            ))}
            {photoCount < maxPhotos && (
              <Pressable onPress={pickImage} style={styles.mediaAdd}><ImagePlus size={28} color={C.rose} /><Text style={styles.mediaAddText}>Adicionar</Text></Pressable>
            )}
          </View>
          <Text style={[styles.countHint, !photosValid && styles.countHintWarn]}>
            {isSingle
              ? `${photoCount}/1 foto ${photoCount < 1 ? "· adicione 1 foto" : ""}`
              : `${photoCount}/9 fotos ${photoCount < 2 ? "· adicione ao menos 2" : ""}`}
          </Text>
        </>
      )}
      <NavRow onNext={onNext} onBack={onBack} nextDisabled={nextDisabled} />
    </Animated.View>
  );
}

/* ── Step 4: Gift Type ── */

function TypeStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const { draft, updateDraft } = useGiftStore();
  const selectedType = (draft.type as GiftType) ?? "digital";
  const isPhysical = PHYSICAL_GIFT_TYPES.includes(selectedType);
  const cityValid = !isPhysical || !!draft.city?.trim();

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    typeGrid: { gap: 10 },
    typeCard: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14, backgroundColor: C.inkCard, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: C.border },
    typeCardSelected: { borderColor: C.rose, backgroundColor: "rgba(143,209,79,0.08)" },
    typeCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    typeEmojiWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.inkCardSoft, alignItems: "center" as const, justifyContent: "center" as const },
    typeEmojiWrapSelected: { backgroundColor: "rgba(143,209,79,0.15)" },
    typeEmoji: { fontSize: 24 },
    typeBody: { flex: 1, gap: 2 },
    typeLabel: { color: C.textPrimary, fontSize: 15, fontWeight: "700" as const },
    typeLabelSelected: { color: C.rose },
    typeDesc: { color: C.textMuted, fontSize: 12 },
    typeCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.rose, alignItems: "center" as const, justifyContent: "center" as const },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
    cityInputWrap: { flexDirection: "row" as const, alignItems: "center" as const, backgroundColor: C.inkCard, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14 },
    cityIcon: { marginRight: 8 },
    cityInput: { flex: 1, paddingVertical: 14, color: C.textPrimary, fontSize: 16 },
    cityHint: { color: C.textMuted, fontSize: 12, marginTop: 6, marginLeft: 4 },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Que tipo de presente?</Text>
      <Text style={styles.stepSub}>Escolha o formato da sua surpresa.</Text>
      <View style={styles.typeGrid}>
        {GIFT_TYPES.map((t) => {
          const selected = selectedType === t.key;
          return (
            <Pressable key={t.key} onPress={() => updateDraft({ type: t.key })} style={({ pressed }) => [styles.typeCard, selected && styles.typeCardSelected, pressed && styles.typeCardPressed]}>
              <View style={[styles.typeEmojiWrap, selected && styles.typeEmojiWrapSelected]}><Text style={styles.typeEmoji}>{t.emoji}</Text></View>
              <View style={styles.typeBody}>
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{t.label}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              {selected && <View style={styles.typeCheck}><Check size={12} color={C.white} /></View>}
            </Pressable>
          );
        })}
      </View>
      {isPhysical && (
        <Animated.View entering={FadeInDown.springify()} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Cidade de entrega</Text>
          <View style={styles.cityInputWrap}><MapPin size={16} color={C.rose} style={styles.cityIcon} /><TextInput style={styles.cityInput} placeholder="Ex: São Paulo, SP" placeholderTextColor={C.textMuted} value={draft.city ?? ""} onChangeText={(t) => updateDraft({ city: t })} /></View>
          <Text style={styles.cityHint}>Necessária para entregar este presente físico.</Text>
        </Animated.View>
      )}
      <NavRow onNext={onNext} onBack={onBack} nextDisabled={!cityValid} />
    </Animated.View>
  );
}

/* ── Step 5: Style ── */

function StyleStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const { draft, updateDraft } = useGiftStore();

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    styleGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 12 },
    styleCard: { width: "31%" as const, flexGrow: 1, flexBasis: "31%" as const, borderRadius: 18, overflow: "hidden" as const, borderWidth: 2, borderColor: C.border },
    styleCardSelected: { borderColor: C.rose },
    styleCardPressed: { opacity: 0.85 },
    styleCardInner: { paddingVertical: 22, paddingHorizontal: 8, alignItems: "center" as const, justifyContent: "center" as const, gap: 10, minHeight: 100 },
    styleEmoji: { fontSize: 30 },
    styleLabel: { color: C.textSecondary, fontSize: 13, fontWeight: "700" as const, textAlign: "center" as const },
    styleLabelSelected: { color: C.white },
    styleCheck: { position: "absolute" as const, top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center" as const, justifyContent: "center" as const },
    fieldGroup: { marginTop: 28, marginBottom: 20 },
    fieldLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
    chipGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10 },
    chip: { flexGrow: 1, flexBasis: "30%" as const, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: C.inkCard, borderWidth: 1, borderColor: C.border },
    chipSelected: { backgroundColor: "rgba(143,209,79,0.15)", borderColor: C.rose },
    chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" as const, textAlign: "center" as const },
    chipTextSelected: { color: C.rose },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Escolha o estilo</Text>
      <Text style={styles.stepSub}>Qual vibe combina com o presente?</Text>
      <View style={styles.styleGrid}>
        {STYLES.map((s) => {
          const selected = draft.style === s.key;
          return (
            <Pressable key={s.key} onPress={() => updateDraft({ style: s.key })} style={({ pressed }) => [styles.styleCard, selected && styles.styleCardSelected, pressed && styles.styleCardPressed]}>
              <LinearGradient colors={selected ? s.gradient : [C.inkCard, C.inkCardSoft]} style={styles.styleCardInner}>
                <Text style={styles.styleEmoji}>{s.emoji}</Text>
                <Text style={[styles.styleLabel, selected && styles.styleLabelSelected]}>{s.label}</Text>
                {selected && <View style={styles.styleCheck}><Check size={14} color={C.white} /></View>}
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Trilha sonora</Text>
        <View style={styles.chipGrid}>
          {GENRES.map((g) => {
            const selected = draft.genre === g.key;
            return (
              <Pressable key={g.key} onPress={() => updateDraft({ genre: selected ? undefined : g.key })} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g.emoji} {g.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <NavRow onNext={onNext} onBack={onBack} />
    </Animated.View>
  );
}

/* ── Step 6: Delivery ── */

function DeliveryStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const C = useColors();
  const { draft, updateDraft } = useGiftStore();
  const deliveryMode = draft.deliveryMode ?? "now";
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scheduledDate = draft.scheduledFor ? new Date(draft.scheduledFor) : new Date(Date.now() + 86_400_000);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selected) { updateDraft({ scheduledFor: selected.toISOString() }); if (Platform.OS === "android") setTimeout(() => setShowTimePicker(true), 600); }
  }, [updateDraft]);

  const handleTimeChange = useCallback((_event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selected) updateDraft({ scheduledFor: selected.toISOString() });
  }, [updateDraft]);

  const formattedDate = scheduledDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" });
  const formattedTime = scheduledDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    toggleRow: { flexDirection: "row" as const, gap: 10, marginBottom: 20 },
    toggleBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: C.inkCard, borderWidth: 1, borderColor: C.border },
    toggleBtnActive: { backgroundColor: C.rose, borderColor: C.rose },
    toggleText: { color: C.textMuted, fontSize: 15, fontWeight: "700" as const },
    toggleTextActive: { color: C.white },
    scheduleCard: { backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, gap: 12 },
    scheduleLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8 },
    scheduleRow: { flexDirection: "row" as const, gap: 10 },
    scheduleBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "rgba(199,178,206,0.08)", borderWidth: 1, borderColor: C.border },
    scheduleBtnTime: { flex: 0.6 },
    scheduleBtnPressed: { backgroundColor: "rgba(199,178,206,0.15)" },
    scheduleBtnText: { color: C.textPrimary, fontSize: 13, fontWeight: "600" as const, textTransform: "capitalize" as const, flexShrink: 1 },
    switchRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
    switchBody: { flex: 1, gap: 2 },
    switchLabel: { color: C.textPrimary, fontSize: 15, fontWeight: "600" as const },
    switchHint: { color: C.textMuted, fontSize: 12 },
    switchTrack: { width: 48, height: 28, borderRadius: 14, backgroundColor: C.border, justifyContent: "center" as const, paddingHorizontal: 3 },
    switchTrackOn: { backgroundColor: C.rose },
    switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, alignSelf: "flex-start" as const },
    switchThumbOn: { alignSelf: "flex-end" as const },
    codePreview: { backgroundColor: C.inkCard, borderRadius: 16, padding: 20, alignItems: "center" as const, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    codePreviewLabel: { color: C.textMuted, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 12 },
    codeInput: { alignSelf: "stretch" as const, backgroundColor: C.inkCardSoft, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, color: C.gold, fontSize: 30, fontWeight: "800" as const, letterSpacing: 10, textAlign: "center" as const, marginBottom: 12 },
    codeSuggest: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "rgba(143,209,79,0.12)", borderWidth: 1, borderColor: C.rose, alignSelf: "center" as const, marginBottom: 4 },
    codeSuggestText: { color: C.rose, fontSize: 13, fontWeight: "700" as const },
    codePreviewHint: { color: C.textMuted, fontSize: 12, textAlign: "center" as const },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Como entregar?</Text>
      <Text style={styles.stepSub}>Escolha quando o presente será liberado.</Text>
      <View style={styles.toggleRow}>
        <Pressable onPress={() => updateDraft({ deliveryMode: "now" })} style={[styles.toggleBtn, deliveryMode === "now" && styles.toggleBtnActive]}>
          <Sparkles size={16} color={deliveryMode === "now" ? C.white : C.textMuted} /><Text style={[styles.toggleText, deliveryMode === "now" && styles.toggleTextActive]}>Agora</Text>
        </Pressable>
        <Pressable onPress={() => updateDraft({ deliveryMode: "scheduled" })} style={[styles.toggleBtn, deliveryMode === "scheduled" && styles.toggleBtnActive]}>
          <Calendar size={16} color={deliveryMode === "scheduled" ? C.white : C.textMuted} /><Text style={[styles.toggleText, deliveryMode === "scheduled" && styles.toggleTextActive]}>Agendar</Text>
        </Pressable>
      </View>
      {deliveryMode === "scheduled" && (
        <Animated.View entering={FadeInDown.springify()} style={styles.scheduleCard}>
          <Text style={styles.scheduleLabel}>Data e hora da entrega</Text>
          <View style={styles.scheduleRow}>
            <Pressable onPress={() => setShowPicker(true)} style={({ pressed }) => [styles.scheduleBtn, pressed && styles.scheduleBtnPressed]}>
              <Calendar size={16} color={C.roseSoft} /><Text style={styles.scheduleBtnText} numberOfLines={1}>{formattedDate}</Text>
            </Pressable>
            <Pressable onPress={() => setShowTimePicker(true)} style={({ pressed }) => [styles.scheduleBtn, styles.scheduleBtnTime, pressed && styles.scheduleBtnPressed]}>
              <Clock size={16} color={C.gold} /><Text style={styles.scheduleBtnText} numberOfLines={1}>{formattedTime}</Text>
            </Pressable>
          </View>
          {showPicker && <DateTimePicker value={scheduledDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={handleDateChange} minimumDate={new Date()} maximumDate={new Date(Date.now() + 365 * 86_400_000)} />}
          {showTimePicker && <DateTimePicker value={scheduledDate} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={handleTimeChange} />}
        </Animated.View>
      )}
      <Pressable style={styles.switchRow} onPress={() => updateDraft({ notifyWhatsapp: !draft.notifyWhatsapp })}>
        <View style={styles.switchBody}><Text style={styles.switchLabel}>Notificar por WhatsApp</Text><Text style={styles.switchHint}>Envia link automaticamente</Text></View>
        <View style={[styles.switchTrack, draft.notifyWhatsapp && styles.switchTrackOn]}><View style={[styles.switchThumb, draft.notifyWhatsapp && styles.switchThumbOn]} /></View>
      </Pressable>
      <View style={styles.codePreview}>
        <Text style={styles.codePreviewLabel}>Senha de desbloqueio</Text>
        <TextInput
          style={styles.codeInput}
          value={draft.unlockCode ?? ""}
          onChangeText={(t) => updateDraft({ unlockCode: t.replace(/[^0-9]/g, "").slice(0, 4) })}
          placeholder="0000"
          placeholderTextColor={C.textMuted}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Pressable onPress={() => updateDraft({ unlockCode: String(Math.floor(1000 + Math.random() * 9000)) })} style={styles.codeSuggest}>
          <RefreshCw size={15} color={C.rose} /><Text style={styles.codeSuggestText}>Sugerir código</Text>
        </Pressable>
        <Text style={styles.codePreviewHint}>Digite 4 dígitos ou toque em Sugerir. O destinatário usará este código para abrir o presente.</Text>
      </View>
      <NavRow onNext={onNext} onBack={onBack} nextLabel="Revisar" />
    </Animated.View>
  );
}

/* ── Step 7: Review ── */

function ReviewStep({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const C = useColors();
  const { draft, finalizeGift, resetDraft } = useGiftStore();
  const [finalizing, setFinalizing] = useState(false);

  const styleMeta = STYLES.find((s) => s.key === (draft.style ?? "romantico")) ?? STYLES[0];

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      const gift = await finalizeGift();
      resetDraft();
      setFinalizing(false);
      // Fluxo automático. Para "Meu Próprio Vídeo" (raw_video) o vídeo enviado
      // já é o clipe final — vai direto para a tela de entrega. Os demais tipos
      // passam pelo loader de geração, que faz polling e navega quando pronto.
      if (gift) {
        const alreadyDone = gift.status === "ready" || gift.status === "scheduled";
        router.replace(alreadyDone ? `/gift/${gift.id}/ready` : `/gift/${gift.id}/generating`);
      }
    } catch (e) {
      setFinalizing(false);
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("PLAN_LIMIT")) {
        Alert.alert(
          "Limite do plano Free",
          "Seu plano Free permite 1 presente por mês. Faça upgrade para o Pro para criar presentes ilimitados.",
          [
            { text: "Agora não", style: "cancel" },
            { text: "Ver planos", onPress: () => router.push("/upgrade") },
          ],
        );
      } else {
        Alert.alert("Erro", msg || "Não foi possível criar o presente. Tente novamente.");
      }
    }
  }, [finalizeGift, resetDraft, router]);

  const styles = useMemo(() => StyleSheet.create({
    stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    stepTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 6 },
    stepSub: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 28 },
    reviewScroll: { flex: 1 },
    reviewContent: { gap: 12, paddingBottom: 8 },
    reviewCard: { flexDirection: "row" as const, gap: 14, backgroundColor: C.inkCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: "center" as const },
    reviewCardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(143,209,79,0.12)", alignItems: "center" as const, justifyContent: "center" as const },
    reviewCardLabel: { color: C.textMuted, fontSize: 11, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 2 },
    reviewCardValue: { color: C.textPrimary, fontSize: 15, fontWeight: "600" as const },
    reviewCardHint: { color: C.textSecondary, fontSize: 13, marginTop: 2 },
    flex1: { flex: 1 },
    reviewFooter: { gap: 10, paddingBottom: 20, marginTop: 16 },
  }), [C]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Revisar presente</Text>
      <Text style={styles.stepSub}>Confira os detalhes antes de criar.</Text>
      <ScrollView style={styles.reviewScroll} contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}><User size={16} color={C.rose} /></View>
          <View><Text style={styles.reviewCardLabel}>Para</Text><Text style={styles.reviewCardValue}>{draft.recipientName ?? "—"}</Text>{draft.occasion && <Text style={styles.reviewCardHint}>{draft.occasion}</Text>}</View>
        </View>
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}><MessageCircle size={16} color={C.plum} /></View>
          <View style={styles.flex1}><Text style={styles.reviewCardLabel}>Mensagem</Text><Text style={styles.reviewCardValue} numberOfLines={3}>{draft.message || "Sem mensagem"}</Text></View>
        </View>
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}><Camera size={16} color={C.gold} /></View>
          <View style={styles.flex1}><Text style={styles.reviewCardLabel}>Mídias</Text><Text style={styles.reviewCardValue}>{(draft.media ?? []).length === 0 ? "Nenhuma mídia" : `${(draft.media ?? []).length} mídia(s)`}</Text></View>
        </View>
        <View style={styles.reviewCard}>
          <LinearGradient colors={styleMeta.gradient} style={styles.reviewCardIcon}><Palette size={16} color={C.white} /></LinearGradient>
          <View style={styles.flex1}><Text style={styles.reviewCardLabel}>Estilo</Text><Text style={styles.reviewCardValue}>{styleMeta.emoji} {styleMeta.label}</Text>{draft.genre && <Text style={styles.reviewCardHint}>Trilha: {GENRES.find((g) => g.key === draft.genre)?.label}</Text>}</View>
        </View>
        {draft.city ? (
          <View style={styles.reviewCard}>
            <View style={styles.reviewCardIcon}><MapPin size={16} color={C.coral} /></View>
            <View style={styles.flex1}><Text style={styles.reviewCardLabel}>Cidade de entrega</Text><Text style={styles.reviewCardValue}>{draft.city}</Text></View>
          </View>
        ) : null}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}><Calendar size={16} color={C.coral} /></View>
          <View style={styles.flex1}><Text style={styles.reviewCardLabel}>Entrega</Text><Text style={styles.reviewCardValue}>{draft.deliveryMode === "scheduled" ? "Agendada" : "Imediata"}</Text><Text style={styles.reviewCardHint}>Senha: {draft.unlockCode}</Text></View>
        </View>
      </ScrollView>
      <View style={styles.reviewFooter}>
        <GradientButton label={finalizing ? "Criando presente..." : "Criar presente"} onPress={handleFinalize} loading={finalizing} icon={<Gift size={18} color={C.white} />} />
        <GradientButton label="Ajustar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={C.textPrimary} />} />
      </View>
    </Animated.View>
  );
}

/* ── Main Create Screen ── */

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const { resetDraft } = useGiftStore();
  const [step, setStep] = useState(0);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const goBack = useCallback(() => {
    if (step === 0) { resetDraft(); router.back(); }
    else setStep((s) => s - 1);
  }, [step, resetDraft, router]);

  const styles = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.ink },
    header: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 16, height: 52 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
    backBtnPressed: { backgroundColor: C.inkCard },
    headerTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "700" as const },
    stepsWrap: { paddingHorizontal: 20, marginBottom: 8 },
    stepBody: { flex: 1 },
  }), [C]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft size={22} color={C.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Novo presente</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.stepsWrap}><StepIndicator current={step} /></View>

      <Animated.ScrollView
        key={step}
        entering={FadeInRight.springify()}
        exiting={FadeOutLeft}
        style={styles.stepBody}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <VideoTypeStep onNext={goNext} onBack={goBack} />}
        {step === 1 && <RecipientStep onNext={goNext} onBack={goBack} />}
        {step === 2 && <MessageStep onNext={goNext} onBack={goBack} />}
        {step === 3 && <MediaStep onNext={goNext} onBack={goBack} />}
        {step === 4 && <TypeStep onNext={goNext} onBack={goBack} />}
        {step === 5 && <StyleStep onNext={goNext} onBack={goBack} />}
        {step === 6 && <DeliveryStep onNext={goNext} onBack={goBack} />}
        {step === 7 && <ReviewStep onBack={goBack} />}
      </Animated.ScrollView>
    </View>
  );
}
