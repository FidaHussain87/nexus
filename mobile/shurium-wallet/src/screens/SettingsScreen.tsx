/**
 * SHURIUM Mobile Wallet - Settings Screen
 * Premium glassmorphism design for settings and configuration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWalletStore } from '../store/wallet';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, GlassButton } from '../components/ui';
import type { NetworkType } from '../types';

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  label,
  value,
  description,
  onPress,
  rightElement,
  danger = false,
}) => (
  <Pressable 
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingIcon}>
      <Text style={styles.settingIconText}>{icon}</Text>
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>
        {label}
      </Text>
      {description && (
        <Text style={[styles.settingDescription, danger && styles.settingDescDanger]}>
          {description}
        </Text>
      )}
      {value && (
        <Text style={styles.settingValue}>{value}</Text>
      )}
    </View>
    {rightElement || (onPress && (
      <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>
    ))}
  </Pressable>
);

export const SettingsScreen: React.FC = () => {
  const {
    network,
    setNetwork,
    accounts,
    activeAccountId,
    setActiveAccount,
    hasBackup,
    setBackupComplete,
    lockWallet,
    reset,
  } = useWalletStore();

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
    ]).start();
  }, []);

  const networks: { type: NetworkType; name: string; description: string; icon: string }[] = [
    { type: 'mainnet', name: 'Mainnet', description: 'Production network', icon: '🌐' },
    { type: 'testnet', name: 'Testnet', description: 'Test network', icon: '🧪' },
    { type: 'regtest', name: 'Regtest', description: 'Local testing', icon: '🔧' },
  ];

  const handleNetworkChange = (newNetwork: NetworkType) => {
    if (newNetwork === network) {
      setShowNetworkModal(false);
      return;
    }

    Alert.alert(
      'Change Network',
      `Switch to ${newNetwork}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            setNetwork(newNetwork);
            setShowNetworkModal(false);
          },
        },
      ]
    );
  };

  const handleBackupWallet = () => {
    Alert.alert(
      'Backup Wallet',
      'Your recovery phrase will be displayed. Make sure no one else can see your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Phrase',
          onPress: () => {
            Alert.alert(
              'Recovery Phrase',
              'This feature will display your 24-word recovery phrase.\n\nNever share this with anyone!',
              [{ text: 'I Understand', onPress: () => setBackupComplete() }]
            );
          },
        },
      ]
    );
  };

  const handleLockWallet = () => {
    Alert.alert(
      'Lock Wallet',
      'Lock your wallet now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Lock', onPress: () => lockWallet() },
      ]
    );
  };

  const handleResetWallet = () => {
    Alert.alert(
      'Reset Wallet',
      'This will delete all wallet data. Make sure you have your recovery phrase!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Reset',
              'Are you absolutely sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Reset', style: 'destructive', onPress: () => reset() },
              ]
            );
          },
        },
      ]
    );
  };

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const getNetworkIcon = () => {
    switch (network) {
      case 'mainnet': return '🌐';
      case 'testnet': return '🧪';
      case 'regtest': return '🔧';
    }
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }}>
          {/* Network Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NETWORK</Text>
            <GlassCard style={styles.sectionCard} intensity="light">
              <SettingItem
                icon={getNetworkIcon()}
                label="Current Network"
                value={network.charAt(0).toUpperCase() + network.slice(1)}
                onPress={() => setShowNetworkModal(true)}
              />
            </GlassCard>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <GlassCard style={styles.sectionCard} intensity="light">
              <SettingItem
                icon="👤"
                label="Active Account"
                value={activeAccount?.name || 'Default'}
                onPress={() => setShowAccountModal(true)}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="📋"
                label="Address"
                description={activeAccount?.address 
                  ? `${activeAccount.address.substring(0, 16)}...${activeAccount.address.slice(-8)}`
                  : 'No address'}
              />
            </GlassCard>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SECURITY</Text>
            <GlassCard style={styles.sectionCard} intensity="light">
              <SettingItem
                icon="🔐"
                label="Biometric Unlock"
                description="Use Face ID / Touch ID"
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={setBiometricEnabled}
                    trackColor={{ false: colors.glass.light, true: colors.primary.start }}
                    thumbColor="#fff"
                  />
                }
              />
              <View style={styles.divider} />
              <SettingItem
                icon="📝"
                label="Backup Wallet"
                description={hasBackup ? 'Backup completed' : 'Not backed up - tap to backup'}
                onPress={handleBackupWallet}
                rightElement={
                  <View style={[
                    styles.backupIndicator,
                    { backgroundColor: hasBackup ? colors.success.base : colors.warning.base }
                  ]}>
                    <Text style={styles.backupIndicatorText}>
                      {hasBackup ? '✓' : '!'}
                    </Text>
                  </View>
                }
              />
              <View style={styles.divider} />
              <SettingItem
                icon="🔒"
                label="Lock Wallet"
                description="Lock immediately"
                onPress={handleLockWallet}
              />
            </GlassCard>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            <GlassCard style={styles.sectionCard} intensity="light">
              <SettingItem
                icon="🔔"
                label="Push Notifications"
                description="Transaction alerts"
                rightElement={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.glass.light, true: colors.primary.start }}
                    thumbColor="#fff"
                  />
                }
              />
            </GlassCard>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <GlassCard style={styles.sectionCard} intensity="light">
              <SettingItem
                icon="ℹ️"
                label="Version"
                value="0.1.0"
              />
              <View style={styles.divider} />
              <SettingItem
                icon="🌍"
                label="SHURIUM Network"
                description="Cryptocurrency with Universal Basic Income"
              />
            </GlassCard>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>DANGER ZONE</Text>
            <GlassCard style={styles.dangerCard} intensity="light">
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <SettingItem
                icon="⚠️"
                label="Reset Wallet"
                description="Delete all wallet data"
                onPress={handleResetWallet}
                danger
              />
            </GlassCard>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Network Selection Modal */}
      <Modal
        visible={showNetworkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity="heavy">
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.modalTitle}>Select Network</Text>
            
            {networks.map((net) => (
              <Pressable
                key={net.type}
                style={[
                  styles.networkOption,
                  network === net.type && styles.networkOptionActive
                ]}
                onPress={() => handleNetworkChange(net.type)}
              >
                <LinearGradient
                  colors={network === net.type 
                    ? ['rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)']
                    : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.networkIcon}>{net.icon}</Text>
                <View style={styles.networkInfo}>
                  <Text style={[
                    styles.networkName,
                    network === net.type && styles.networkNameActive
                  ]}>
                    {net.name}
                  </Text>
                  <Text style={styles.networkDescription}>{net.description}</Text>
                </View>
                {network === net.type && (
                  <View style={styles.checkmark}>
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.checkmarkGradient}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </LinearGradient>
                  </View>
                )}
              </Pressable>
            ))}

            <Pressable 
              style={styles.modalCloseButton}
              onPress={() => setShowNetworkModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      {/* Account Selection Modal */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity="heavy">
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.modalTitle}>Select Account</Text>
            
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                style={[
                  styles.networkOption,
                  activeAccountId === account.id && styles.networkOptionActive
                ]}
                onPress={() => {
                  setActiveAccount(account.id);
                  setShowAccountModal(false);
                }}
              >
                <LinearGradient
                  colors={activeAccountId === account.id 
                    ? ['rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)']
                    : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.accountIcon}>
                  <Text>👤</Text>
                </View>
                <View style={styles.networkInfo}>
                  <Text style={[
                    styles.networkName,
                    activeAccountId === account.id && styles.networkNameActive
                  ]}>
                    {account.name}
                  </Text>
                  <Text style={styles.networkDescription} numberOfLines={1}>
                    {account.address.substring(0, 20)}...
                  </Text>
                </View>
                {activeAccountId === account.id && (
                  <View style={styles.checkmark}>
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.checkmarkGradient}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </LinearGradient>
                  </View>
                )}
              </Pressable>
            ))}

            <Pressable 
              style={styles.modalCloseButton}
              onPress={() => setShowAccountModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
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
    top: -100,
    right: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  dangerTitle: {
    color: colors.error.base,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  dangerCard: {
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  settingLabelDanger: {
    color: colors.error.base,
  },
  settingDescription: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
  settingDescDanger: {
    color: 'rgba(239, 68, 68, 0.7)',
  },
  settingValue: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  chevron: {
    color: colors.text.muted,
    fontSize: 24,
  },
  chevronDanger: {
    color: colors.error.base,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.borderLight,
    marginLeft: 56 + spacing.md,
  },
  backupIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupIndicatorText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
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
    color: colors.text.primary,
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  networkOptionActive: {
    borderWidth: 1,
    borderColor: colors.primary.start,
  },
  networkIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  networkNameActive: {
    color: colors.primary.start,
  },
  networkDescription: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
  checkmark: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  checkmarkGradient: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalCloseButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  modalCloseText: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
});

export default SettingsScreen;
