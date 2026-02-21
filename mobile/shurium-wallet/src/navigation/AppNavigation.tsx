/**
 * SHURIUM Mobile Wallet - Premium Navigation
 * Glassmorphism tab bar with smooth animations
 */

import React, { useRef, useEffect } from 'react';
import { 
  NavigationContainer, 
  DefaultTheme,
  useNavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

// Import all screens
import { HomeScreen } from '../screens/HomeScreen';
import { SendScreen } from '../screens/SendScreen';
import { ReceiveScreen } from '../screens/ReceiveScreen';
import { StakingScreen } from '../screens/StakingScreen';
import { UBIScreen } from '../screens/UBIScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { FaucetScreen } from '../screens/FaucetScreen';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard } from '../components/ui';

// Transaction Detail Screen
const TransactionDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const { txid } = route.params || {};
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.detailContainer}>
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
      </View>
      
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.detailTitle}>Transaction Details</Text>
        
        <GlassCard style={styles.detailCard} intensity="light">
          <Text style={styles.detailLabel}>Transaction ID</Text>
          <Text style={styles.detailValue} selectable>{txid || 'Unknown'}</Text>
        </GlassCard>
        
        <GlassCard style={styles.detailHintCard} intensity="light">
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.detailHintIcon}>ℹ️</Text>
          <Text style={styles.detailHint}>
            Full transaction details will be fetched from the blockchain
          </Text>
        </GlassCard>
      </Animated.View>
    </View>
  );
};

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  Send: undefined;
  Receive: undefined;
  Staking: undefined;
  UBI: undefined;
  Transactions: undefined;
  TransactionDetail: { txid: string };
  Faucet: undefined;
  Settings: undefined;
  QRScanner: { onScan: (data: string) => void };
};

export type MainTabsParamList = {
  Home: undefined;
  Wallet: undefined;
  Stake: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Premium Dark Theme
const PremiumDarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.start,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.glass.borderLight,
    notification: colors.error.base,
  },
};

// Tab configuration
const TAB_CONFIG = [
  { name: 'Home' as const, icon: '🏠', label: 'Home', gradient: gradients.primary },
  { name: 'Wallet' as const, icon: '📋', label: 'Wallet', gradient: ['#10B981', '#059669'] },
  { name: 'Stake' as const, icon: '💎', label: 'Stake', gradient: ['#3B82F6', '#2563EB'] },
  { name: 'Settings' as const, icon: '⚙️', label: 'Settings', gradient: ['#6B7280', '#4B5563'] },
];

// Custom Tab Bar Component
interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const animValues = useRef(TAB_CONFIG.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    TAB_CONFIG.forEach((_, index) => {
      Animated.spring(animValues[index], {
        toValue: state.index === index ? 1 : 0,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={styles.tabBarContainer}>
      {/* Glass background */}
      <View style={styles.tabBarGlass}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const tabConfig = TAB_CONFIG[index];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const scaleAnim = animValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1],
            });

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Animated.View
                  style={[
                    styles.tabIconWrapper,
                    {
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  {isFocused ? (
                    <LinearGradient
                      colors={tabConfig.gradient}
                      style={styles.tabIconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.tabIconText}>{tabConfig.icon}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tabIconInactive}>
                      <Text style={styles.tabIconText}>{tabConfig.icon}</Text>
                    </View>
                  )}
                </Animated.View>
                <Text style={[
                  styles.tabLabel,
                  isFocused && { color: tabConfig.gradient[0] }
                ]}>
                  {tabConfig.label}
                </Text>
                {isFocused && (
                  <Animated.View 
                    style={[
                      styles.tabDot,
                      { 
                        backgroundColor: tabConfig.gradient[0],
                        opacity: animValues[index],
                      }
                    ]} 
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Header component with glass effect
const GlassHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.headerContainer}>
    <LinearGradient
      colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
      style={StyleSheet.absoluteFill}
    />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Main tab navigator
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.secondary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'SHURIUM',
          headerTitleAlign: 'center',
          headerBackground: () => (
            <LinearGradient
              colors={[colors.background.secondary, colors.background.primary]}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={TransactionsScreen}
        options={{
          title: 'Transactions',
          headerBackground: () => (
            <LinearGradient
              colors={[colors.background.secondary, colors.background.primary]}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Stake"
        component={StakingScreen}
        options={{
          title: 'Staking',
          headerBackground: () => (
            <LinearGradient
              colors={[colors.background.secondary, colors.background.primary]}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackground: () => (
            <LinearGradient
              colors={[colors.background.secondary, colors.background.primary]}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Stack screen options with glass header
const screenOptions = {
  headerStyle: {
    backgroundColor: colors.background.secondary,
  },
  headerTintColor: colors.text.primary,
  headerTitleStyle: {
    fontWeight: '700' as const,
    fontSize: 17,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerBackground: () => (
    <LinearGradient
      colors={[colors.background.secondary, colors.background.primary]}
      style={StyleSheet.absoluteFill}
    />
  ),
};

// Main navigation
export const AppNavigation: React.FC = () => {
  return (
    <NavigationContainer theme={PremiumDarkTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Send"
          component={SendScreen}
          options={{ 
            title: 'Send SHR',
            headerTintColor: '#EF4444',
          }}
        />
        <Stack.Screen
          name="Receive"
          component={ReceiveScreen}
          options={{ 
            title: 'Receive SHR',
            headerTintColor: '#10B981',
          }}
        />
        <Stack.Screen
          name="Staking"
          component={StakingScreen}
          options={{ title: 'Staking' }}
        />
        <Stack.Screen
          name="UBI"
          component={UBIScreen}
          options={{ 
            title: 'Universal Basic Income',
            headerTintColor: '#A855F7',
          }}
        />
        <Stack.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{ title: 'History' }}
        />
        <Stack.Screen
          name="TransactionDetail"
          component={TransactionDetailScreen}
          options={{ title: 'Transaction' }}
        />
        <Stack.Screen
          name="Faucet"
          component={FaucetScreen}
          options={{ 
            title: 'Test Faucet',
            headerTintColor: '#06B6D4',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  // Tab Bar
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  tabBarGlass: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: 'rgba(18, 18, 26, 0.85)',
    ...shadows.card,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tabIconWrapper: {
    marginBottom: spacing.xs,
  },
  tabIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  tabIconInactive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.glass.light,
  },
  tabIconText: {
    fontSize: 20,
  },
  tabLabel: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },

  // Header
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },

  // Transaction Detail
  detailContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
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
    width: 200,
    height: 200,
    top: -50,
    right: -50,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  detailTitle: {
    color: colors.text.primary,
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  detailCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailLabel: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginBottom: spacing.xs,
  },
  detailValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontFamily: 'monospace',
  },
  detailHintCard: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  detailHintIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  detailHint: {
    flex: 1,
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
});

export default AppNavigation;
