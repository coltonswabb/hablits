// ============================================
// SETTINGS MODAL
// ============================================
// Modal for app settings: sound toggle, data import/export
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import { AppState } from '../types';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  notificationsEnabled: boolean;
  notificationTime: { hour: number; minute: number };
  onToggleNotifications: () => void;
  onSetNotificationTime: (hour: number, minute: number) => void;
  appState: AppState;
  onImportData: (data: AppState) => void;
  currentTheme: string;
  customAccentColor?: string;
  onSetCustomAccentColor: (color: string | undefined) => void;
}

// Convert HSL to hex color
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Extract hue from hex color (approximate)
function hexToHue(hex: string | undefined): number {
  if (!hex) return 0;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }
  }

  return Math.round(h * 360);
}

export function SettingsModal({
  visible,
  onClose,
  sfxEnabled,
  onToggleSfx,
  hapticsEnabled,
  onToggleHaptics,
  notificationsEnabled,
  notificationTime,
  onToggleNotifications,
  onSetNotificationTime,
  appState,
  onImportData,
  currentTheme,
  customAccentColor,
  onSetCustomAccentColor,
}: SettingsModalProps) {
  const { colors } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Hue slider state (0-360)
  const [hue, setHue] = useState(hexToHue(customAccentColor));

  // Only show custom accent for light, dark, and superdark themes
  const showCustomAccent = currentTheme === 'light' || currentTheme === 'dark' || currentTheme === 'superdark';

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const newColor = hslToHex(newHue, 100, 50);
    onSetCustomAccentColor(newColor);
  };

  const handleResetColor = () => {
    setHue(0);
    onSetCustomAccentColor(undefined);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const dataString = JSON.stringify(appState, null, 2);
      const fileName = `hablits-backup-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web: Download as file
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Share file
        const file = new File(Paths.document, fileName);
        await file.write(dataString);
        await Sharing.shareAsync(file.uri);
      }

      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);

      if (Platform.OS === 'web') {
        // Web: File input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const text = await file.text();
            const data = JSON.parse(text);
            onImportData(data);
            Alert.alert('Success', 'Data imported successfully!');
          }
        };
        input.click();
      } else {
        // Mobile: Document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const file = new File(result.assets[0].uri);
          const fileContent = await file.text();
          const data = JSON.parse(fileContent);

          // Validate data structure
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
          }
          if (!Array.isArray(data.habits) || !Array.isArray(data.identities)) {
            throw new Error('Missing required fields');
          }

          onImportData(data);
          Alert.alert('Success', 'Data imported successfully!');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import data. Make sure the file is a valid Hablits backup.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Custom Accent Color (only for light, dark, superdark) */}
            {showCustomAccent && (
              <View style={[styles.section, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Accent Color</Text>
                <Text style={[styles.sectionDescription, { color: colors.muted }]}>
                  Customize the accent color for {currentTheme === 'superdark' ? 'Super Dark' : currentTheme === 'dark' ? 'Dark' : 'Light'} theme
                </Text>

                {/* Color Preview */}
                <View style={styles.colorPreviewContainer}>
                  <View
                    style={[
                      styles.colorPreviewCircle,
                      {
                        backgroundColor: customAccentColor || colors.accent,
                        borderColor: colors.divider,
                      },
                    ]}
                  />
                  <Text style={[styles.colorLabel, { color: colors.text }]}>
                    {customAccentColor || 'Default'}
                  </Text>
                </View>

                {/* Hue Slider */}
                <View style={styles.hueSliderContainer}>
                  <View style={[styles.hueSliderTrack, { borderColor: colors.divider }]}>
                    {/* Rainbow gradient background */}
                    {Array.from({ length: 360 }, (_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 1,
                          height: '100%',
                          backgroundColor: hslToHex(i, 100, 50),
                        }}
                      />
                    ))}
                  </View>
                  {/* Slider thumb */}
                  <View
                    style={[
                      styles.hueThumb,
                      {
                        left: `${(hue / 360) * 100}%`,
                        backgroundColor: hslToHex(hue, 100, 50),
                        borderColor: colors.text,
                      },
                    ]}
                  />
                  {/* Touch overlay for dragging */}
                  <TouchableOpacity
                    style={styles.hueSliderTouch}
                    activeOpacity={1}
                    onPress={(e) => {
                      const { locationX } = e.nativeEvent;
                      const newHue = Math.round((locationX / 360) * 360);
                      handleHueChange(Math.max(0, Math.min(360, newHue)));
                    }}
                  />
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
                  onPress={handleResetColor}
                >
                  <Text style={[styles.resetButtonText, { color: colors.text }]}>
                    Reset to Default
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sound & Feedback Section */}
            <View style={[styles.section, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound & Feedback</Text>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
                onPress={onToggleSfx}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Sound Effects</Text>
                <View style={[styles.toggle, { backgroundColor: sfxEnabled ? colors.good : colors.muted }]}>
                  <Text style={styles.toggleText}>{sfxEnabled ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
                onPress={onToggleHaptics}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Haptic Feedback</Text>
                <View style={[styles.toggle, { backgroundColor: hapticsEnabled ? colors.good : colors.muted }]}>
                  <Text style={styles.toggleText}>{hapticsEnabled ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Notifications Section */}
            <View style={[styles.section, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
                onPress={onToggleNotifications}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Daily Reminders</Text>
                <View style={[styles.toggle, { backgroundColor: notificationsEnabled ? colors.good : colors.muted }]}>
                  <Text style={styles.toggleText}>{notificationsEnabled ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>

              {notificationsEnabled && (
                <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Reminder Time</Text>
                  <View style={styles.timeInputs}>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
                      value={notificationTime.hour.toString().padStart(2, '0')}
                      onChangeText={(text) => {
                        const hour = parseInt(text) || 0;
                        if (hour >= 0 && hour <= 23) {
                          onSetNotificationTime(hour, notificationTime.minute);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
                      value={notificationTime.minute.toString().padStart(2, '0')}
                      onChangeText={(text) => {
                        const minute = parseInt(text) || 0;
                        if (minute >= 0 && minute <= 59) {
                          onSetNotificationTime(notificationTime.hour, minute);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Data Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
                onPress={handleExport}
                disabled={isExporting}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Export Data</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  {isExporting ? 'Exporting...' : 'Save a backup of all your data'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
                onPress={handleImport}
                disabled={isImporting}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Import Data</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  {isImporting ? 'Importing...' : 'Restore from a backup file'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  closeButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  colorPreviewCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  hueSliderContainer: {
    position: 'relative',
    height: 40,
    marginBottom: 16,
  },
  hueSliderTrack: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  hueThumb: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    marginLeft: -16,
  },
  hueSliderTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  toggle: {
    position: 'absolute',
    right: 16,
    top: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 20,
    fontWeight: '700',
  },
});
