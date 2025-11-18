import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function Input(props: TextInputProps): React.ReactElement {
  const { colors, radius, spacing } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      style={[styles.base, { borderColor: colors.border, color: colors.text, borderRadius: radius.md, padding: spacing.lg }]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1 },
});


