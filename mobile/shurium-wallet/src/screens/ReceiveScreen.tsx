/**
 * SHURIUM Mobile Wallet - Receive Screen
 * Premium glassmorphism design with QR code and animations
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Share,
  Clipboard,
  Alert,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useWalletStore } from '../store/wallet';
import { createShuriumURI } from '../utils/crypto';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, GlassButton, GlowingIcon } from '../components/ui';

export const ReceiveScreen: React.FC = () => {
  const { accounts, activeAccountId, network } = useWalletStore();
  const [requestAmount, setRequestAmount] = useState('');
  const [label, setLabel] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const qrScaleAnim = useRef(new Animated.Value(0.9)).current;
  const copyAnim = useRef(new Animated.Value(0)).current;

  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const address = activeAccount?.address || '';

  // Generate SHURIUM URI with optional amount and label
  const shuriumURI = useMemo(() => {
    const amount = requestAmount ? parseFloat(requestAmount) : undefined;
    return createShuriumURI(address, amount, label || undefined);
  }, [address, requestAmount, label]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.spring(qrScaleAnim, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateCopy = () => {
    setCopied(true);
    Animated.sequence([
      Animated.timing(copyAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(copyAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setCopied(false));
  };

  const copyAddress = () => {
    Clipboard.setString(address);
    animateCopy();
  };

  const copyURI = () => {
    Clipboard.setString(shuriumURI);
    Alert.alert('Copied', 'Payment request copied to clipboard');
  };

  const shareAddress = async () => {
    try {
      await Share.share({
        message: showOptions && (requestAmount || label) 
          ? `Please send SHR to: ${shuriumURI}`
          : `My SHURIUM address: ${address}`,
        title: 'SHURIUM Address',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getNetworkLabel = () => {
    switch (network) {
      case 'mainnet': return null;
      case 'testnet': return 'TESTNET';
      case 'regtest': return 'REGTEST';
    }
  };

  const networkLabel = getNetworkLabel();

  return (
    <View style={styles.container}>
      {/* Animated Background Orbs */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }}>
          {/* Network Badge */}
          {networkLabel && (
            <View style={styles.networkBadgeContainer}>
              <LinearGradient
                colors={network === 'testnet' 
                  ? ['#F59E0B', '#D97706'] 
                  : ['#A855F7', '#7C3AED']}
                style={styles.networkBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.networkText}>{networkLabel}</Text>
              </LinearGradient>
            </View>
          )}

          {/* QR Code Card */}
          <Animated.View style={{ transform: [{ scale: qrScaleAnim }] }}>
            <GlassCard style={styles.qrCard} intensity="medium" glow glowColor="rgba(139, 92, 246, 0.3)">
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.qrWrapper}>
                <LinearGradient
                  colors={['#fff', '#f8f8f8']}
                  style={styles.qrInner}
                >
                  <QRCode
                    value={showOptions && (requestAmount || label) ? shuriumURI : address}
                    size={180}
                    backgroundColor="transparent"
                    color="#0A0A0F"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.qrHint}>Scan to send SHR</Text>
            </GlassCard>
          </Animated.View>

          {/* Address Card */}
          <GlassCard style={styles.addressCard} intensity="light">
            <Text style={styles.addressLabel}>Your Address</Text>
            <Pressable 
              style={styles.addressBox} 
              onPress={copyAddress}
            >
              <Text style={styles.addressText} selectable>
                {address}
              </Text>
              <View style={styles.copyIndicator}>
                <Animated.View 
                  style={[
                    styles.copySuccess,
                    {
                      opacity: copyAnim,
                      transform: [{
                        scale: copyAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      }],
                    },
                  ]}
                >
                  <Text style={styles.copySuccessText}>Copied!</Text>
                </Animated.View>
              </View>
            </Pressable>
            <Text style={styles.tapHint}>Tap to copy</Text>
          </GlassCard>

          {/* Request Amount Toggle */}
          <TouchableOpacity 
            style={styles.optionsToggle}
            onPress={() => setShowOptions(!showOptions)}
          >
            <LinearGradient
              colors={showOptions ? gradients.primary : ['transparent', 'transparent']}
              style={styles.optionsToggleInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[
                styles.optionsToggleText,
                showOptions && styles.optionsToggleTextActive
              ]}>
                {showOptions ? '− Hide request options' : '+ Add amount request'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Request Options */}
          {showOptions && (
            <Animated.View>
              <GlassCard style={styles.optionsContainer} intensity="light">
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Request Amount (optional)</Text>
                  <View style={styles.amountInputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00000000"
                      placeholderTextColor={colors.text.muted}
                      value={requestAmount}
                      onChangeText={setRequestAmount}
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.currencyBadge}>
                      <Text style={styles.currencyLabel}>SHR</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Label (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Payment for..."
                    placeholderTextColor={colors.text.muted}
                    value={label}
                    onChangeText={setLabel}
                  />
                </View>

                {(requestAmount || label) && (
                  <View style={styles.uriContainer}>
                    <Text style={styles.uriLabel}>Payment Request URI</Text>
                    <Pressable style={styles.uriBox} onPress={copyURI}>
                      <Text style={styles.uriText} numberOfLines={2}>
                        {shuriumURI}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={copyAddress}>
              <LinearGradient
                colors={gradients.primary}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.actionIcon}>📋</Text>
              </LinearGradient>
              <Text style={styles.actionText}>Copy</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={shareAddress}>
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.actionIcon}>↗</Text>
              </LinearGradient>
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
          </View>

          {/* Account Selector (if multiple accounts) */}
          {accounts.length > 1 && (
            <GlassCard style={styles.accountSelector} intensity="light">
              <Text style={styles.accountLabel}>Receiving to:</Text>
              <View style={styles.accountBadge}>
                <Text style={styles.accountName}>{activeAccount?.name || 'Default'}</Text>
              </View>
            </GlassCard>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -50,
    left: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 50,
    right: -50,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    alignItems: 'center',
  },
  networkBadgeContainer: {
    marginBottom: spacing.md,
  },
  networkBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  qrWrapper: {
    padding: 4,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.md,
  },
  qrInner: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  qrHint: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
  },
  addressCard: {
    width: '100%',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  addressLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.sm,
  },
  addressBox: {
    backgroundColor: colors.glass.light,
    padding: spacing.md,
    borderRadius: radius.md,
    position: 'relative',
  },
  addressText: {
    color: colors.text.primary,
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
  },
  copyIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copySuccess: {
    backgroundColor: colors.success.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  copySuccessText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  tapHint: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  optionsToggle: {
    marginVertical: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  optionsToggleInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radius.full,
  },
  optionsToggleText: {
    color: colors.primary.start,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsToggleTextActive: {
    color: '#fff',
  },
  optionsContainer: {
    width: '100%',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    flex: 1,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.light,
    borderRadius: radius.md,
  },
  currencyBadge: {
    paddingHorizontal: spacing.md,
  },
  currencyLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  uriContainer: {
    marginTop: spacing.sm,
  },
  uriLabel: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  uriBox: {
    backgroundColor: colors.glass.light,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success.base,
  },
  uriText: {
    color: colors.success.base,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginVertical: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.button,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    color: colors.text.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  accountSelector: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  accountLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
  },
  accountBadge: {
    backgroundColor: colors.glass.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  accountName: {
    color: colors.text.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
});

export default ReceiveScreen;
