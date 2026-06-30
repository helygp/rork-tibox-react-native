import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Gift,
  ImagePlus,
  MapPin,
  MessageCircle,
  Music,
  Palette,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/GradientButton";
import Colors, { Gradients } from "@/constants/colors";
import { useGiftStore } from "@/providers/GiftStore";
import { PHYSICAL_GIFT_TYPES } from "@/types/gift";
import type { GiftStyle, GiftType, MusicGenre } from "@/types/gift";

const STEPS = [
  { icon: User, label: "Quem" },
  { icon: MessageCircle, label: "Mensagem" },
  { icon: Camera, label: "Mídia" },
  { icon: Gift, label: "Tipo" },
  { icon: Palette, label: "Estilo" },
  { icon: Calendar, label: "Entrega" },
] as const;

const TOTAL_STEPS = STEPS.length;

const STYLES: { key: GiftStyle; label: string; emoji: string; gradient: readonly [string, string] }[] = [
  { key: "romantico", label: "Romântico", emoji: "❤️", gradient: ["#FF6F91", "#C44D6E"] as const },
  { key: "alegre", label: "Alegre", emoji: "🎉", gradient: ["#F4C77B", "#FF8A6B"] as const },
  { key: "nostalgico", label: "Nostálgico", emoji: "📸", gradient: ["#7A4D9E", "#A78BFA"] as const },
  { key: "epico", label: "Épico", emoji: "🔥", gradient: ["#FF8A6B", "#E04835"] as const },
  { key: "fofo", label: "Fofo", emoji: "🧸", gradient: ["#F9A8D4", "#EC4899"] as const },
];

const OCCASIONS = [
  "Aniversário",
  "Dia dos Namorados",
  "Pedido de Desculpas",
  "Saudade",
  "Conquista",
  "Sem motivo especial",
];

const GENRES: { key: MusicGenre; label: string; emoji: string }[] = [
  { key: "romantica", label: "Romântica", emoji: "🎻" },
  { key: "animada", label: "Animada", emoji: "🎉" },
  { key: "acustica", label: "Acústica", emoji: "🎸" },
  { key: "eletronica", label: "Eletrônica", emoji: "🎹" },
  { key: "instrumental", label: "Instrumental", emoji: "🎼" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.stepsRow}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <View key={i} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                done && styles.stepDotDone,
                active && styles.stepDotActive,
              ]}
            >
              {done ? (
                <Check size={12} color={Colors.white} />
              ) : (
                <Icon size={12} color={active ? Colors.white : Colors.textMuted} />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                active && styles.stepLabelActive,
                done && styles.stepLabelDone,
              ]}
            >
              {step.label}
            </Text>
            {i < TOTAL_STEPS - 1 && (
              <View
                style={[
                  styles.stepLine,
                  done && styles.stepLineDone,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

/* ── Step 1: Recipient ── */
function RecipientStep({
  onNext,
}: {
  onNext: () => void;
}) {
  const { draft, updateDraft } = useGiftStore();

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Para quem é o presente?</Text>
      <Text style={styles.stepSub}>Conte um pouco sobre a pessoa especial.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nome do destinatário</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Maria"
          placeholderTextColor={Colors.textMuted}
          value={draft.recipientName ?? ""}
          onChangeText={(t) => updateDraft({ recipientName: t })}
          autoFocus
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Ocasião</Text>
        <View style={styles.chipGrid}>
          {OCCASIONS.map((occ) => {
            const selected = draft.occasion === occ;
            return (
              <Pressable
                key={occ}
                onPress={() => updateDraft({ occasion: selected ? undefined : occ })}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {occ}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <GradientButton
        label="Continuar"
        onPress={onNext}
        icon={<ArrowRight size={18} color={Colors.white} />}
        disabled={!draft.recipientName?.trim()}
        style={styles.nextBtn}
      />
    </Animated.View>
  );
}

/* ── Step 2: Message ── */
function MessageStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { draft, updateDraft } = useGiftStore();

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Escreva sua mensagem</Text>
      <Text style={styles.stepSub}>O que você gostaria de dizer?</Text>

      <View style={styles.fieldGroup}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escreva aqui sua mensagem especial..."
          placeholderTextColor={Colors.textMuted}
          value={draft.message ?? ""}
          onChangeText={(t) => updateDraft({ message: t })}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          autoFocus
        />
        <Text style={styles.charCount}>
          {(draft.message ?? "").length} caracteres
        </Text>
      </View>

      <View style={styles.navRow}>
        <GradientButton label="Voltar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={Colors.textPrimary} />} style={styles.navHalf} />
        <GradientButton label="Continuar" onPress={onNext} icon={<ArrowRight size={18} color={Colors.white} />} style={styles.navHalf} />
      </View>
    </Animated.View>
  );
}

/* ── Step 3: Media ── */
function MediaStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { draft, updateDraft } = useGiftStore();
  const media = draft.media ?? [];

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled || !result.assets) return;

    const current = draft.media ?? [];
    const added = result.assets.map((a) => ({
      id: Math.random().toString(36).slice(2),
      uri: a.uri,
      kind: a.type === "video" ? "video" as const : "image" as const,
    }));
    updateDraft({ media: [...current, ...added] });
  }, [draft.media, updateDraft]);

  const removeMedia = useCallback(
    (id: string) => {
      updateDraft({ media: media.filter((m) => m.id !== id) });
    },
    [media, updateDraft],
  );

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Adicione fotos e vídeos</Text>
      <Text style={styles.stepSub}>
        Essas mídias serão usadas no miniclipe emocional.
      </Text>

      <View style={styles.mediaGrid}>
        {media.map((m, idx) => (
          <View key={m.id} style={styles.mediaThumb}>
            {m.kind === "image" ? (
              <Image source={{ uri: m.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <LinearGradient colors={Gradients.brandDeep} style={StyleSheet.absoluteFill}>
                <Text style={styles.mediaVideoLabel}>🎬</Text>
              </LinearGradient>
            )}
            <Pressable
              style={styles.mediaRemove}
              onPress={() => removeMedia(m.id)}
            >
              <X size={12} color={Colors.white} />
            </Pressable>
          </View>
        ))}
        <Pressable onPress={pickImage} style={styles.mediaAdd}>
          <ImagePlus size={28} color={Colors.rose} />
          <Text style={styles.mediaAddText}>Adicionar</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <GradientButton label="Voltar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={Colors.textPrimary} />} style={styles.navHalf} />
        <GradientButton label="Continuar" onPress={onNext} icon={<ArrowRight size={18} color={Colors.white} />} style={styles.navHalf} />
      </View>
    </Animated.View>
  );
}

const GIFT_TYPES: { key: GiftType; label: string; emoji: string; desc: string }[] = [
  { key: "digital", label: "Digital", emoji: "✨", desc: "Miniclipe emocional com IA" },
  { key: "flowers", label: "Flores", emoji: "💐", desc: "Buquê físico entregue em casa" },
  { key: "cake", label: "Bolo", emoji: "🎂", desc: "Bolo personalizado" },
  { key: "item", label: "Item", emoji: "🎁", desc: "Presente físico especial" },
  { key: "experience", label: "Experiência", emoji: "🌟", desc: "Jantar, viagem, evento" },
];

/* ── Step 4: Gift Type ── */
function TypeStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { draft, updateDraft } = useGiftStore();
  const selectedType = (draft.type as GiftType) ?? "digital";
  const isPhysical = PHYSICAL_GIFT_TYPES.includes(selectedType);
  const cityValid = !isPhysical || !!draft.city?.trim();

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Que tipo de presente?</Text>
      <Text style={styles.stepSub}>Escolha o formato da sua surpresa.</Text>

      <View style={styles.typeGrid}>
        {GIFT_TYPES.map((t) => {
          const selected = selectedType === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => updateDraft({ type: t.key })}
              style={({ pressed }) => [
                styles.typeCard,
                selected && styles.typeCardSelected,
                pressed && styles.typeCardPressed,
              ]}
            >
              <View style={[styles.typeEmojiWrap, selected && styles.typeEmojiWrapSelected]}>
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
              </View>
              <View style={styles.typeBody}>
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                  {t.label}
                </Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              {selected && (
                <View style={styles.typeCheck}>
                  <Check size={12} color={Colors.white} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {isPhysical && (
        <Animated.View entering={FadeInDown.springify()} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Cidade de entrega</Text>
          <View style={styles.cityInputWrap}>
            <MapPin size={16} color={Colors.rose} style={styles.cityIcon} />
            <TextInput
              style={styles.cityInput}
              placeholder="Ex: São Paulo, SP"
              placeholderTextColor={Colors.textMuted}
              value={draft.city ?? ""}
              onChangeText={(t) => updateDraft({ city: t })}
            />
          </View>
          <Text style={styles.cityHint}>
            Necessária para entregar este presente físico.
          </Text>
        </Animated.View>
      )}

      <View style={styles.navRow}>
        <GradientButton label="Voltar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={Colors.textPrimary} />} style={styles.navHalf} />
        <GradientButton label="Continuar" onPress={onNext} disabled={!cityValid} icon={<ArrowRight size={18} color={Colors.white} />} style={styles.navHalf} />
      </View>
    </Animated.View>
  );
}

/* ── Step 5: Style ── */
function StyleStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { draft, updateDraft } = useGiftStore();

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Escolha o estilo</Text>
      <Text style={styles.stepSub}>Qual vibe combina com o presente?</Text>

      <View style={styles.styleGrid}>
        {STYLES.map((s) => {
          const selected = draft.style === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => updateDraft({ style: s.key })}
              style={({ pressed }) => [
                styles.styleCard,
                selected && styles.styleCardSelected,
                pressed && styles.styleCardPressed,
              ]}
            >
              <LinearGradient
                colors={selected ? s.gradient : ["#2A1E30", "#2A1E30"]}
                style={styles.styleCardInner}
              >
                <Text style={styles.styleEmoji}>{s.emoji}</Text>
                <Text style={[styles.styleLabel, selected && styles.styleLabelSelected]}>
                  {s.label}
                </Text>
                {selected && (
                  <View style={styles.styleCheck}>
                    <Check size={14} color={Colors.white} />
                  </View>
                )}
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
              <Pressable
                key={g.key}
                onPress={() => updateDraft({ genre: selected ? undefined : g.key })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {g.emoji} {g.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.navRow}>
        <GradientButton label="Voltar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={Colors.textPrimary} />} style={styles.navHalf} />
        <GradientButton label="Continuar" onPress={onNext} icon={<ArrowRight size={18} color={Colors.white} />} style={styles.navHalf} />
      </View>
    </Animated.View>
  );
}

/* ── Step 6: Delivery ── */
function DeliveryStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { draft, updateDraft } = useGiftStore();
  const deliveryMode = draft.deliveryMode ?? "now";
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scheduledDate = draft.scheduledFor
    ? new Date(draft.scheduledFor)
    : new Date(Date.now() + 86_400_000); // tomorrow default

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      setShowPicker(Platform.OS === "ios");
      if (selected) {
        updateDraft({ scheduledFor: selected.toISOString() });
        // On Android, chain to time picker.
        if (Platform.OS === "android") {
          setTimeout(() => setShowTimePicker(true), 600);
        }
      }
    },
    [updateDraft],
  );

  const handleTimeChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      setShowTimePicker(Platform.OS === "ios");
      if (selected) {
        updateDraft({ scheduledFor: selected.toISOString() });
      }
    },
    [updateDraft],
  );

  const formattedDate = scheduledDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  const formattedTime = scheduledDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Como entregar?</Text>
      <Text style={styles.stepSub}>Escolha quando o presente será liberado.</Text>

      {/* Delivery mode toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => updateDraft({ deliveryMode: "now" })}
          style={[styles.toggleBtn, deliveryMode === "now" && styles.toggleBtnActive]}
        >
          <Sparkles size={16} color={deliveryMode === "now" ? Colors.white : Colors.textMuted} />
          <Text style={[styles.toggleText, deliveryMode === "now" && styles.toggleTextActive]}>
            Agora
          </Text>
        </Pressable>
        <Pressable
          onPress={() => updateDraft({ deliveryMode: "scheduled" })}
          style={[styles.toggleBtn, deliveryMode === "scheduled" && styles.toggleBtnActive]}
        >
          <Calendar size={16} color={deliveryMode === "scheduled" ? Colors.white : Colors.textMuted} />
          <Text style={[styles.toggleText, deliveryMode === "scheduled" && styles.toggleTextActive]}>
            Agendar
          </Text>
        </Pressable>
      </View>

      {/* Date picker — shown when "Agendar" is selected */}
      {deliveryMode === "scheduled" && (
        <Animated.View entering={FadeInDown.springify()} style={styles.scheduleCard}>
          <Text style={styles.scheduleLabel}>Data e hora da entrega</Text>

          <View style={styles.scheduleRow}>
            {/* Date button */}
            <Pressable
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => [
                styles.scheduleBtn,
                pressed && styles.scheduleBtnPressed,
              ]}
            >
              <Calendar size={16} color={Colors.roseSoft} />
              <Text style={styles.scheduleBtnText}>{formattedDate}</Text>
            </Pressable>

            {/* Time button */}
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={({ pressed }) => [
                styles.scheduleBtn,
                styles.scheduleBtnTime,
                pressed && styles.scheduleBtnPressed,
              ]}
            >
              <Clock size={16} color={Colors.gold} />
              <Text style={styles.scheduleBtnText}>{formattedTime}</Text>
            </Pressable>
          </View>

          {/* Native date picker */}
          {showPicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 365 * 86_400_000)}
            />
          )}

          {/* Native time picker */}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}
        </Animated.View>
      )}

      {/* WhatsApp notify */}
      <Pressable
        style={styles.switchRow}
        onPress={() => updateDraft({ notifyWhatsapp: !draft.notifyWhatsapp })}
      >
        <View style={styles.switchBody}>
          <Text style={styles.switchLabel}>Notificar por WhatsApp</Text>
          <Text style={styles.switchHint}>Envia link automaticamente</Text>
        </View>
        <View style={[styles.switchTrack, draft.notifyWhatsapp && styles.switchTrackOn]}>
          <View style={[styles.switchThumb, draft.notifyWhatsapp && styles.switchThumbOn]} />
        </View>
      </Pressable>

      {/* Unlock code preview */}
      <View style={styles.codePreview}>
        <Text style={styles.codePreviewLabel}>Senha de desbloqueio</Text>
        <Text style={styles.codePreviewValue}>
          {draft.unlockCode ?? "—"}
        </Text>
        <Text style={styles.codePreviewHint}>
          O destinatário usará este código para abrir o presente.
        </Text>
      </View>

      <View style={styles.navRow}>
        <GradientButton label="Voltar" onPress={onBack} variant="ghost" icon={<ArrowLeft size={18} color={Colors.textPrimary} />} style={styles.navHalf} />
        <GradientButton label="Revisar" onPress={onNext} icon={<Check size={18} color={Colors.white} />} style={styles.navHalf} />
      </View>
    </Animated.View>
  );
}

/* ── Step 7: Review ── */
function ReviewStep({
  onBack,
}: {
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, finalizeGift, resetDraft } = useGiftStore();
  const [finalizing, setFinalizing] = useState(false);

  const styleMeta = STYLES.find((s) => s.key === (draft.style ?? "romantico")) ?? STYLES[0];

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      const gift = await finalizeGift();
      resetDraft();
      setFinalizing(false);
      if (gift) {
        router.replace(`/gift/${gift.id}`);
      }
    } catch {
      setFinalizing(false);
      Alert.alert("Erro", "Não foi possível criar o presente. Tente novamente.");
    }
  }, [finalizeGift, resetDraft, router]);

  return (
    <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.stepTitle}>Revisar presente</Text>
      <Text style={styles.stepSub}>Confira os detalhes antes de criar.</Text>

      <ScrollView
        style={styles.reviewScroll}
        contentContainerStyle={styles.reviewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}>
            <User size={16} color={Colors.rose} />
          </View>
          <View>
            <Text style={styles.reviewCardLabel}>Para</Text>
            <Text style={styles.reviewCardValue}>{draft.recipientName ?? "—"}</Text>
            {draft.occasion && <Text style={styles.reviewCardHint}>{draft.occasion}</Text>}
          </View>
        </View>

        {/* Message card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}>
            <MessageCircle size={16} color={Colors.plum} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.reviewCardLabel}>Mensagem</Text>
            <Text style={styles.reviewCardValue} numberOfLines={3}>
              {draft.message || "Sem mensagem"}
            </Text>
          </View>
        </View>

        {/* Media card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}>
            <Camera size={16} color={Colors.gold} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.reviewCardLabel}>Mídias</Text>
            <Text style={styles.reviewCardValue}>
              {(draft.media ?? []).length === 0
                ? "Nenhuma mídia"
                : `${(draft.media ?? []).length} mídia(s)`}
            </Text>
          </View>
        </View>

        {/* Style card */}
        <View style={styles.reviewCard}>
          <LinearGradient colors={styleMeta.gradient} style={styles.reviewCardIcon}>
            <Palette size={16} color={Colors.white} />
          </LinearGradient>
          <View style={styles.flex1}>
            <Text style={styles.reviewCardLabel}>Estilo</Text>
            <Text style={styles.reviewCardValue}>
              {styleMeta.emoji} {styleMeta.label}
            </Text>
            {draft.genre && (
              <Text style={styles.reviewCardHint}>
                Trilha: {GENRES.find((g) => g.key === draft.genre)?.label}
              </Text>
            )}
          </View>
        </View>

        {/* City card (physical gifts only) */}
        {draft.city ? (
          <View style={styles.reviewCard}>
            <View style={styles.reviewCardIcon}>
              <MapPin size={16} color={Colors.coral} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.reviewCardLabel}>Cidade de entrega</Text>
              <Text style={styles.reviewCardValue}>{draft.city}</Text>
            </View>
          </View>
        ) : null}

        {/* Delivery card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardIcon}>
            <Calendar size={16} color={Colors.coral} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.reviewCardLabel}>Entrega</Text>
            <Text style={styles.reviewCardValue}>
              {draft.deliveryMode === "scheduled" ? "Agendada" : "Imediata"}
            </Text>
            <Text style={styles.reviewCardHint}>
              Senha: {draft.unlockCode}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.reviewFooter}>
        <GradientButton
          label={finalizing ? "Criando presente..." : "Criar presente"}
          onPress={handleFinalize}
          loading={finalizing}
          icon={<Gift size={18} color={Colors.white} />}
        />
        <GradientButton
          label="Ajustar"
          onPress={onBack}
          variant="ghost"
          icon={<ArrowLeft size={18} color={Colors.textPrimary} />}
        />
      </View>
    </Animated.View>
  );
}

/* ── Main Create Screen ── */
export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetDraft } = useGiftStore();
  const [step, setStep] = useState(0);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const goBack = useCallback(() => {
    if (step === 0) {
      resetDraft();
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }, [step, resetDraft, router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Novo presente</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepsWrap}>
        <StepIndicator current={step} />
      </View>

      {/* Step content */}
      <Animated.View key={step} style={styles.stepBody}>
        {step === 0 && <RecipientStep onNext={goNext} />}
        {step === 1 && <MessageStep onNext={goNext} onBack={goBack} />}
        {step === 2 && <MediaStep onNext={goNext} onBack={goBack} />}
        {step === 3 && <TypeStep onNext={goNext} onBack={goBack} />}
        {step === 4 && <StyleStep onNext={goNext} onBack={goBack} />}
        {step === 5 && <DeliveryStep onNext={goNext} onBack={goBack} />}
        {step === 6 && <ReviewStep onBack={goBack} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
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
  /* Steps indicator */
  stepsWrap: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 0,
    paddingVertical: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.inkCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotDone: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  stepDotActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  stepLabel: {
    position: "absolute",
    top: 30,
    left: "50%",
    transform: [{ translateX: -20 }],
    width: 40,
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  stepLabelActive: {
    color: Colors.rose,
  },
  stepLabelDone: {
    color: Colors.roseSoft,
  },
  stepLine: {
    width: 20,
    height: 1.5,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  stepLineDone: {
    backgroundColor: Colors.rose,
  },
  /* Step content */
  stepBody: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSub: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 28,
  },
  nextBtn: {
    marginTop: 32,
  },
  /* Fields */
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.inkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
    marginRight: 4,
  },
  /* Chips */
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.inkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: "rgba(143,209,79,0.15)",
    borderColor: Colors.rose,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: Colors.rose,
  },
  /* Type step */
  typeGrid: {
    gap: 10,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeCardSelected: {
    borderColor: Colors.rose,
    backgroundColor: "rgba(143,209,79,0.08)",
  },
  typeCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  typeEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.inkCardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  typeEmojiWrapSelected: {
    backgroundColor: "rgba(143,209,79,0.15)",
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeBody: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  typeLabelSelected: {
    color: Colors.rose,
  },
  typeDesc: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  typeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.rose,
    alignItems: "center",
    justifyContent: "center",
  },
  /* City field */
  cityInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  cityIcon: {
    marginRight: 8,
  },
  cityInput: {
    flex: 1,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  cityHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  /* Navigation row */
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingBottom: 20,
  },
  navHalf: {
    flex: 1,
  },
  /* Media */
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaThumb: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.inkCard,
  },
  mediaVideoLabel: {
    color: Colors.white,
    fontSize: 28,
    textAlign: "center",
    lineHeight: 92,
  },
  mediaRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaAdd: {
    width: 92,
    height: 92,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  mediaAddText: {
    color: Colors.rose,
    fontSize: 11,
    fontWeight: "600",
  },
  /* Style */
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  styleCard: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleCardSelected: {
    borderColor: Colors.rose,
  },
  styleCardPressed: {
    opacity: 0.85,
  },
  styleCardInner: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 90,
  },
  styleEmoji: {
    fontSize: 28,
  },
  styleLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  styleLabelSelected: {
    color: Colors.white,
  },
  styleCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  /* Delivery */
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.inkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  toggleText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: Colors.white,
  },
  /* Schedule date picker */
  scheduleCard: {
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 12,
  },
  scheduleLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 10,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(199,178,206,0.08)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleBtnTime: {
    flex: 0.6,
  },
  scheduleBtnPressed: {
    backgroundColor: "rgba(199,178,206,0.15)",
  },
  scheduleBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
    flexShrink: 1,
  },
  /* Switch */
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  switchBody: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  switchHint: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  switchTrackOn: {
    backgroundColor: Colors.rose,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignSelf: "flex-start",
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  /* Code preview */
  codePreview: {
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  codePreviewLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  codePreviewValue: {
    color: Colors.gold,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 8,
    marginBottom: 8,
  },
  codePreviewHint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  /* Review */
  reviewScroll: {
    flex: 1,
  },
  reviewContent: {
    gap: 12,
    paddingBottom: 8,
  },
  reviewCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.inkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  reviewCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(143,209,79,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCardLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reviewCardValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  reviewCardHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
  reviewFooter: {
    gap: 10,
    paddingBottom: 20,
    marginTop: 16,
  },
});
