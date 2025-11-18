export const VirtualTryOnTheme = {
  light: {
    // Primary Colors
    primary: '#6366F1', // Modern indigo
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    
    // Secondary Colors
    secondary: '#EC4899', // Modern pink
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',
    
    // Accent Colors
    accent: '#06B6D4', // Cyan
    accentLight: '#22D3EE',
    accentDark: '#0891B2',
    
    // Neutral Colors
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    
    // Text Colors
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    
    // Status Colors
    success: '#10B981',
    successLight: '#34D399',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    error: '#EF4444',
    errorLight: '#F87171',
    
    // Border & Divider
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#CBD5E1',
    
    // Shadow Colors
    shadowColor: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowMedium: 'rgba(0, 0, 0, 0.1)',
    shadowHeavy: 'rgba(0, 0, 0, 0.25)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdropLight: 'rgba(248, 250, 252, 0.8)',
  },
  
  dark: {
    // Primary Colors
    primary: '#818CF8', // Lighter indigo for dark mode
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    
    // Secondary Colors
    secondary: '#F472B6', // Lighter pink for dark mode
    secondaryLight: '#F9A8D4',
    secondaryDark: '#EC4899',
    
    // Accent Colors
    accent: '#22D3EE', // Lighter cyan
    accentLight: '#67E8F9',
    accentDark: '#06B6D4',
    
    // Neutral Colors
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    
    // Text Colors
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    // Status Colors
    success: '#34D399',
    successLight: '#6EE7B7',
    warning: '#FBBF24',
    warningLight: '#FCD34D',
    error: '#F87171',
    errorLight: '#FCA5A5',
    
    // Border & Divider
    border: '#475569',
    borderLight: '#334155',
    divider: '#64748B',
    
    // Shadow Colors
    shadowColor: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    shadowHeavy: 'rgba(0, 0, 0, 0.6)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    backdropLight: 'rgba(30, 41, 59, 0.8)',
  },
};

// Typography Scale
export const Typography = {
  // Display
  displayLarge: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 44,
  },
  displayMedium: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  displaySmall: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  
  // Headline
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  
  // Title
  titleLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  titleMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  titleSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // Label
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

// Spacing Scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

// Border Radius Scale
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow Presets
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  extraLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Animation Durations
export const AnimationDurations = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750,
};

// Common Styles
export const CommonStyles = {
  card: {
    borderRadius: BorderRadius.lg,
    backgroundColor: 'surface',
    ...Shadows.medium,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
  },
}; 