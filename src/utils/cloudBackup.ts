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

function sizeOf(s: { habits: unknown[]; logs?: Record<string, unknown> }): number {
  return (s.habits?.length ?? 0) + Object.keys(s.logs || {}).length;
}

/** Does this cloud backup contain more than the local state? (fresh-install restore check) */
export function cloudHasMore(local: AppState, cloud: BackupEnvelope): boolean {
  return sizeOf(local) === 0 && sizeOf(cloud.data) > 0;
}

/**
 * Write guard for the two-device case. Overwrite the cloud copy only if
 *  - there is none, or
 *  - we wrote it (its exportedAt is not newer than our last backup), or
 *  - ours is at least as big (habits + logged days).
 * A rarely-opened second device with a small stale state therefore never
 * stomps the primary's backup.
 */
export function mayOverwriteCloud(local: AppState, cloud: BackupEnvelope | null, lastLocalBackupAt: string | undefined): boolean {
  if (!cloud) return true;
  const cloudAt = Date.parse(cloud.exportedAt);
  const oursAt = lastLocalBackupAt ? Date.parse(lastLocalBackupAt) : NaN;
  if (Number.isFinite(cloudAt) && Number.isFinite(oursAt) && cloudAt <= oursAt + 1000) return true; // our own write
  return sizeOf(local) >= sizeOf(cloud.data);
}

// ---- side-effecting API ----

export async function backupToICloud(
  state: AppState,
  appVersion?: string,
  options: { force?: boolean } = {}
): Promise<{ ok: boolean; at?: string; reason?: 'unavailable' | 'cloud-newer' | string }> {
  try {
    if (!(await isICloudAvailable())) return { ok: false, reason: 'unavailable' };
    if (!options.force) {
      // Never overwrite a newer, larger backup from another device
      const cloud = parseEnvelope(await readICloudFile(BACKUP_FILE, 3000));
      if (!mayOverwriteCloud(state, cloud, state.lastCloudBackupAt)) return { ok: false, reason: 'cloud-newer' };
    }
    const env = makeEnvelope(state, new Date(), appVersion);
    await writeICloudFile(BACKUP_FILE, JSON.stringify(env));
    return { ok: true, at: env.exportedAt };
  } catch (error) {
    console.warn('iCloud backup failed:', error);
    return { ok: false, reason: String(error) };
  }
}

export async function readICloudBackup(timeoutMs = 8000): Promise<BackupEnvelope | null> {
  try {
    if (!(await isICloudAvailable())) return null;
    return parseEnvelope(await readICloudFile(BACKUP_FILE, timeoutMs));
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
