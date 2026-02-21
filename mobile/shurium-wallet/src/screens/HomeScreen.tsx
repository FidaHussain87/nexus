/**
 * SHURIUM Mobile Wallet - Home Screen
 * Premium glassmorphism design with animations
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../store/wallet';
import { 
  GlassCard, 
  GradientButton, 
  AnimatedBalance,
  StatusPill,
  GlowingIcon,
} from '../components/ui';
import { colors, gradients, spacing, radius, shadows } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Transaction } from '../types';

type NavigationProp = NativeStackNavigationProp<any>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    isConnected,
    network,
    balance,
    transactions,
    isLoadingTransactions,
    accounts,
    activeAccountId,
    ubiInfo,
    lastError,
    refreshAll,
    checkConnection,
    clearError,
  } = useWalletStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkConnection();
    
    // Entrance animations
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

    // Continuous glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const getNetworkColor = () => {
    switch (network) {
      case 'mainnet': return colors.success.base;
      case 'testnet': return colors.warning.base;
      case 'regtest': return colors.accent.purple;
    }
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(8);
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send': return colors.error.base;
      case 'receive': return colors.success.base;
      case 'stake': return colors.accent.blue;
      case 'unstake': return colors.warning.base;
      case 'ubi_claim': return colors.accent.purple;
      default: return colors.text.muted;
    }
  };

  const balanceValue = balance ? parseFloat(balance.total) : 0;

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient */}
      <LinearGradient
        colors={[colors.background.primary, '#0D0D15', colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Background Glow Orbs */}
      <Animated.View 
        style={[
          styles.glowOrb,
          styles.glowOrbPurple,
          { opacity: Animated.add(0.3, Animated.multiply(glowAnim, 0.2)) }
        ]} 
      />
      <Animated.View 
        style={[
          styles.glowOrb,
          styles.glowOrbBlue,
          { opacity: Animated.add(0.2, Animated.multiply(glowAnim, 0.15)) }
        ]} 
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.start}
          />
        }
      >
        {/* Status Bar */}
        <Animated.View 
          style={[
            styles.statusBar,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success.base : colors.error.base }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
          <View style={[styles.networkPill, { backgroundColor: `${getNetworkColor()}20` }]}>
            <View style={[styles.networkDot, { backgroundColor: getNetworkColor() }]} />
            <Text style={[styles.networkText, { color: getNetworkColor() }]}>
              {network.toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        {/* Error Banner */}
        {lastError && (
          <TouchableOpacity onPress={clearError}>
            <GlassCard style={styles.errorCard} glow glowColor={colors.error.glow}>
              <Text style={styles.errorText}>{lastError}</Text>
              <Text style={styles.errorDismiss}>Tap to dismiss</Text>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Main Balance Card */}
        <Animated.View 
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <GlassCard style={styles.balanceCard} intensity="medium" glow animated>
            {/* Gradient Border Effect */}
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradientBorder}
            />
            
            <Text style={styles.balanceLabel}>Total Balance</Text>
            
            <View style={styles.balanceRow}>
              <AnimatedBalance 
                value={balanceValue}
                suffix=""
                style={styles.balanceAmount}
              />
              <Text style={styles.balanceCurrency}>SHR</Text>
            </View>

            {balance && balance.unconfirmedSatoshis > 0 && (
              <View style={styles.pendingRow}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingBalance}>
                  +{formatAmount(balance.unconfirmed)} pending
                </Text>
              </View>
            )}

            {activeAccount && (
              <TouchableOpacity style={styles.addressContainer}>
                <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                  {activeAccount.address}
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.actionsContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <ActionButton
            icon="↑"
            label="Send"
            color={gradients.error}
            onPress={() => navigation.navigate('Send')}
          />
          <ActionButton
            icon="↓"
            label="Receive"
            color={gradients.success}
            onPress={() => navigation.navigate('Receive')}
          />
          <ActionButton
            icon="◎"
            label="Stake"
            color={gradients.blue}
            onPress={() => navigation.navigate('Staking')}
          />
          <ActionButton
            icon="$"
            label="UBI"
            color={gradients.purple}
            onPress={() => navigation.navigate('UBI')}
          />
        </Animated.View>

        {/* UBI Card (if eligible) */}
        {ubiInfo && ubiInfo.isEligible && parseFloat(ubiInfo.claimableAmount) > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity onPress={() => navigation.navigate('UBI')}>
              <LinearGradient
                colors={gradients.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ubiCard}
              >
                <View style={styles.ubiContent}>
                  <View>
                    <Text style={styles.ubiLabel}>UBI Available</Text>
                    <Text style={styles.ubiAmount}>
                      {formatAmount(ubiInfo.claimableAmount)} SHR
                    </Text>
                  </View>
                  <View style={styles.ubiAction}>
                    <Text style={styles.ubiActionText}>Claim →</Text>
                  </View>
                </View>
                
                {/* Shine effect */}
                <Animated.View 
                  style={[
                    styles.ubiShine,
                    { opacity: glowAnim }
                  ]} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Recent Transactions */}
        <Animated.View 
          style={[
            styles.transactionsSection,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              {(network === 'testnet' || network === 'regtest') && (
                <GradientButton
                  title="Get Test SHR"
                  onPress={() => navigation.navigate('Faucet')}
                  size="small"
                  colors={gradients.cyan}
                  style={styles.faucetButton}
                />
              )}
            </GlassCard>
          ) : (
            <GlassCard style={styles.transactionsList}>
              {transactions.slice(0, 5).map((tx: Transaction, index: number) => (
                <TouchableOpacity
                  key={tx.txid}
                  style={[
                    styles.transactionItem,
                    index < transactions.slice(0, 5).length - 1 && styles.transactionItemBorder
                  ]}
                  onPress={() => navigation.navigate('TransactionDetail', { txid: tx.txid })}
                >
                  <View style={[styles.txIconContainer, { backgroundColor: `${getTransactionColor(tx.type)}20` }]}>
                    <Text style={[styles.txIcon, { color: getTransactionColor(tx.type) }]}>
                      {tx.type === 'send' ? '↑' : tx.type === 'receive' ? '↓' : '$'}
                    </Text>
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txType}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1).replace('_', ' ')}
                    </Text>
                    <Text style={styles.txTime}>
                      {new Date(tx.timestamp * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.txAmountContainer}>
                    <Text style={[styles.txAmount, { color: getTransactionColor(tx.type) }]}>
                      {tx.type === 'send' ? '-' : '+'}{formatAmount(tx.amount)}
                    </Text>
                    <Text style={styles.txConfirmations}>
                      {tx.confirmations === 0 ? 'Pending' : `${tx.confirmations} conf`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </GlassCard>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// Quick Action Button Component
const ActionButton: React.FC<{
  icon: string;
  label: string;
  color: string[];
  onPress: () => void;
}> = ({ icon, label, color, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.actionButton, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionIconContainer}
        >
          <Text style={styles.actionIcon}>{icon}</Text>
        </LinearGradient>
        <Text style={styles.actionLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Background effects
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowOrbPurple: {
    top: -100,
    right: -100,
    backgroundColor: colors.primary.start,
  },
  glowOrbBlue: {
    top: 200,
    left: -150,
    backgroundColor: colors.primary.end,
  },
  
  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  networkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  
  // Error card
  errorCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error.base,
  },
  errorText: {
    color: colors.error.base,
    fontSize: 14,
  },
  errorDismiss: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 4,
  },
  
  // Balance card
  balanceCard: {
    marginHorizontal: spacing.md,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  balanceGradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  balanceLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  balanceCurrency: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning.base,
    marginRight: spacing.xs,
  },
  pendingBalance: {
    color: colors.warning.base,
    fontSize: 14,
  },
  addressContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.glass.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    maxWidth: '90%',
  },
  addressText: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  
  // Quick actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.button,
  },
  actionIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  actionLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // UBI card
  ubiCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  ubiContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ubiLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  ubiAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ubiAction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  ubiActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  ubiShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  
  // Transactions
  transactionsSection: {
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: colors.primary.start,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  faucetButton: {
    marginTop: spacing.sm,
  },
  transactionsList: {
    padding: 0,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  txDetails: {
    flex: 1,
  },
  txType: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  txTime: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txConfirmations: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
});

export default HomeScreen;
