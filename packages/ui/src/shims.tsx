import React, { CSSProperties, forwardRef, useState } from 'react';

export interface RNStyleExtras {
  paddingVertical?: number | string;
  paddingHorizontal?: number | string;
  marginVertical?: number | string;
  marginHorizontal?: number | string;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: { width: number; height: number };
  elevation?: number;
  transform?: any;
  tintColor?: string;
  [k: string]: any;
}
export type ViewStyle = CSSProperties & RNStyleExtras;
export type TextStyle = ViewStyle;
export type ImageStyle = ViewStyle;
type StyleItem = ViewStyle | false | null | undefined;
export type StyleProp<T = ViewStyle> = StyleItem | StyleArray;
interface StyleArray extends Array<StyleProp> {}
export const Platform = { OS: 'web', select: (o: any) => o.web ?? o.default };

// ---------- style helpers ----------

type Style = StyleProp;
type FnStyle = (state: { pressed: boolean }) => Style;

const SHORTHANDS: Record<string, string[]> = {
  paddingVertical: ['paddingTop', 'paddingBottom'],
  paddingHorizontal: ['paddingLeft', 'paddingRight'],
  marginVertical: ['marginTop', 'marginBottom'],
  marginHorizontal: ['marginLeft', 'marginRight'],
  borderTopWidth: ['borderTopWidth'],
};

function transformValue(transform: any[]): string {
  return transform
    .map((t) => {
      const [k, v] = Object.entries(t)[0] as [string, any];
      return typeof v === 'number' ? `${k}(${v}px)` : `${k}(${v})`;
    })
    .join(' ');
}

export function flattenStyle(style: Style): CSSProperties {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<CSSProperties>((acc, s) => ({ ...acc, ...flattenStyle(s as StyleItem) }), {});
  }
  const out: CSSProperties = {};
  for (const [k, v] of Object.entries(style as CSSProperties)) {
    if (v == null) continue;
    if (k === 'transform' && Array.isArray(v)) {
      (out as any).transform = transformValue(v);
    } else if (k === 'paddingVertical') {
      out.paddingTop = v as any;
      out.paddingBottom = v as any;
    } else if (k === 'paddingHorizontal') {
      out.paddingLeft = v as any;
      out.paddingRight = v as any;
    } else if (k === 'marginVertical') {
      out.marginTop = v as any;
      out.marginBottom = v as any;
    } else if (k === 'marginHorizontal') {
      out.marginLeft = v as any;
      out.marginRight = v as any;
    } else if (k === 'shadowOpacity' || k === 'shadowColor' || k === 'shadowRadius' || k === 'elevation') {
      // handled below
    } else if (k === 'shadowOffset') {
      // handled below
    } else {
      (out as any)[k] = v;
    }
  }
  const s = style as any;
  if (s.shadowColor || s.shadowOpacity || s.shadowRadius || s.elevation || s.shadowOffset) {
    const e = s.elevation ?? 2;
    const r = s.shadowRadius ?? e * 2;
    const o = s.shadowOffset ?? { width: 0, height: Math.max(1, e / 2) };
    const op = s.shadowOpacity ?? 0.12;
    const c = s.shadowColor ?? '#000';
    out.boxShadow = `${o.width}px ${o.height}px ${r}px ${hexToRgba(c, op)}`;
  }
  return out;
}

function hexToRgba(hex: string, a: number) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  if (hex.startsWith('hsl')) return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6 && h.length !== 3) return hex;
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const base: CSSProperties = { boxSizing: 'border-box' };
const flexCol: CSSProperties = { display: 'flex', flexDirection: 'column', boxSizing: 'border-box' };

// ---------- primitives ----------

type DivProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
  style?: StyleProp;
  children?: React.ReactNode;
};

export const View = forwardRef<HTMLDivElement, DivProps>(function View({ style, children, ...props }, ref) {
  return (
    <div ref={ref} style={{ ...flexCol, ...flattenStyle(style) }} {...props}>
      {children}
    </div>
  );
});

export const Text = forwardRef<HTMLSpanElement, Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> & { style?: StyleProp; numberOfLines?: number; onPress?: () => void }>(function Text(
  { style, children, numberOfLines, onPress, ...props },
  ref
) {
  const clamp: CSSProperties = numberOfLines
    ? { display: '-webkit-box', WebkitLineClamp: numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
    : {};
  return (
    <span ref={ref} onClick={onPress} style={{ ...base, cursor: onPress ? 'pointer' : undefined, ...clamp, ...flattenStyle(style) }} {...props}>
      {children}
    </span>
  );
});

export const Pressable = forwardRef<HTMLDivElement, Omit<DivProps, 'style' | 'onClick'> & { style?: StyleProp | FnStyle; onPress?: () => void; disabled?: boolean }>(function Pressable(
  { style, children, onPress, disabled, ...props },
  ref
) {
  const [pressed, setPressed] = useState(false);
  const st = typeof style === 'function' ? (style as FnStyle)({ pressed }) : style;
  return (
    <div
      ref={ref}
      role="button"
      onClick={disabled ? undefined : onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ ...flexCol, cursor: disabled ? 'default' : 'pointer', ...flattenStyle(st) }}
      {...props}
    >
      {children}
    </div>
  );
});

export const ScrollView = forwardRef<HTMLDivElement, DivProps & { contentContainerStyle?: StyleProp; horizontal?: boolean; showsVerticalScrollIndicator?: boolean; showsHorizontalScrollIndicator?: boolean; keyboardShouldPersistTaps?: string; nestedScrollEnabled?: boolean }>(function ScrollView(
  { style, contentContainerStyle, horizontal, children, ...rest },
  ref
) {
  const inner: CSSProperties = horizontal
    ? { display: 'inline-flex', flexDirection: 'row', ...flattenStyle(contentContainerStyle) }
    : { ...flexCol, ...flattenStyle(contentContainerStyle) };
  return (
    <div
      ref={ref}
      style={{
        overflowX: horizontal ? 'auto' : 'hidden',
        overflowY: horizontal ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch',
        ...flattenStyle(style),
      }}
    >
      <div style={inner}>{children}</div>
    </div>
  );
});

export const TextInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'onChange' | 'value'> & { style?: StyleProp; value?: string; onChangeText?: (t: string) => void; placeholderTextColor?: string; secureTextEntry?: boolean; editable?: boolean }>(function TextInput(
  { style, value, onChangeText, placeholder, autoCapitalize, autoFocus, secureTextEntry, editable = true, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      autoFocus={autoFocus}
      disabled={!editable}
      type={secureTextEntry ? 'password' : 'text'}
      style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', ...flattenStyle(style) }}
      {...props}
    />
  );
});

export function Switch({ value, onValueChange, trackColor, thumbColor }: { value?: boolean; onValueChange?: (v: boolean) => void; trackColor?: { true?: string; false?: string }; thumbColor?: string }) {
  const on = !!value;
  const track = on ? trackColor?.true ?? '#06C167' : trackColor?.false ?? '#E8E8E8';
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={() => onValueChange?.(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: track,
        padding: 3,
        cursor: 'pointer',
        transition: 'background 0.15s',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: on ? 'flex-end' : 'flex-start',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: thumbColor ?? '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
}

export const SafeAreaView = forwardRef<HTMLDivElement, DivProps & { edges?: string[] }>(function SafeAreaView(
  { style, children },
  ref
) {
  return (
    <div ref={ref} style={{ ...flexCol, minHeight: '100vh', ...flattenStyle(style) }}>
      {children}
    </div>
  );
});

export const KeyboardAvoidingView = View;
export const Modal = ({ children, visible, transparent }: any) =>
  visible ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: transparent ? 'transparent' : 'rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  ) : null;

export const StyleSheet = {
  create: <T extends Record<string, ViewStyle>>(s: T): T => s,
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as CSSProperties,
};

// ---------- Ionicons emoji mapping ----------

const ICONS: Record<string, string> = {
  home: '🏠', 'home-outline': '🏠', search: '🔍', receipt: '🧾', 'receipt-outline': '🧾',
  person: '👤', 'person-outline': '👤', speedometer: '⚡', wallet: '👛', 'wallet-outline': '👛',
  time: '🕐', 'time-outline': '🕐', settings: '⚙️', 'settings-outline': '⚙️', grid: '📊',
  storefront: '🏪', car: '🚗', 'car-outline': '🚗', 'ellipsis-horizontal': '⋯',
  location: '📍', 'location-outline': '📍', 'chevron-down': '▾', 'chevron-forward': '›',
  'chevron-back': '‹', 'arrow-back': '←', 'arrow-forward': '→', 'arrow-forward-circle': '➜',
  'cart-outline': '🛒', cart: '🛒', 'notifications-outline': '🔔', notifications: '🔔',
  'close-circle': '✕', close: '✕', pricetag: '🏷️', 'pricetag-outline': '🏷️', star: '★',
  'star-outline': '☆', 'star-half': '★', 'trash-outline': '🗑️', trash: '🗑️', remove: '−',
  add: '+', call: '📞', 'call-outline': '📞', chatbubble: '💬', 'chatbubble-outline': '💬',
  radio: '📡', power: '⏻', navigate: '🧭', bicycle: '🚲', checkmark: '✓',
  'checkmark-circle': '✅', 'checkmark-circle-outline': '✅', 'swap-horizontal': '⇄',
  list: '📋', 'list-outline': '📋', 'bar-chart': '📊', 'bar-chart-outline': '📊',
  megaphone: '📣', 'megaphone-outline': '📣', 'shield-checkmark-outline': '🛡️',
  'shield-checkmark': '🛡️', 'card-outline': '💳', card: '💳', 'thermometer-outline': '🌡️',
  'school-outline': '🎓', 'help-circle-outline': '❓', 'logo-apple': '', cash: '💵',
  'cash-outline': '💵', flash: '⚡', 'flash-outline': '⚡', 'radio-button-on': '◉',
  'radio-button-off': '○', checkbox: '☑', 'checkbox-outline': '☑', 'square-outline': '☐',
  flask: '🧪', pulse: '📈', 'pulse-outline': '📈', 'cube-outline': '📦', cube: '📦',
  'bicycle-outline': '🚲', 'alert-circle': '⚠️', 'alert-circle-outline': '⚠️',
  'information-circle-outline': 'ℹ️', 'log-out-outline': '↩', 'stats-chart': '📊',
  'people': '👥', 'people-outline': '👥', 'clipboard-outline': '📋', 'moon-outline': '🌙',
};

export function Ionicons({ name, size = 16, color = '#000', style }: { name: string; size?: number; color?: string; style?: Style }) {
  return (
    <span
      style={{
        fontSize: size,
        lineHeight: 1,
        color,
        fontStyle: 'normal',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...flattenStyle(style),
      }}
    >
      {ICONS[name] ?? '·'}
    </span>
  );
}
