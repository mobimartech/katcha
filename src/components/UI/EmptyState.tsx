import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeProvider';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  icon?: string;
  onAction: () => void;
};

export default function EmptyState({ title, subtitle, actionLabel, icon = 'add-circle-outline', onAction }: EmptyStateProps): React.ReactElement {
  const { colors, spacing, radius, typography } = useAppTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          }),
          Animated.timing(iconRotate, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          }),
        ])
      ),
    ]).start();
  }, [fadeAnim, scaleAnim, iconRotate]);

  // Convert rotation value to degrees
  const rotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <Icon name={icon} size={80} color={colors.primary} />
      </Animated.View>
      
      <Text style={[styles.title, typography.headlineMedium, { color: colors.text, marginTop: spacing.lg }]}>
        {title}
      </Text>
      
      <Text style={[styles.subtitle, typography.bodyLarge, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        {subtitle}
      </Text>
      
      <TouchableOpacity
        onPress={onAction}
        style={[
          styles.button,
          { 
            backgroundColor: colors.primary, 
            marginTop: spacing.xl,
            borderRadius: radius.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
          }
        ]}
      >
        <Text style={[typography.labelLarge, { color: '#fff' }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: '80%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});