import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Role } from '../game/logic';

export const colors = {
  background: '#12101A',
  surface: '#1F1B2C',
  surfaceRaised: '#2B2640',
  border: '#3A3454',
  text: '#F5F0E6',
  muted: '#A49EB6',
  accent: '#F2B544',
  onAccent: '#1B1505',
  danger: '#E5544B',
  success: '#5CC8A4',
};

export const ROLE_INFO: Record<Role, { label: string; color: string }> = {
  civilian: { label: 'Civilian', color: '#5AB8E0' },
  undercover: { label: 'Undercover', color: '#E8735A' },
  mrwhite: { label: 'Mr. White', color: '#EDE6D6' },
};

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonVariants[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonLabel, buttonLabelVariants[variant]]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <View style={styles.stepperText}>
        <Text style={styles.stepperLabel}>{label}</Text>
        {hint ? <Text style={styles.stepperHint}>{hint}</Text> : null}
      </View>
      <StepButton symbol="−" name={`Fewer ${label}`} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text style={styles.stepperValue}>{value}</Text>
      <StepButton symbol="+" name={`More ${label}`} disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({
  symbol,
  name,
  disabled,
  onPress,
}: {
  symbol: string;
  name: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </Pressable>
  );
}

/** Springs its children into view on mount; used for the dramatic reveals. */
export function PopIn({ children }: { children: ReactNode }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(progress, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, [progress]);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return <Animated.View style={{ opacity: progress, transform: [{ scale }] }}>{children}</Animated.View>;
}

const buttonVariants = StyleSheet.create({
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
});

const buttonLabelVariants = StyleSheet.create({
  primary: { color: colors.onAccent },
  secondary: { color: colors.text },
  danger: { color: '#FFFFFF' },
  ghost: { color: colors.muted },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: 20, gap: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 8 },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  button: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.35 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  stepperText: { flex: 1 },
  stepperLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  stepperHint: { color: colors.muted, fontSize: 13, marginTop: 2 },
  stepperValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSymbol: { color: colors.text, fontSize: 24, fontWeight: '600', lineHeight: 28 },
});
