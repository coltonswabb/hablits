// ============================================
// iCLOUD BACKUP
// ============================================
// Silent safety net. Once a day (and after a restore) the whole AppState is
// written to the app's iCloud Documents container as JSON. On a fresh
// install — local state empty, cloud has a backup — the app offers to
// restore before the user has a chance to make a habit the hard way.
//
// Pure decision logic is exported for tests; the native calls live in
// modules/icloud-backup.
// ============================================

import { AppState } from '../types';
import { SCHEMA_VERSION } from '../state/migrations';
import { isICloudAvailable, writeICloudFile, readICloudFile, iCloudFileModifiedAt } from '../../modules/icloud-backup';

export const BACKUP_FILE = 'hablits-backup.json';
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // at most every 6h, in practice once a day

export type BackupEnvelope = {
  version: string;
  schemaVersion: number;
  exportedAt: string; // ISO
  device?: string;
  data: AppState;
};

export function makeEnvelope(state: AppState, now: Date = new Date(), appVersion = '1.3.0'): BackupEnvelope {
  return { version: appVersion, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data: state };
}

/** Parse what came back from iCloud; null if it isn't a usable backup. */
export function parseEnvelope(raw: string | null): BackupEnvelope | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : null;
    if (!data || !Array.isArray(data.habits)) return null;
    return {
      version: String(parsed.version ?? ''),
      schemaVersion: Number(parsed.schemaVersion ?? 0),
      exportedAt: String(parsed.exportedAt ?? ''),
      device: parsed.device,
      data,
    };
  } catch {
    return null;
  }
}

/** Is a backup worth writing? Skip if nothing to protect or we just did. */
export function shouldBackup(state: AppState, lastBackupAt: string | undefined, now: Date = new Date()): boolean {
  const hasData = state.habits.length > 0 || Object.keys(state.logs).length > 0;
  if (!hasData) return false;
  if (!lastBackupAt) return true;
  const last = Date.parse(lastBackupAt);
  return !Number.isFinite(last) || now.getTime() - last >= MIN_INTERVAL_MS;
}

/** Does this cloud backup contain more than the local state? (fresh-install restore check) */
export function cloudHasMore(local: AppState, cloud: BackupEnvelope): boolean {
  const localCount = local.habits.length + Object.keys(local.logs).length;
  const cloudCount = cloud.data.habits.length + Object.keys(cloud.data.logs || {}).length;
  return localCount === 0 && cloudCount > 0;
}

// ---- side-effecting API ----

export async function backupToICloud(state: AppState, appVersion?: string): Promise<{ ok: boolean; at?: string; reason?: string }> {
  try {
    if (!(await isICloudAvailable())) return { ok: false, reason: 'unavailable' };
    const env = makeEnvelope(state, new Date(), appVersion);
    await writeICloudFile(BACKUP_FILE, JSON.stringify(env));
    return { ok: true, at: env.exportedAt };
  } catch (error) {
    console.warn('iCloud backup failed:', error);
    return { ok: false, reason: String(error) };
  }
}

export async function readICloudBackup(): Promise<BackupEnvelope | null> {
  try {
    if (!(await isICloudAvailable())) return null;
    return parseEnvelope(await readICloudFile(BACKUP_FILE));
  } catch (error) {
    console.warn('iCloud read failed:', error);
    return null;
  }
}

export async function iCloudBackupStatus(): Promise<{ available: boolean; lastBackup: string | null }> {
  try {
    const available = await isICloudAvailable();
    if (!available) return { available: false, lastBackup: null };
    return { available, lastBackup: await iCloudFileModifiedAt(BACKUP_FILE) };
  } catch {
    return { available: false, lastBackup: null };
  }
}
