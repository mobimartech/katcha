import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  animated?: boolean;
};

export default function Card({ children, style, animated = true }: CardProps): React.ReactElement {
  const { colors, radius, shadows } = useAppTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // If not animated, set to final values immediately
      fadeAnim.setValue(1);
      translateYAnim.setValue(0);
    }
  }, [fadeAnim, translateYAnim, animated]);
  
  return (
    <Animated.View
      style={[
        styles.card,
        { 
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderColor: colors.border,
          ...shadows.small,
        },
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
});