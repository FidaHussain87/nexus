/**
 * SHURIUM Mobile Wallet - Send Screen
 * Premium glassmorphism design with smooth animations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../store/wallet';
import { validateAddress, parseShuriumURI } from '../utils/crypto';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, GradientButton, AnimatedBalance, PulsingDot } from '../components/ui';

export const SendScreen: React.FC = () => {
  const navigation = useNavigation();
  const { balance, network, sendTransaction } = useWalletStore();
  
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const availableBalance = balance ? parseFloat(balance.total) : 0;

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
  }, []);

  const validateAddressInput = useCallback((value: string) => {
    setAddress(value);
    setAddressError(null);
    
    if (value.length === 0) return;
    
    // Check for SHURIUM URI format
    if (value.toLowerCase().startsWith('shurium:')) {
      const parsed = parseShuriumURI(value);
      if (parsed) {
        setAddress(parsed.address);
        if (parsed.amount) {
          setAmount(String(parsed.amount));
        }
        if (parsed.message) {
          setMemo(parsed.message);
        }
        return;
      }
    }
    
    if (!validateAddress(value, network)) {
      setAddressError('Invalid SHURIUM address');
    }
  }, [network]);

  const validateAmountInput = useCallback((value: string) => {
    setAmount(value);
    setAmountError(null);
    
    if (value.length === 0) return;
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Enter a valid amount');
      return;
    }
    
    if (numValue > availableBalance) {
      setAmountError('Insufficient balance');
      return;
    }
    
    if (numValue < 0.00001) {
      setAmountError('Amount too small (min: 0.00001 SHR)');
      return;
    }
  }, [availableBalance]);

  const setMaxAmount = useCallback(() => {
    const maxAmount = Math.max(0, availableBalance - 0.0001);
    setAmount(maxAmount.toFixed(8));
    validateAmountInput(maxAmount.toFixed(8));
  }, [availableBalance, validateAmountInput]);

  const handleSend = async () => {
    if (!address || addressError) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }
    
    if (!amount || amountError) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    const numAmount = parseFloat(amount);
    
    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} SHR to:\n${address.substring(0, 20)}...${address.substring(address.length - 8)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            setIsSending(true);
            try {
              const txid = await sendTransaction(address, numAmount, memo || undefined);
              Alert.alert(
                'Transaction Sent',
                `Your transaction has been broadcast.\n\nTXID: ${txid.substring(0, 16)}...`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Transaction Failed', (error as Error).message);
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  const handleScanQR = () => {
    Alert.alert('QR Scanner', 'QR scanning will be available in the next update');
  };

  const isFormValid = address && amount && !addressError && !amountError && !isSending;

  return (
    <View style={styles.container}>
      {/* Animated Background Orbs */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }] 
          }}>
            {/* Balance Card */}
            <GlassCard style={styles.balanceCard} intensity="medium" animated>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <AnimatedBalance 
                value={availableBalance} 
                style={styles.balanceAmount}
                decimals={8}
              />
            </GlassCard>

            {/* Address Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <GlassCard style={styles.inputCard} intensity="light">
                <View style={styles.addressInputRow}>
                  <TextInput
                    style={[styles.input, addressError && styles.inputError]}
                    placeholder="SHR address or SHURIUM URI"
                    placeholderTextColor={colors.text.muted}
                    value={address}
                    onChangeText={validateAddressInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.scanButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.scanButtonText}>QR</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </GlassCard>
              {addressError && (
                <View style={styles.errorContainer}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>{addressError}</Text>
                </View>
              )}
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <View style={styles.amountLabelRow}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TouchableOpacity onPress={setMaxAmount}>
                  <LinearGradient
                    colors={gradients.primary}
                    style={styles.maxButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.maxButtonText}>MAX</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <GlassCard style={styles.inputCard} intensity="light">
                <View style={styles.amountInputRow}>
                  <TextInput
                    style={[styles.input, styles.amountInput, amountError && styles.inputError]}
                    placeholder="0.00000000"
                    placeholderTextColor={colors.text.muted}
                    value={amount}
                    onChangeText={validateAmountInput}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyLabel}>SHR</Text>
                  </View>
                </View>
              </GlassCard>
              {amountError && (
                <View style={styles.errorContainer}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>{amountError}</Text>
                </View>
              )}
            </View>

            {/* Memo Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Memo (Optional)</Text>
              <GlassCard style={styles.inputCard} intensity="light">
                <TextInput
                  style={styles.input}
                  placeholder="Add a note"
                  placeholderTextColor={colors.text.muted}
                  value={memo}
                  onChangeText={setMemo}
                  maxLength={256}
                />
              </GlassCard>
            </View>

            {/* Fee Estimate */}
            <GlassCard style={styles.feeCard} intensity="light">
              <View style={styles.feeRow}>
                <View style={styles.feeInfo}>
                  <Text style={styles.feeLabel}>Estimated Fee</Text>
                  <Text style={styles.feeDescription}>Network transaction fee</Text>
                </View>
                <View style={styles.feeAmount}>
                  <Text style={styles.feeValue}>~0.0001</Text>
                  <Text style={styles.feeCurrency}>SHR</Text>
                </View>
              </View>
            </GlassCard>

            {/* Send Button */}
            <Pressable
              onPressIn={() => {
                Animated.spring(buttonScaleAnim, {
                  toValue: 0.96,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(buttonScaleAnim, {
                  toValue: 1,
                  useNativeDriver: true,
                }).start();
              }}
              onPress={handleSend}
              disabled={!isFormValid}
            >
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <LinearGradient
                  colors={isFormValid ? ['#EF4444', '#DC2626'] : ['#444', '#333']}
                  style={[styles.sendButton, !isFormValid && styles.sendButtonDisabled]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSending ? (
                    <PulsingDot />
                  ) : (
                    <>
                      <Text style={styles.sendIcon}>↑</Text>
                      <Text style={styles.sendButtonText}>Send SHR</Text>
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </Pressable>

            {/* Network Warning */}
            {network !== 'mainnet' && (
              <GlassCard style={styles.warningCard} intensity="light">
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.warningContent}>
                  <View style={styles.warningDot} />
                  <Text style={styles.warningText}>
                    You are on {network.toUpperCase()}. These are not real coins.
                  </Text>
                </View>
              </GlassCard>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    right: -100,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  balanceCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inputSection: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  inputCard: {
    overflow: 'hidden',
  },
  addressInputRow: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },
  inputError: {
    borderLeftWidth: 2,
    borderLeftColor: colors.error.base,
  },
  scanButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  maxButtonGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  maxButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  currencyBadge: {
    backgroundColor: colors.glass.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  currencyLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error.base,
    marginRight: spacing.xs,
  },
  errorText: {
    color: colors.error.base,
    fontSize: typography.small.fontSize,
  },
  feeCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeInfo: {},
  feeLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
  },
  feeDescription: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
  },
  feeAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  feeValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginRight: 4,
  },
  feeCurrency: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.button,
    shadowColor: '#EF4444',
  },
  sendButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  warningCard: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning.base,
    marginRight: spacing.sm,
  },
  warningText: {
    color: colors.warning.base,
    fontSize: typography.small.fontSize,
    flex: 1,
  },
});

export default SendScreen;
