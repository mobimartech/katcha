import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define theme types
type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
};

// Use valid React Native fontWeight values
type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

type ThemeTypography = {
  displayLarge: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  displayMedium: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  displaySmall: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  headlineLarge: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  headlineMedium: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  headlineSmall: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  titleLarge: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  titleMedium: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  titleSmall: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  labelLarge: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  labelMedium: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  labelSmall: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  bodyLarge: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  bodyMedium: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
  bodySmall: { fontSize: number; fontWeight: FontWeight; lineHeight: number };
};

type ThemeSpacing = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

type ThemeRadius = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
};

type ThemeShadow = {
  small: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  large: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

type Theme = {
  dark: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadow;
};

// Define light and dark themes
const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#7A86FF',
    secondary: '##7A86FF',
    accent: '#98C1D9',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#E0E0E0',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
  typography: {
    displayLarge: { fontSize: 57, fontWeight: '400', lineHeight: 64 },
    displayMedium: { fontSize: 45, fontWeight: '400', lineHeight: 52 },
    displaySmall: { fontSize: 36, fontWeight: '400', lineHeight: 44 },
    headlineLarge: { fontSize: 32, fontWeight: '400', lineHeight: 40 },
    headlineMedium: { fontSize: 28, fontWeight: '400', lineHeight: 36 },
    headlineSmall: { fontSize: 24, fontWeight: '400', lineHeight: 32 },
    titleLarge: { fontSize: 22, fontWeight: '500', lineHeight: 28 },
    titleMedium: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
    titleSmall: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
    labelLarge: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
    labelMedium: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
    labelSmall: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
    bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#98C1D9',
    secondary: '#EE6C4D',
    accent: '#3D5A80',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#2C2C2C',
    error: '#CF6679',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
  typography: lightTheme.typography,
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  shadows: {
    small: {
      ...lightTheme.shadows.small,
      shadowColor: '#000',
    },
    medium: {
      ...lightTheme.shadows.medium,
      shadowColor: '#000',
    },
    large: {
      ...lightTheme.shadows.large,
      shadowColor: '#000',
    },
  },
};

// Create context
const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: lightTheme,
  toggleTheme: () => {},
});

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme
export const useAppTheme = () => {
  const { theme } = useContext(ThemeContext);
  return theme;
};

// Hook to toggle theme
export const useToggleTheme = () => {
  const { toggleTheme } = useContext(ThemeContext);
  return toggleTheme;
};