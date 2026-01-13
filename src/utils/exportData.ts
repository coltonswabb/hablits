// ============================================
// DATA EXPORT UTILITY
// ============================================
// Functions to export and import app data
// ============================================

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppState } from '../types';

export async function exportData(state: AppState): Promise<void> {
  try {
    // Create JSON export
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: state,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `hablits-backup-${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save your Hablits backup',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

export async function importData(jsonString: string): Promise<AppState> {
  try {
    const imported = JSON.parse(jsonString);

    // Validate imported data
    if (!imported.data || !imported.version) {
      throw new Error('Invalid backup file format');
    }

    // Return the app state from the backup
    return imported.data as AppState;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}
