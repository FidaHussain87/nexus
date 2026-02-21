/**
 * SHURIUM Mobile Wallet - Premium Theme System
 * Glassmorphism, gradients, and modern design tokens
 */

import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Brand Colors
export const colors = {
  // Primary gradient (SHURIUM brand - purple/blue)
  primary: {
    start: '#8B5CF6',    // Violet
    end: '#3B82F6',      // Blue
    glow: 'rgba(139, 92, 246, 0.5)',
  },
  
  // Accent colors
  accent: {
    purple: '#A855F7',
    blue: '#3B82F6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    orange: '#F97316',
  },
  
  // Status colors
  success: {
    base: '#10B981',
    glow: 'rgba(16, 185, 129, 0.4)',
    gradient: ['#10B981', '#059669'],
  },
  warning: {
    base: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)',
    gradient: ['#F59E0B', '#D97706'],
  },
  error: {
    base: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    gradient: ['#EF4444', '#DC2626'],
  },
  
  // Glass effects
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    heavy: 'rgba(255, 255, 255, 0.2)',
    border: 'rgba(255, 255, 255, 0.2)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Backgrounds
  background: {
    primary: '#0A0A0F',      // Deep dark
    secondary: '#12121A',    // Card background
    tertiary: '#1A1A25',     // Elevated elements
    gradient: ['#0A0A0F', '#12121A', '#1A1A25'],
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.3)',
  },
};

// Gradients for LinearGradient component
export const gradients = {
  primary: ['#8B5CF6', '#3B82F6'],
  primaryDiagonal: ['#A855F7', '#3B82F6', '#06B6D4'],
  
  card: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
  cardHover: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)'],
  
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626'],
  
  purple: ['#A855F7', '#7C3AED'],
  blue: ['#3B82F6', '#2563EB'],
  cyan: ['#06B6D4', '#0891B2'],
  
  mesh: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981'],
  
  // Background gradients
  backgroundRadial: ['rgba(139, 92, 246, 0.15)', 'rgba(59, 130, 246, 0.1)', 'transparent'],
  backgroundMesh: ['#0A0A0F', '#12121A'],
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Shadows (for elevation effect)
export const shadows = {
  glow: {
    primary: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    success: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 8,
    },
    error: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 8,
    },
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Typography
export const typography = {
  hero: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  mono: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Common component styles
export const components = StyleSheet.create({
  // Glass card
  glassCard: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },
  
  glassCardElevated: {
    backgroundColor: colors.glass.medium,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.card,
  },
  
  // Buttons
  buttonPrimary: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.button,
  },
  
  buttonGlass: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  
  // Input
  input: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },
  
  // Pill/Badge
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  
  // Icon button
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Layout helpers
export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  container: {
    flex: 1,
    padding: spacing.md,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Screen dimensions for responsive design
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
};

export default {
  colors,
  gradients,
  spacing,
  radius,
  shadows,
  typography,
  animation,
  components,
  layout,
  screen,
};
