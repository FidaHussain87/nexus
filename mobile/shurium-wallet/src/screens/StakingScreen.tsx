/**
 * SHURIUM Mobile Wallet - Staking Screen
 * Premium glassmorphism design for staking management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWalletStore } from '../store/wallet';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, GradientButton, PulsingDot, StatusPill, ProgressRing } from '../components/ui';
import type { ValidatorInfo, DelegationInfo } from '../types';

type TabType = 'overview' | 'validators' | 'delegations';

const TAB_ITEMS: { key: TabType; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'validators', label: 'Validators', icon: '🔐' },
  { key: 'delegations', label: 'My Stakes', icon: '💎' },
];

export const StakingScreen: React.FC = () => {
  const {
    stakingInfo,
    balance,
    refreshStakingInfo,
    stake,
    unstake,
    claimStakingRewards,
    lastError,
    clearError,
  } = useWalletStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo | null>(null);
  const [delegateAmount, setDelegateAmount] = useState('');
  const [isUnstaking, setIsUnstaking] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    refreshStakingInfo();
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
    ]).start();
  }, []);

  useEffect(() => {
    const tabIndex = TAB_ITEMS.findIndex(t => t.key === activeTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      damping: 20,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStakingInfo();
    setRefreshing(false);
  }, [refreshStakingInfo]);

  const handleDelegate = async () => {
    if (!selectedValidator || !delegateAmount) return;
    
    const amount = parseFloat(delegateAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const availableBalance = balance ? parseFloat(balance.total) : 0;
    if (amount > availableBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    Alert.alert(
      'Confirm Delegation',
      `Delegate ${delegateAmount} SHR to ${selectedValidator.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delegate',
          onPress: async () => {
            setIsLoading(true);
            try {
              await stake(selectedValidator.id, amount);
              Alert.alert('Success', 'Delegation successful!');
              setShowDelegateModal(false);
              setDelegateAmount('');
              setSelectedValidator(null);
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUndelegate = async () => {
    if (!selectedValidator || !delegateAmount) return;
    
    const amount = parseFloat(delegateAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      'Confirm Undelegation',
      `Undelegate ${delegateAmount} SHR from ${selectedValidator.name}?\n\nNote: There may be an unbonding period.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undelegate',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await unstake(selectedValidator.id, amount);
              Alert.alert('Success', 'Undelegation initiated!');
              setShowDelegateModal(false);
              setDelegateAmount('');
              setSelectedValidator(null);
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClaimRewards = async () => {
    const rewards = parseFloat(stakingInfo?.rewards || '0');
    if (rewards <= 0) {
      Alert.alert('No Rewards', 'You have no rewards to claim');
      return;
    }

    Alert.alert(
      'Claim Rewards',
      `Claim ${stakingInfo?.rewards} SHR in staking rewards?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setIsLoading(true);
            try {
              await claimStakingRewards();
              Alert.alert('Success', 'Rewards claimed successfully!');
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const openDelegateModal = (validator: ValidatorInfo, unstaking: boolean = false) => {
    setSelectedValidator(validator);
    setIsUnstaking(unstaking);
    setDelegateAmount('');
    setShowDelegateModal(true);
  };

  // ============================================================================
  // Overview Tab
  // ============================================================================
  const renderOverview = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      {/* Staking Status Card */}
      <GlassCard style={styles.statusCard} intensity="medium" glow={stakingInfo?.isStaking}>
        <LinearGradient
          colors={stakingInfo?.isStaking 
            ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']
            : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.statusHeader}>
          <StatusPill 
            status={stakingInfo?.isStaking ? 'success' : 'info'} 
            text={stakingInfo?.isStaking ? 'Staking Active' : 'Not Staking'} 
          />
        </View>
      </GlassCard>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <GlassCard style={styles.statCard} intensity="light">
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.statIcon}>💎</Text>
          <Text style={styles.statLabel}>Total Staked</Text>
          <Text style={styles.statValue}>{stakingInfo?.totalStaked || '0'}</Text>
          <Text style={styles.statCurrency}>SHR</Text>
        </GlassCard>
        
        <GlassCard style={styles.statCard} intensity="light">
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.statIcon}>🎁</Text>
          <Text style={styles.statLabel}>Rewards</Text>
          <Text style={[styles.statValue, { color: colors.success.base }]}>
            {stakingInfo?.rewards || '0'}
          </Text>
          <Text style={styles.statCurrency}>SHR</Text>
        </GlassCard>
      </View>

      {/* Claim Rewards Button */}
      {parseFloat(stakingInfo?.rewards || '0') > 0 && (
        <Pressable onPress={handleClaimRewards} disabled={isLoading}>
          <LinearGradient
            colors={gradients.success}
            style={styles.claimButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <PulsingDot />
            ) : (
              <>
                <Text style={styles.claimIcon}>🎁</Text>
                <Text style={styles.claimButtonText}>
                  Claim {stakingInfo?.rewards} SHR
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      )}

      {/* Quick Action */}
      <GlassCard style={styles.quickActionCard} intensity="light">
        <View style={styles.quickActionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <Pressable onPress={() => setActiveTab('validators')}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.quickActionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.quickActionIcon}>🔐</Text>
            <Text style={styles.quickActionText}>Find Validators to Stake</Text>
            <Text style={styles.quickActionArrow}>→</Text>
          </LinearGradient>
        </Pressable>
      </GlassCard>

      {/* Delegations Summary */}
      {stakingInfo?.delegations && stakingInfo.delegations.length > 0 && (
        <GlassCard style={styles.delegationsSummary} intensity="light">
          <Text style={styles.sectionTitle}>Active Delegations</Text>
          {stakingInfo.delegations.slice(0, 3).map((del, index) => (
            <View key={index} style={styles.delegationItem}>
              <View style={styles.delegationInfo}>
                <Text style={styles.delegationValidator}>{del.validatorName}</Text>
              </View>
              <Text style={styles.delegationAmount}>{del.amount} SHR</Text>
            </View>
          ))}
          {stakingInfo.delegations.length > 3 && (
            <TouchableOpacity onPress={() => setActiveTab('delegations')}>
              <Text style={styles.seeMoreText}>
                +{stakingInfo.delegations.length - 3} more
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      )}
    </Animated.View>
  );

  // ============================================================================
  // Validators Tab
  // ============================================================================
  const renderValidators = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      {!stakingInfo?.validators || stakingInfo.validators.length === 0 ? (
        <GlassCard style={styles.emptyState} intensity="light">
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No validators found</Text>
          <Text style={styles.emptySubtext}>
            Pull to refresh or check your connection
          </Text>
        </GlassCard>
      ) : (
        stakingInfo.validators.map((validator) => (
          <GlassCard key={validator.id} style={styles.validatorCard} intensity="light">
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.validatorHeader}>
              <View style={styles.validatorInfo}>
                <View style={styles.validatorNameRow}>
                  <View style={styles.validatorIcon}>
                    <Text>🔐</Text>
                  </View>
                  <View>
                    <Text style={styles.validatorName}>{validator.name}</Text>
                    <Text style={styles.validatorAddress} numberOfLines={1}>
                      {validator.address.substring(0, 16)}...
                    </Text>
                  </View>
                </View>
              </View>
              <LinearGradient
                colors={validator.isActive ? gradients.success : ['#EF4444', '#DC2626']}
                style={styles.validatorStatus}
              >
                <Text style={styles.validatorStatusText}>
                  {validator.isActive ? 'Active' : 'Inactive'}
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.validatorStats}>
              <View style={styles.validatorStat}>
                <Text style={styles.validatorStatLabel}>Commission</Text>
                <Text style={styles.validatorStatValue}>{validator.commission}%</Text>
              </View>
              <View style={styles.validatorStat}>
                <Text style={styles.validatorStatLabel}>Total Staked</Text>
                <Text style={styles.validatorStatValue}>{validator.totalStaked}</Text>
              </View>
              <View style={styles.validatorStat}>
                <Text style={styles.validatorStatLabel}>Delegators</Text>
                <Text style={styles.validatorStatValue}>{validator.delegatorCount}</Text>
              </View>
              <View style={styles.validatorStat}>
                <Text style={styles.validatorStatLabel}>Uptime</Text>
                <Text style={[styles.validatorStatValue, { color: colors.success.base }]}>
                  {validator.uptime}%
                </Text>
              </View>
            </View>

            <Pressable onPress={() => openDelegateModal(validator, false)}>
              <LinearGradient
                colors={gradients.primary}
                style={styles.delegateButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.delegateButtonText}>Delegate</Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        ))
      )}
    </Animated.View>
  );

  // ============================================================================
  // Delegations Tab
  // ============================================================================
  const renderDelegations = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      {!stakingInfo?.delegations || stakingInfo.delegations.length === 0 ? (
        <GlassCard style={styles.emptyState} intensity="light">
          <Text style={styles.emptyIcon}>💎</Text>
          <Text style={styles.emptyText}>No active delegations</Text>
          <Text style={styles.emptySubtext}>
            Stake SHR with validators to earn rewards
          </Text>
          <Pressable onPress={() => setActiveTab('validators')}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.startStakingButton}
            >
              <Text style={styles.startStakingText}>Start Staking</Text>
            </LinearGradient>
          </Pressable>
        </GlassCard>
      ) : (
        stakingInfo.delegations.map((delegation, index) => (
          <GlassCard key={index} style={styles.delegationCard} intensity="light">
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.05)', 'rgba(59, 130, 246, 0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.delegationCardHeader}>
              <View>
                <Text style={styles.delegationValidatorName}>
                  {delegation.validatorName}
                </Text>
                <Text style={styles.delegationStarted}>
                  Since {new Date(delegation.startTime * 1000).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.delegationRewardsBadge}>
                <Text style={styles.delegationRewardsText}>
                  +{delegation.rewards} SHR
                </Text>
              </View>
            </View>
            
            <View style={styles.delegationDetails}>
              <View style={styles.delegationDetailItem}>
                <Text style={styles.delegationDetailLabel}>Staked</Text>
                <Text style={styles.delegationDetailValue}>{delegation.amount} SHR</Text>
              </View>
            </View>

            <View style={styles.delegationActions}>
              <Pressable 
                style={styles.delegationActionWrapper}
                onPress={() => {
                  const validator = stakingInfo?.validators?.find(
                    v => v.id === delegation.validatorId
                  );
                  if (validator) openDelegateModal(validator, false);
                }}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.delegationAction}
                >
                  <Text style={styles.delegationActionText}>Add More</Text>
                </LinearGradient>
              </Pressable>
              <Pressable 
                style={styles.delegationActionWrapper}
                onPress={() => {
                  const validator = stakingInfo?.validators?.find(
                    v => v.id === delegation.validatorId
                  );
                  if (validator) openDelegateModal(validator, true);
                }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.delegationAction}
                >
                  <Text style={styles.delegationActionText}>Undelegate</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </GlassCard>
        ))
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
      </View>

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

      {/* Tab Bar */}
      <GlassCard style={styles.tabBar} intensity="medium">
        <View style={styles.tabsContainer}>
          {TAB_ITEMS.map((tab, index) => (
            <Pressable 
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabIcon,
                activeTab === tab.key && styles.tabIconActive
              ]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.tabText, 
                activeTab === tab.key && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
          <Animated.View 
            style={[
              styles.tabIndicator,
              {
                transform: [{
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, 110, 220],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.tabIndicatorGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </GlassCard>

      {/* Content */}
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'validators' && renderValidators()}
        {activeTab === 'delegations' && renderDelegations()}
      </ScrollView>

      {/* Delegate/Undelegate Modal */}
      <Modal
        visible={showDelegateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDelegateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity="heavy">
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            
            <Text style={styles.modalTitle}>
              {isUnstaking ? 'Undelegate from' : 'Delegate to'}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedValidator?.name}</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Amount (SHR)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="0.00000000"
                  placeholderTextColor={colors.text.muted}
                  value={delegateAmount}
                  onChangeText={setDelegateAmount}
                  keyboardType="decimal-pad"
                />
                {!isUnstaking && balance && (
                  <TouchableOpacity 
                    onPress={() => setDelegateAmount(balance.total)}
                    style={styles.maxButton}
                  >
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.maxButtonGradient}
                    >
                      <Text style={styles.maxButtonText}>MAX</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {!isUnstaking && (
              <Text style={styles.modalHint}>
                Available: {balance?.total || '0'} SHR
              </Text>
            )}

            <View style={styles.modalActions}>
              <Pressable 
                style={styles.modalCancelButton}
                onPress={() => setShowDelegateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={isUnstaking ? handleUndelegate : handleDelegate}
                disabled={isLoading}
                style={styles.modalConfirmWrapper}
              >
                <LinearGradient
                  colors={isUnstaking ? ['#EF4444', '#DC2626'] : gradients.primary}
                  style={styles.modalConfirmButton}
                >
                  {isLoading ? (
                    <PulsingDot />
                  ) : (
                    <Text style={styles.modalConfirmText}>
                      {isUnstaking ? 'Undelegate' : 'Delegate'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
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
    right: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  errorBanner: {
    padding: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  errorText: {
    color: '#fff',
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  tabBar: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.xs,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    zIndex: 1,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabText: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 110,
    height: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  tabIndicatorGradient: {
    flex: 1,
    opacity: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
  },
  statusCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statusHeader: {
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  statCurrency: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    ...shadows.button,
    shadowColor: colors.success.base,
  },
  claimIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  quickActionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '600',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  quickActionText: {
    flex: 1,
    color: '#fff',
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  quickActionArrow: {
    color: '#fff',
    fontSize: 18,
  },
  delegationsSummary: {
    padding: spacing.md,
  },
  delegationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  delegationInfo: {},
  delegationValidator: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },
  delegationAmount: {
    color: colors.success.base,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  seeMoreText: {
    color: colors.primary.start,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  validatorCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  validatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  validatorInfo: {
    flex: 1,
  },
  validatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  validatorName: {
    color: colors.text.primary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '600',
  },
  validatorAddress: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
  validatorStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  validatorStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  validatorStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  validatorStat: {
    width: '50%',
    paddingVertical: spacing.xs,
  },
  validatorStatLabel: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
  },
  validatorStatValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  delegateButton: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  delegateButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  delegationCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  delegationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  delegationValidatorName: {
    color: colors.text.primary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: '600',
  },
  delegationStarted: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
  delegationRewardsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success.base,
  },
  delegationRewardsText: {
    color: colors.success.base,
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
  delegationDetails: {
    marginBottom: spacing.md,
  },
  delegationDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  delegationDetailLabel: {
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
  },
  delegationDetailValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  delegationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  delegationActionWrapper: {
    flex: 1,
  },
  delegationAction: {
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  delegationActionText: {
    color: '#fff',
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text.primary,
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  startStakingButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  startStakingText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  modalTitle: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    color: colors.text.primary,
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInputContainer: {
    marginBottom: spacing.sm,
  },
  modalInputLabel: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
  },
  modalInputWrapper: {
    position: 'relative',
  },
  modalTextInput: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  maxButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -14,
    overflow: 'hidden',
    borderRadius: radius.sm,
  },
  maxButtonGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  maxButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalHint: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.glass.light,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  modalConfirmWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  modalConfirmButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
});

export default StakingScreen;
