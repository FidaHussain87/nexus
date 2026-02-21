/**
 * SHURIUM Mobile Wallet - UBI Screen
 * Premium glassmorphism design for Universal Basic Income
 * SHURIUM's flagship feature for financial inclusion
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWalletStore } from '../store/wallet';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, GradientButton, PulsingDot, StatusPill, AnimatedBalance, ProgressRing } from '../components/ui';

// Verification level colors and descriptions
const VERIFICATION_LEVELS = {
  none: { 
    color: colors.text.muted, 
    gradient: ['#6B7280', '#4B5563'],
    label: 'Not Verified', 
    description: 'Register your identity to claim UBI',
    icon: '🔒',
  },
  basic: { 
    color: '#F59E0B', 
    gradient: ['#F59E0B', '#D97706'],
    label: 'Basic', 
    description: 'Limited UBI eligibility',
    icon: '🥉',
  },
  standard: { 
    color: '#3B82F6', 
    gradient: ['#3B82F6', '#2563EB'],
    label: 'Standard', 
    description: 'Standard UBI rate',
    icon: '🥈',
  },
  enhanced: { 
    color: '#10B981', 
    gradient: ['#10B981', '#059669'],
    label: 'Enhanced', 
    description: 'Enhanced UBI rate',
    icon: '🥇',
  },
  maximum: { 
    color: '#A855F7', 
    gradient: ['#A855F7', '#7C3AED'],
    label: 'Maximum', 
    description: 'Maximum UBI rate',
    icon: '👑',
  },
};

export const UBIScreen: React.FC = () => {
  const {
    ubiInfo,
    accounts,
    activeAccountId,
    refreshUBIInfo,
    claimUBI,
    lastError,
    clearError,
  } = useWalletStore();

  const [refreshing, setRefreshing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  useEffect(() => {
    refreshUBIInfo();
    
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

    // Pulsing animation for claim button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUBIInfo();
    setRefreshing(false);
  }, [refreshUBIInfo]);

  const handleClaimUBI = async () => {
    if (!ubiInfo?.isEligible) {
      Alert.alert('Not Eligible', 'You are not currently eligible for UBI claims');
      return;
    }

    const claimable = parseFloat(ubiInfo.claimableAmount);
    if (claimable <= 0) {
      Alert.alert('No UBI Available', 'You have no UBI to claim at this time');
      return;
    }

    Alert.alert(
      'Claim UBI',
      `Claim ${ubiInfo.claimableAmount} SHR?\n\nThis is your Universal Basic Income allocation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setIsClaiming(true);
            try {
              const txid = await claimUBI();
              Alert.alert(
                'UBI Claimed!',
                `Successfully claimed ${ubiInfo.claimableAmount} SHR\n\nTransaction: ${txid.substring(0, 16)}...`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Claim Failed', (error as Error).message);
            } finally {
              setIsClaiming(false);
            }
          },
        },
      ]
    );
  };

  const getVerificationLevel = () => {
    const level = ubiInfo?.verificationLevel?.toLowerCase() || 'none';
    return VERIFICATION_LEVELS[level as keyof typeof VERIFICATION_LEVELS] || VERIFICATION_LEVELS.none;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeUntilNextClaim = () => {
    if (!ubiInfo?.nextClaimTime) return null;
    const now = Date.now() / 1000;
    const diff = ubiInfo.nextClaimTime - now;
    if (diff <= 0) return 'Available now';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const verificationLevel = getVerificationLevel();
  const claimableAmount = parseFloat(ubiInfo?.claimableAmount || '0');

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb3, { opacity: fadeAnim }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.start}
          />
        }
      >
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }}>
          {/* Error Banner */}
          {lastError && (
            <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.errorText}>{lastError}</Text>
            </TouchableOpacity>
          )}

          {/* Hero Header Card */}
          <GlassCard style={styles.heroCard} intensity="heavy" glow glowColor="rgba(168, 85, 247, 0.4)">
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.3)', 'rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.heroIcon}>🌍</Text>
            <Text style={styles.heroTitle}>Universal Basic Income</Text>
            <Text style={styles.heroDescription}>
              Financial inclusion for everyone. Funded by network emissions, 
              distributed fairly to all verified participants.
            </Text>
          </GlassCard>

          {/* Identity Status Card */}
          <GlassCard style={styles.identityCard} intensity="medium">
            <View style={styles.identityHeader}>
              <Text style={styles.sectionTitle}>Identity Status</Text>
              <LinearGradient
                colors={verificationLevel.gradient}
                style={styles.verificationBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.verificationIcon}>{verificationLevel.icon}</Text>
                <Text style={styles.verificationText}>{verificationLevel.label}</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.verificationDescription}>{verificationLevel.description}</Text>

            {ubiInfo?.identityId ? (
              <View style={styles.identityDetails}>
                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>Identity ID</Text>
                  <Text style={styles.identityValue} numberOfLines={1}>
                    {ubiInfo.identityId.substring(0, 20)}...
                  </Text>
                </View>
                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>Registered</Text>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success.base }]} />
                    <Text style={[styles.identityValue, { color: colors.success.base }]}>Yes</Text>
                  </View>
                </View>
                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>UBI Eligible</Text>
                  <View style={styles.statusIndicator}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: ubiInfo.isEligible ? colors.success.base : colors.error.base }
                    ]} />
                    <Text style={[
                      styles.identityValue, 
                      { color: ubiInfo.isEligible ? colors.success.base : colors.error.base }
                    ]}>
                      {ubiInfo.isEligible ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.notRegistered}>
                <Text style={styles.notRegisteredText}>
                  Your identity is not yet registered on the SHURIUM network.
                </Text>
                <Pressable>
                  <LinearGradient
                    colors={['#A855F7', '#7C3AED']}
                    style={styles.registerButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.registerIcon}>🔐</Text>
                    <Text style={styles.registerButtonText}>Register Identity</Text>
                  </LinearGradient>
                </Pressable>
                <Text style={styles.registerHint}>
                  Uses zero-knowledge proof for privacy-preserving verification
                </Text>
              </View>
            )}
          </GlassCard>

          {/* Claim UBI Card */}
          {ubiInfo?.isEligible && (
            <Animated.View style={{ transform: [{ scale: claimableAmount > 0 ? pulseAnim : 1 }] }}>
              <GlassCard 
                style={styles.claimCard} 
                intensity="medium" 
                glow={claimableAmount > 0}
                glowColor="rgba(16, 185, 129, 0.4)"
              >
                <LinearGradient
                  colors={claimableAmount > 0 
                    ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']
                    : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.sectionTitle}>Claim Your UBI</Text>
                
                <View style={styles.claimAmountContainer}>
                  <Text style={styles.claimAmountLabel}>Available to Claim</Text>
                  <View style={styles.claimAmountRow}>
                    <AnimatedBalance 
                      value={claimableAmount}
                      decimals={4}
                      suffix=""
                      style={styles.claimAmountValue}
                    />
                    <Text style={styles.claimAmountCurrency}>SHR</Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleClaimUBI}
                  disabled={claimableAmount <= 0 || isClaiming}
                >
                  <LinearGradient
                    colors={claimableAmount > 0 ? gradients.success : ['#444', '#333']}
                    style={[
                      styles.claimButton,
                      (claimableAmount <= 0 || isClaiming) && styles.claimButtonDisabled
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isClaiming ? (
                      <PulsingDot />
                    ) : (
                      <>
                        <Text style={styles.claimButtonIcon}>🎁</Text>
                        <Text style={styles.claimButtonText}>
                          {claimableAmount > 0 
                            ? `Claim ${ubiInfo.claimableAmount} SHR`
                            : 'No UBI Available'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Timing Info */}
                <View style={styles.claimTiming}>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingLabel}>Last Claim</Text>
                    <Text style={styles.timingValue}>{formatDate(ubiInfo.lastClaimTime)}</Text>
                  </View>
                  <View style={styles.timingDivider} />
                  <View style={styles.timingItem}>
                    <Text style={styles.timingLabel}>Next Claim</Text>
                    <Text style={[styles.timingValue, { color: colors.success.base }]}>
                      {getTimeUntilNextClaim() || 'Register identity'}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Statistics Card */}
          <GlassCard style={styles.statsCard} intensity="light">
            <Text style={styles.sectionTitle}>Your UBI Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statValue}>{ubiInfo?.totalClaimed || '0'}</Text>
                <Text style={styles.statLabel}>Total Claimed (SHR)</Text>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(6, 182, 212, 0.1)', 'rgba(6, 182, 212, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statValue}>
                  {ubiInfo?.claimHistory?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Claims Made</Text>
              </View>
            </View>
          </GlassCard>

          {/* Claim History */}
          {ubiInfo?.claimHistory && ubiInfo.claimHistory.length > 0 && (
            <GlassCard style={styles.historyCard} intensity="light">
              <Text style={styles.sectionTitle}>Claim History</Text>
              
              {ubiInfo.claimHistory.slice(0, 5).map((claim, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <LinearGradient
                      colors={gradients.success}
                      style={styles.historyIconGradient}
                    >
                      <Text style={styles.historyIconText}>✓</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyAmount}>+{claim.amount} SHR</Text>
                    <Text style={styles.historyDate}>
                      {new Date(claim.timestamp * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.historyTxid}>
                    {claim.txid.substring(0, 8)}...
                  </Text>
                </View>
              ))}
            </GlassCard>
          )}

          {/* How UBI Works */}
          <GlassCard style={styles.infoCard} intensity="light">
            <Text style={styles.sectionTitle}>How SHURIUM UBI Works</Text>
            
            {[
              { num: '1', title: 'Register Your Identity', desc: 'Create a privacy-preserving identity using zero-knowledge proofs.', icon: '🔐' },
              { num: '2', title: 'Get Verified', desc: 'Higher verification levels unlock higher UBI rates.', icon: '✅' },
              { num: '3', title: 'Claim Regularly', desc: 'UBI accrues over time. Claim whenever you need it.', icon: '⏰' },
              { num: '4', title: 'Use or Stake', desc: 'Spend, save, or stake your UBI to earn more.', icon: '💎' },
            ].map((step, index) => (
              <View key={index} style={styles.infoItem}>
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.infoNumber}
                >
                  <Text style={styles.infoNumberText}>{step.num}</Text>
                </LinearGradient>
                <View style={styles.infoContent}>
                  <View style={styles.infoTitleRow}>
                    <Text style={styles.infoTitle}>{step.title}</Text>
                    <Text style={styles.infoIcon}>{step.icon}</Text>
                  </View>
                  <Text style={styles.infoDescription}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </GlassCard>

          {/* Verification Levels */}
          <GlassCard style={styles.levelsCard} intensity="light">
            <Text style={styles.sectionTitle}>Verification Levels</Text>
            
            {Object.entries(VERIFICATION_LEVELS).filter(([key]) => key !== 'none').map(([key, level]) => (
              <View key={key} style={styles.levelItem}>
                <LinearGradient
                  colors={level.gradient}
                  style={styles.levelDot}
                />
                <View style={styles.levelInfo}>
                  <View style={styles.levelHeader}>
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    <Text style={[styles.levelName, { color: level.color }]}>{level.label}</Text>
                  </View>
                  <Text style={styles.levelDescription}>{level.description}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
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
    width: 400,
    height: 400,
    top: -150,
    left: -150,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  orb2: {
    width: 300,
    height: 300,
    top: 200,
    right: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  orb3: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  errorBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#fff',
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  heroCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroDescription: {
    color: colors.text.secondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  identityCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verificationIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  verificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  verificationDescription: {
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.md,
  },
  identityDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderLight,
    paddingTop: spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  identityLabel: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
  },
  identityValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  notRegistered: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderLight,
  },
  notRegisteredText: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.button,
    shadowColor: '#A855F7',
  },
  registerIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  registerHint: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    textAlign: 'center',
  },
  claimCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  claimAmountContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  claimAmountLabel: {
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
  },
  claimAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  claimAmountValue: {
    color: colors.success.base,
    fontSize: 42,
    fontWeight: '800',
  },
  claimAmountCurrency: {
    color: colors.success.base,
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginLeft: spacing.sm,
    opacity: 0.7,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.button,
    shadowColor: colors.success.base,
  },
  claimButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  claimButtonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  claimTiming: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderLight,
    paddingTop: spacing.md,
  },
  timingItem: {
    flex: 1,
    alignItems: 'center',
  },
  timingLabel: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  timingValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  timingDivider: {
    width: 1,
    backgroundColor: colors.glass.borderLight,
  },
  statsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  historyCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  historyIcon: {
    marginRight: spacing.md,
  },
  historyIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIconText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    color: colors.success.base,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  historyDate: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
  },
  historyTxid: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    fontFamily: 'monospace',
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoContent: {
    flex: 1,
  },
  infoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoTitle: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  infoIcon: {
    fontSize: 16,
  },
  infoDescription: {
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  levelsCard: {
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  levelName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  levelDescription: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
});

export default UBIScreen;
