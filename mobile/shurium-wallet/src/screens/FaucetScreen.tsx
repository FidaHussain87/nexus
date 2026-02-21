/**
 * SHURIUM Mobile Wallet - Faucet Screen
 * Premium glassmorphism design for testnet faucet
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../store/wallet';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, GradientButton, PulsingDot, AnimatedBalance } from '../components/ui';

const QUICK_AMOUNTS = ['10', '50', '100', '500', '1000'];

export const FaucetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { network, accounts, activeAccountId, requestFaucet, balance } = useWalletStore();
  
  const [amount, setAmount] = useState('100');
  const [isRequesting, setIsRequesting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const dropAnim = useRef(new Animated.Value(0)).current;

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Animated water drop effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(dropAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleRequest = async () => {
    if (network === 'mainnet') {
      Alert.alert('Not Available', 'Faucet is only available on testnet and regtest');
      return;
    }

    const requestAmount = parseFloat(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (requestAmount > 1000) {
      Alert.alert('Amount Too High', 'Maximum faucet request is 1000 SHR');
      return;
    }

    setIsRequesting(true);
    try {
      const txid = await requestFaucet(requestAmount);
      Alert.alert(
        'Coins Received!',
        `${requestAmount} test SHR has been sent to your wallet.\n\nTransaction: ${txid.substring(0, 16)}...`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Request Failed', (error as Error).message);
    } finally {
      setIsRequesting(false);
    }
  };

  // Mainnet not available view
  if (network === 'mainnet') {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundOrbs}>
          <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        </View>
        <View style={styles.notAvailable}>
          <GlassCard style={styles.notAvailableCard} intensity="medium">
            <Text style={styles.notAvailableIcon}>🚫</Text>
            <Text style={styles.notAvailableTitle}>Not Available</Text>
            <Text style={styles.notAvailableText}>
              The faucet is only available on testnet and regtest networks.
            </Text>
            <Pressable>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.switchButton}
              >
                <Text style={styles.switchButtonText}>Switch to Testnet</Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        </View>
      </View>
    );
  }

  const currentBalance = balance ? parseFloat(balance.total) : 0;

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
        <Animated.View 
          style={[
            styles.dropOrb,
            {
              opacity: dropAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [{
                translateY: dropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 100],
                }),
              }],
            },
          ]} 
        />
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* Network Badge */}
          <View style={styles.networkBadgeContainer}>
            <LinearGradient
              colors={network === 'testnet' 
                ? ['#F59E0B', '#D97706'] 
                : ['#A855F7', '#7C3AED']}
              style={styles.networkBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.networkIcon}>
                {network === 'testnet' ? '🧪' : '🔧'}
              </Text>
              <Text style={styles.networkText}>{network.toUpperCase()}</Text>
            </LinearGradient>
          </View>

          {/* Faucet Header */}
          <GlassCard style={styles.headerCard} intensity="medium" glow glowColor="rgba(6, 182, 212, 0.3)">
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.15)', 'rgba(59, 130, 246, 0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.headerIcon}>💧</Text>
            <Text style={styles.headerTitle}>Test Coin Faucet</Text>
            <Text style={styles.headerDescription}>
              Request free test SHR to experiment with the wallet. 
              These coins have no real value.
            </Text>
          </GlassCard>

          {/* Current Balance */}
          <GlassCard style={styles.balanceCard} intensity="light">
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <AnimatedBalance 
              value={currentBalance}
              decimals={4}
              style={styles.balanceAmount}
            />
          </GlassCard>

          {/* Request Form */}
          <GlassCard style={styles.formCard} intensity="light">
            <Text style={styles.formLabel}>Request Amount</Text>
            
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="100"
                placeholderTextColor={colors.text.muted}
              />
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyLabel}>SHR</Text>
              </View>
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setAmount(value)}
                >
                  {amount === value ? (
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.quickAmountButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.quickAmountTextActive}>{value}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.quickAmountButtonInactive}>
                      <Text style={styles.quickAmountText}>{value}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Receiving Address */}
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Receiving Address</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {activeAccount?.address || 'No address'}
              </Text>
            </View>

            {/* Request Button */}
            <Pressable
              onPress={handleRequest}
              disabled={isRequesting}
            >
              <LinearGradient
                colors={isRequesting ? ['#444', '#333'] : ['#06B6D4', '#0891B2']}
                style={[styles.requestButton, isRequesting && styles.requestButtonDisabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isRequesting ? (
                  <PulsingDot />
                ) : (
                  <>
                    <Text style={styles.requestIcon}>💧</Text>
                    <Text style={styles.requestButtonText}>Request {amount} SHR</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </GlassCard>

          {/* Limits Info */}
          <GlassCard style={styles.limitsCard} intensity="light">
            <Text style={styles.limitsTitle}>Faucet Limits</Text>
            <View style={styles.limitRow}>
              <View style={styles.limitInfo}>
                <Text style={styles.limitIcon}>📉</Text>
                <Text style={styles.limitLabel}>Minimum</Text>
              </View>
              <Text style={styles.limitValue}>1 SHR</Text>
            </View>
            <View style={styles.limitRow}>
              <View style={styles.limitInfo}>
                <Text style={styles.limitIcon}>📈</Text>
                <Text style={styles.limitLabel}>Maximum</Text>
              </View>
              <Text style={styles.limitValue}>1,000 SHR</Text>
            </View>
            <View style={styles.limitRow}>
              <View style={styles.limitInfo}>
                <Text style={styles.limitIcon}>⭐</Text>
                <Text style={styles.limitLabel}>Default</Text>
              </View>
              <Text style={styles.limitValue}>100 SHR</Text>
            </View>
          </GlassCard>

          {/* Info Banner */}
          <GlassCard style={styles.infoCard} intensity="light">
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Test coins are for development and testing purposes only. 
                They have no real-world value and cannot be traded.
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.ScrollView>
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
    top: -100,
    left: -100,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    right: -50,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  dropOrb: {
    width: 20,
    height: 20,
    top: 100,
    left: '50%',
    marginLeft: -10,
    backgroundColor: 'rgba(6, 182, 212, 0.6)',
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  networkBadgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  networkIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerDescription: {
    color: colors.text.secondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22,
  },
  balanceCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceLabel: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  formLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  amountInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  currencyBadge: {
    paddingHorizontal: spacing.md,
  },
  currencyLabel: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  quickAmountButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 50,
    alignItems: 'center',
  },
  quickAmountButtonInactive: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.glass.light,
    minWidth: 50,
    alignItems: 'center',
  },
  quickAmountText: {
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  quickAmountTextActive: {
    color: '#fff',
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  addressContainer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderLight,
    marginBottom: spacing.md,
  },
  addressLabel: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  addressText: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    fontFamily: 'monospace',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.button,
    shadowColor: '#06B6D4',
  },
  requestButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
  },
  requestIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  limitsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  limitsTitle: {
    color: colors.text.primary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  limitLabel: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
  },
  limitValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  notAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notAvailableCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notAvailableIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  notAvailableTitle: {
    color: colors.text.primary,
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  notAvailableText: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  switchButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  switchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.fontSize,
  },
});

export default FaucetScreen;
