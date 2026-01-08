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
} from 'react-native';
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
  appState: AppState;
  onImportData: (data: AppState) => void;
}

export function SettingsModal({
  visible,
  onClose,
  sfxEnabled,
  onToggleSfx,
  appState,
  onImportData,
}: SettingsModalProps) {
  const { colors } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
            {/* Sound Section */}
            <View style={[styles.section, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound</Text>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
                onPress={onToggleSfx}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Sound Effects</Text>
                <View style={[styles.toggle, { backgroundColor: sfxEnabled ? colors.good : colors.muted }]}>
                  <Text style={styles.toggleText}>{sfxEnabled ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>
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
});
