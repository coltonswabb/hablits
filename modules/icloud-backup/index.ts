import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type Native = {
  isAvailable(): Promise<boolean>;
  writeFile(name: string, contents: string): Promise<string>;
  readFile(name: string, timeoutMs: number): Promise<string | null>;
  modifiedAt(name: string): Promise<string | null>;
};

// Optional: the module only exists in iOS builds that include it. Everywhere
// else these calls degrade to "unavailable" instead of throwing at import.
const native = Platform.OS === 'ios' ? requireOptionalNativeModule<Native>('ICloudBackup') : null;

export async function isICloudAvailable(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.isAvailable();
  } catch {
    return false;
  }
}

export function writeICloudFile(name: string, contents: string): Promise<string> {
  if (!native) return Promise.reject(new Error('iCloud module unavailable'));
  return native.writeFile(name, contents);
}

/** Waits up to `timeoutMs` for iCloud to deliver the file on a new device. */
export function readICloudFile(name: string, timeoutMs = 8000): Promise<string | null> {
  if (!native) return Promise.resolve(null);
  return native.readFile(name, timeoutMs);
}

export function iCloudFileModifiedAt(name: string): Promise<string | null> {
  if (!native) return Promise.resolve(null);
  return native.modifiedAt(name);
}
