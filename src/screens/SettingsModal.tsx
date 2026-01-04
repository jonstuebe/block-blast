import React, { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Animated } from "react-native";
import { COLORS } from "../utils/colors";
import { Settings } from "../types";

interface SettingsModalProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SettingsModalComponent({
  settings,
  onSettingsChange,
  onClose,
}: SettingsModalProps) {
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(-300)).current;
  const closeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClosePressIn = () => {
    Animated.spring(closeScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleClosePressOut = () => {
    Animated.spring(closeScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const toggleSound = () => {
    onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const toggleMusic = () => {
    onSettingsChange({ ...settings, musicEnabled: !settings.musicEnabled });
  };

  const toggleHaptics = () => {
    onSettingsChange({ ...settings, hapticsEnabled: !settings.hapticsEnabled });
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <Animated.View
        style={[styles.modal, { transform: [{ translateY: modalTranslateY }] }]}
      >
        <Text style={styles.title}>SETTINGS</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Effects</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={toggleSound}
            trackColor={{ false: COLORS.buttonSecondary, true: COLORS.buttonPrimary }}
            thumbColor={COLORS.textPrimary}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Background Music</Text>
          <Switch
            value={settings.musicEnabled}
            onValueChange={toggleMusic}
            trackColor={{ false: COLORS.buttonSecondary, true: COLORS.buttonPrimary }}
            thumbColor={COLORS.textPrimary}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Haptic Feedback</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={toggleHaptics}
            trackColor={{ false: COLORS.buttonSecondary, true: COLORS.buttonPrimary }}
            thumbColor={COLORS.textPrimary}
          />
        </View>

        <AnimatedPressable
          style={[styles.closeButton, { transform: [{ scale: closeScale }] }]}
          onPress={onClose}
          onPressIn={handleClosePressIn}
          onPressOut={handleClosePressOut}
        >
          <Text style={styles.closeText}>CLOSE</Text>
        </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 4,
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gridLine,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  closeButton: {
    backgroundColor: COLORS.buttonSecondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
});

export const SettingsModal = memo(SettingsModalComponent);

