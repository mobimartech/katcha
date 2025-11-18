import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  disabled?: boolean;
};

export default function Button({ title, onPress, style, variant = 'primary', disabled }: Props): React.ReactElement {
  const { colors, radius } = useAppTheme();
  const base = [
    styles.base,
    { borderRadius: radius.lg },
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'secondary' && { backgroundColor: colors.secondary },
    variant === 'accent' && { backgroundColor: colors.accent },
    variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    disabled && { opacity: 0.6 },
    style,
  ];
  const textColor = variant === 'outline' ? colors.text : '#fff';
  return (
    <Pressable style={base} onPress={onPress} disabled={disabled} android_ripple={{ color: colors.border }}>
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700', fontSize: 16 },
});


