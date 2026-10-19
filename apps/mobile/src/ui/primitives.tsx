import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTheme } from '../app/providers/ThemeProvider.tsx';

export function Copy({
  children,
  muted = false,
  title = false,
}: PropsWithChildren<{ muted?: boolean; title?: boolean }>) {
  const { colors } = useTheme();
  return (
    <Text
      selectable
      style={{
        color: muted ? colors.muted : colors.text,
        fontSize: title ? 21 : 15,
        fontWeight: title ? '600' : '400',
        lineHeight: title ? 29 : 23,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({ children, title, grow = false }: PropsWithChildren<{ title?: string; grow?: boolean }>) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        gap: 12,
        ...(grow ? { flex: 1, minWidth: 132 } : {}),
      }}
    >
      {title && <Copy title>{title}</Copy>}
      {children}
    </View>
  );
}
export function Action({
  title,
  onPress,
  disabled = false,
  quiet = false,
}: {
  title: string;
  onPress(): void;
  disabled?: boolean;
  quiet?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 46,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: quiet ? colors.tint : colors.accent,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: quiet ? colors.text : colors.background, fontSize: 15, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  secret = false,
  multiline = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  secret?: boolean;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Copy muted>{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secret}
        multiline={multiline}
        editable={!disabled}
        placeholderTextColor={colors.muted}
        style={{
          borderColor: colors.line,
          color: colors.text,
          borderWidth: 1,
          borderRadius: 10,
          minHeight: multiline ? 88 : 46,
          padding: 12,
          fontSize: 16,
        }}
      />
    </View>
  );
}
export function Page({ children, title, subtitle }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 36, gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Copy title>{title}</Copy>
        {subtitle && <Copy muted>{subtitle}</Copy>}
      </View>
      {children}
    </ScrollView>
  );
}
export function Row({ children }: PropsWithChildren) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}
