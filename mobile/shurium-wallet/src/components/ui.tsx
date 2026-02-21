/**
 * SHURIUM Mobile Wallet - Reusable UI Components
 * Premium glassmorphism components with animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';

// ============================================================================
// GlassCard - Frosted glass effect card
// ============================================================================

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  animated?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'light',
  animated = false,
  glow = false,
  glowColor = colors.primary.glow,
}) => {
  const scaleAnim = useRef(new Animated.Value(animated ? 0.95 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated]);

  const bgColor = {
    light: colors.glass.light,
    medium: colors.glass.medium,
    heavy: colors.glass.heavy,
  }[intensity];

  return (
    <Animated.View
      style={[
        styles.glassCard,
        { backgroundColor: bgColor },
        glow && { shadowColor: glowColor, ...shadows.glow.primary },
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </Animated.View>
  );
};

// ============================================================================
// GradientButton - Animated gradient button with glow
// ============================================================================

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  colors: buttonColors = gradients.primary,
  disabled = false,
  loading = false,
  size = 'medium',
  icon,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const sizeStyles = {
    small: { paddingVertical: 10, paddingHorizontal: 16 },
    medium: { paddingVertical: 16, paddingHorizontal: 24 },
    large: { paddingVertical: 20, paddingHorizontal: 32 },
  };

  const textSizes = {
    small: 14,
    medium: 16,
    large: 18,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.gradientButtonContainer,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.buttonDisabled,
          style,
        ]}
      >
        <LinearGradient
          colors={disabled ? ['#444', '#333'] : buttonColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientButton, sizeStyles[size]]}
        >
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          {loading ? (
            <PulsingDot />
          ) : (
            <Text style={[styles.buttonText, { fontSize: textSizes[size] }]}>
              {title}
            </Text>
          )}
        </LinearGradient>
        
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.buttonGlow,
            {
              opacity: glowAnim,
              shadowColor: buttonColors[0],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

// ============================================================================
// GlassButton - Transparent glass button
// ============================================================================

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.glassButton,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.buttonDisabled,
          style,
        ]}
      >
        <Text style={styles.glassButtonText}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ============================================================================
// AnimatedBalance - Number counter animation
// ============================================================================

interface AnimatedBalanceProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
}

export const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({
  value,
  prefix = '',
  suffix = ' SHR',
  decimals = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState('0');

  useEffect(() => {
    animatedValue.setValue(0);
    
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v.toFixed(decimals));
    });

    return () => animatedValue.removeListener(listener);
  }, [value, decimals]);

  return (
    <Text style={[styles.balanceText, style]}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
};

// ============================================================================
// PulsingDot - Loading indicator
// ============================================================================

export const PulsingDot: React.FC<{ color?: string }> = ({ color = '#fff' }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulsingContainer}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.pulsingDot,
            { backgroundColor: color, opacity: pulseAnim },
          ]}
        />
      ))}
    </View>
  );
};

// ============================================================================
// GlowingIcon - Icon with glow effect
// ============================================================================

interface GlowingIconProps {
  icon: string;
  color?: string;
  size?: number;
  glow?: boolean;
}

export const GlowingIcon: React.FC<GlowingIconProps> = ({
  icon,
  color = colors.primary.start,
  size = 24,
  glow = true,
}) => {
  return (
    <View
      style={[
        styles.glowingIconContainer,
        glow && {
          shadowColor: color,
          shadowOpacity: 0.6,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      <Text style={[styles.glowingIconText, { color, fontSize: size }]}>
        {icon}
      </Text>
    </View>
  );
};

// ============================================================================
// StatusPill - Status indicator pill
// ============================================================================

interface StatusPillProps {
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, text }) => {
  const statusColors = {
    success: colors.success.base,
    warning: colors.warning.base,
    error: colors.error.base,
    info: colors.primary.start,
  };

  return (
    <View style={[styles.statusPill, { borderColor: statusColors[status] }]}>
      <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
      <Text style={[styles.statusText, { color: statusColors[status] }]}>{text}</Text>
    </View>
  );
};

// ============================================================================
// ProgressRing - Circular progress indicator
// ============================================================================

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  color = colors.primary.start,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: progress / 100,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View style={[styles.progressRingBg, { borderWidth: strokeWidth }]} />
      <Animated.View
        style={[
          styles.progressRingFill,
          {
            borderWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: rotation }],
          },
        ]}
      />
      <Text style={styles.progressRingText}>{Math.round(progress)}%</Text>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },
  
  gradientButtonContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  glassButton: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  glassButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  
  balanceText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  
  pulsingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  glowingIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowingIconText: {
    fontWeight: 'bold',
  },
  
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressRingFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default {
  GlassCard,
  GradientButton,
  GlassButton,
  AnimatedBalance,
  PulsingDot,
  GlowingIcon,
  StatusPill,
  ProgressRing,
};
