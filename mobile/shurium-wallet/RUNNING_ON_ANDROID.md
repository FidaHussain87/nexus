# Running SHURIUM Wallet on Samsung S23 Ultra

This guide will help you run the SHURIUM Wallet on your Samsung Galaxy S23 Ultra.

## Prerequisites

### 1. Install Required Software on Your Mac

```bash
# Install Node.js (if not already installed)
brew install node

# Install Java Development Kit (JDK 17)
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@17' >> ~/.zshrc

# Install Android Studio (for Android SDK)
# Download from: https://developer.android.com/studio
# Or via Homebrew:
brew install --cask android-studio
```

### 2. Configure Android SDK

After installing Android Studio:

1. Open Android Studio
2. Go to **Settings** > **Appearance & Behavior** > **System Settings** > **Android SDK**
3. Install:
   - Android SDK Platform 34 (Android 14)
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

4. Set environment variables:

```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

## Enable Developer Mode on Samsung S23 Ultra

1. Go to **Settings** > **About phone**
2. Tap **Software information**
3. Tap **Build number** 7 times quickly
4. Enter your PIN/pattern when prompted
5. You'll see "Developer mode has been turned on"

## Enable USB Debugging

1. Go to **Settings** > **Developer options**
2. Enable **USB debugging**
3. Enable **Install via USB** (for installing debug APKs)
4. (Optional) Enable **Wireless debugging** for cable-free development

## Connect Your S23 Ultra

### Via USB Cable

1. Connect your S23 Ultra to your Mac using a USB-C cable
2. On your phone, you'll see a popup asking to "Allow USB debugging?"
3. Check "Always allow from this computer"
4. Tap **Allow**

### Via Wi-Fi (Wireless Debugging)

1. Enable **Wireless debugging** in Developer options
2. Tap **Wireless debugging** to view pairing options
3. Note the IP address and port

```bash
# Pair with your device (first time only)
adb pair <IP_ADDRESS>:<PAIRING_PORT>
# Enter the pairing code shown on your phone

# Connect
adb connect <IP_ADDRESS>:<PORT>
```

## Verify Connection

```bash
# Check if device is connected
adb devices

# Should show something like:
# List of devices attached
# RF8N11234AB     device
```

## Running the App

### Method 1: Development Mode (Recommended for Testing)

```bash
# Navigate to the wallet directory
cd /Users/I589917/fida/shurium/mobile/shurium-wallet

# Install dependencies (if not done)
npm install

# Start Metro bundler in one terminal
npm start

# In another terminal, run on Android
npm run android
```

### Method 2: Build Debug APK

```bash
# Build the debug APK
npm run android:debug

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk

# Install manually
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: Build Release APK

First, create a release keystore:

```bash
cd android/app

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore shurium-release-key.keystore -alias shurium-key-alias -keyalg RSA -keysize 2048 -validity 10000

# When prompted:
# - Enter a secure password
# - Fill in organization details
# - Save the password securely!
```

Update `android/gradle.properties`:

```properties
SHURIUM_UPLOAD_STORE_FILE=shurium-release-key.keystore
SHURIUM_UPLOAD_KEY_ALIAS=shurium-key-alias
SHURIUM_UPLOAD_STORE_PASSWORD=your_password_here
SHURIUM_UPLOAD_KEY_PASSWORD=your_password_here
```

Build the release APK:

```bash
npm run android:release

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Connecting to SHURIUM Node

The wallet needs to connect to a SHURIUM node. Configure the RPC endpoint in the app settings:

### Local Development (Same Network)
- If your Mac is running the SHURIUM node, find your Mac's local IP:
  ```bash
  ifconfig | grep "inet " | grep -v 127.0.0.1
  ```
- Use `http://<YOUR_MAC_IP>:18443` for regtest
- Use `http://<YOUR_MAC_IP>:18332` for testnet

### Remote Node
- Configure a public testnet node URL in settings

## Troubleshooting

### "Unable to load script" Error
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or clean the build
npm run clean:android
npm run android
```

### Device Not Found
```bash
# Restart ADB
adb kill-server
adb start-server
adb devices
```

### Build Errors
```bash
# Clean everything
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npm run android
```

### Network Issues
- Ensure your phone and Mac are on the same Wi-Fi network
- Check if the SHURIUM node is running and accessible
- Verify the RPC port is not blocked by firewall

### App Crashes on Launch
```bash
# Check logs
adb logcat | grep -i "shurium\|react"
```

## Samsung S23 Ultra Optimizations

The app is optimized for your S23 Ultra's features:

- **120Hz Display**: Smooth animations using Reanimated 3
- **Large Screen**: Responsive UI with glass cards
- **Dark Mode**: AMOLED-optimized dark theme
- **Biometric Auth**: Fingerprint sensor support via Keychain

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on connected device |
| `npm run android:debug` | Build debug APK |
| `npm run android:release` | Build release APK |
| `npm run clean:android` | Clean Android build |
| `adb devices` | List connected devices |
| `adb logcat` | View device logs |

## Support

For issues specific to SHURIUM Wallet, check:
- SHURIUM documentation: `docs/TESTNET_GUIDE.md`
- Bug reports: File issues on the SHURIUM repository
