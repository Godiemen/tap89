import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  small,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary' ? colors.ink :
    variant === 'accent' ? colors.accent :
    variant === 'danger' ? colors.red :
    variant === 'outline' ? 'transparent' : colors.bg;
  const fg =
    variant === 'ghost' || variant === 'outline' ? colors.ink : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        {
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.ink,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 14 : 18} color={fg} /> : null}
      <Text style={[small ? font.small : font.h3, { color: fg, fontWeight: '700' }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style, pad = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: boolean }) {
  return <View style={[styles.card, pad && { padding: spacing(4) }, style]}>{children}</View>;
}

export function Chip({
  label,
  active,
  onPress,
  emoji,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  emoji?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.ink }]}
    >
      <Text style={[font.small, { color: active ? '#fff' : colors.ink, fontWeight: '600' }]}>
        {emoji ? `${emoji} ` : ''}{label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label, color = colors.accent, soft }: { label: string; color?: string; soft?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft ?? colors.accentSoft }]}>
      <Text style={[font.tiny, { color, fontWeight: '800' }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={font.h2}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={[font.small, { color: colors.accent, fontWeight: '700' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Ionicons name="star" size={size} color={colors.amber} />
      <Text style={[font.small, { fontWeight: '700', color: colors.ink }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export function RateRow({ value, onRate }: { value: number; onRate: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing(2) }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onRate(n)}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={32} color={colors.amber} />
        </Pressable>
      ))}
    </View>
  );
}

export function QtyStepper({ qty, onChange, small }: { qty: number; onChange: (q: number) => void; small?: boolean }) {
  const s = small ? 26 : 34;
  return (
    <View style={[styles.stepper, { height: s }]}>
      <Pressable onPress={() => onChange(qty - 1)} style={[styles.stepBtn, { width: s, height: s }]}>
        <Ionicons name={qty <= 1 ? 'trash-outline' : 'remove'} size={s * 0.55} color={colors.ink} />
      </Pressable>
      <Text style={[font.h3, { minWidth: 24, textAlign: 'center' }]}>{qty}</Text>
      <Pressable onPress={() => onChange(qty + 1)} style={[styles.stepBtn, { width: s, height: s }]}>
        <Ionicons name="add" size={s * 0.6} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function EmptyState({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing(12), gap: spacing(2) }}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text style={font.h3}>{title}</Text>
      {body ? <Text style={[font.small, { textAlign: 'center' }]}>{body}</Text> : null}
    </View>
  );
}

export function Avatar({ name, color = colors.accent, size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function Progress({ value, color = colors.accent }: { value: number; color?: string }) {
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value * 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export const Divider = () => <View style={{ height: 1, backgroundColor: colors.line }} />;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(5),
    borderRadius: radius.pill,
  },
  btnSmall: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chip: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: spacing(2),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(3),
    marginTop: spacing(4),
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
  },
  stepBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
