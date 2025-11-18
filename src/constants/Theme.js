const COLORS = {
  PRIMARY: '#427B8B',  // Baby pink - main app color
  PRIMARY_LIGHT: '#FFB3D1',  // Light pink
  PRIMARY_DARK: '#E91E63',  // Dark pink
  SECONDARY: '#FFA000',  // Amber
  ACCENT: '#FF6D00',  // Deep orange
  SUCCESS: '#43A047',
  ERROR: '#D32F2F',
  WARNING: '#FFA000',
  INFO: '#1976D2',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  DARK: '#212121',  // Added DARK color
  LIGHT: '#FAFAFA',  // Added LIGHT color
  GRAY_LIGHT: '#F5F5F5',
  GRAY: '#9E9E9E',
  GRAY_DARK: '#424242',
  TRANSPARENT: 'transparent',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
};

const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
};

const BORDER_RADIUS = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  ROUND: 999,
};

const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT: 'ease-out',
    EASE_IN: 'ease-in',
  },
};

export default {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATIONS,
}; 