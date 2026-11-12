// ============================================
// HABLITS - MAIN APP
// ============================================
// This is the root component that:
// 1. Wraps everything in Providers (Theme, State)
// 2. Shows the Header
// 3. Shows the TabBar
// 4. Renders the active screen
// ============================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Alert, Linking, Platform, AppState as RNAppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Providers
import { ThemeProvider, useTheme } from './theme';
import { textOn } from './theme/colors';
import { PetBranchProvider } from './pets/BranchContext';
import { BRANCH_STAGE } from './pets/forms';
import { decideBranch } from './utils/petBranch';
import { AppProvider, useApp } from './state';

// Components
import { Header, TabBar, IdentitiesModal, IdentityFilterModal, OnboardingModal, ThemePickerModal, SettingsModal, HatClosetModal, ErrorBoundary, PetSnapshot, EvolutionModal, LaunchScreen, getMoodFromProgress, getUnlockedHats } from './components';

// Screens
import { TodayScreen, WeekScreen, CalendarScreen, DayPlanScreen, StatsScreen } from './screens';

// Types
import { TabName, Identity } from './types';

// Utils
import { initializeAudio, setSoundsEnabled } from './utils/sounds';
import { syncWidget, readWidgetTaps, forceNextWidgetSync, WIDGET_DEEP_LINK } from './utils/widgetSync';
import { planWidgetTaps } from './utils/widgetTaps';
import { isOnVacation } from './utils/smartHabits';
import { getDayCompletionPercent } from './utils/habits';
import { bestStreakEver, stageForStreak, shownStage } from './utils/evolution';
import { migrateState } from './state/migrations';
import { backupToICloud, readICloudBackup, shouldBackup, cloudHasMore } from './utils/cloudBackup';
import { syncFastActivities } from './utils/fastActivity';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash up until LaunchScreen (an identical frame) has drawn
SplashScreen.preventAutoHideAsync().catch(() => {});
// Safety net: if something fails before LaunchScreen mounts, don't strand the user on the splash
setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 6000);

// ============================================
// MAIN CONTENT (inside providers)
// ============================================
function AppContent() {
  const { colors, themeName, setTheme, customAccentColor, setCustomAccentColor, isThemeLoaded, areFontsReady } = useTheme();
  const { state, dispatch, isLoaded } = useApp();
  const [activeTab, setActiveTab] = useState<TabName>('today');
  const [identitiesModalVisible, setIdentitiesModalVisible] = useState(false);
  const [identityFilterModalVisible, setIdentityFilterModalVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Hat closet state
  const [hatClosetVisible, setHatClosetVisible] = useState(false);

  // Initialize audio and haptics on mount
  useEffect(() => {
    initializeAudio();
    setSoundsEnabled(state.sfxEnabled);

    // Initialize haptics from state
    (async () => {
      const { setHapticsEnabled } = await import('./utils/haptics');
      setHapticsEnabled(state.hapticsEnabled);
    })();
  }, []);

  // Keep the sound and haptics gates in sync with Settings (and with the loaded state)
  useEffect(() => {
    setSoundsEnabled(state.sfxEnabled);
  }, [state.sfxEnabled]);
  useEffect(() => {
    import('./utils/haptics').then((m) => m.setHapticsEnabled(state.hapticsEnabled));
  }, [state.hapticsEnabled]);

  // ---- iCloud backup ----
  // Shared restore prompt (fresh install + Settings → Restore from iCloud…)
  const offerRestore = useCallback(
    (cloud: NonNullable<Awaited<ReturnType<typeof readICloudBackup>>>, onDecided?: () => void) => {
      const when = cloud.exportedAt ? new Date(cloud.exportedAt).toLocaleString() : 'an earlier date';
      const n = cloud.data.habits.length;
      Alert.alert(
        'Restore from iCloud?',
        `Found a Hablits backup from ${when} with ${n} habit${n === 1 ? '' : 's'}. Restoring replaces what's on this device.`,
        [
          { text: 'Not now', style: 'cancel', onPress: () => onDecided?.() },
          {
            text: 'Restore',
            onPress: () => {
              dispatch({ type: 'LOAD_STATE', payload: migrateState({ ...cloud.data, schemaVersion: cloud.schemaVersion }, state) });
              dispatch({ type: 'SET_CLOUD_BACKUP_AT', payload: cloud.exportedAt || new Date().toISOString() });
              onDecided?.();
            },
          },
        ],
        { cancelable: false }
      );
    },
    [state]
  );

  // 1) Fresh install: if local is empty and iCloud has a backup, offer to
  //    restore before onboarding appears. Bounded by a timeout so a slow
  //    first iCloud handshake can't leave the screen blank; re-checked on
  //    every launch while the device stays empty.
  const [restoreChecked, setRestoreChecked] = useState(Platform.OS !== 'ios');
  useEffect(() => {
    if (!isLoaded || restoreChecked) return;
    let cancelled = false;
    (async () => {
      try {
        const localEmpty = state.habits.length === 0 && Object.keys(state.logs).length === 0;
        if (!localEmpty) return;
        const cloud = await Promise.race([
          readICloudBackup(8000),
          new Promise<null>((r) => setTimeout(() => r(null), 9000)),
        ]);
        if (cancelled || !cloud || !cloudHasMore(state, cloud)) return;
        await new Promise<void>((resolve) => offerRestore(cloud, resolve));
      } finally {
        if (!cancelled) setRestoreChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, restoreChecked]);

  // 2) Ongoing: a quiet daily snapshot whenever there's something to protect.
  //    backupToICloud() refuses to overwrite a newer, larger backup from
  //    another device (two-phone case).
  useEffect(() => {
    if (!isLoaded || !restoreChecked || Platform.OS !== 'ios') return;
    if (!shouldBackup(state, state.lastCloudBackupAt)) return;
    const t = setTimeout(async () => {
      const res = await backupToICloud(state, Constants.expoConfig?.version ?? undefined);
      if (res.ok && res.at) dispatch({ type: 'SET_CLOUD_BACKUP_AT', payload: res.at });
    }, 5000);
    return () => clearTimeout(t);
  }, [isLoaded, restoreChecked, state.habits, state.logs, state.lastCloudBackupAt]);

  // ---- Fasting Live Activity ----
  // Also re-sync on foreground: the system may have ended the activity.
  const [foregroundTick, setForegroundTick] = useState(0);

  // The widget opens the app with hablits://today. Go to the Today tab, whichever
  // tab was showing last, whether the app was closed or already running.
  useEffect(() => {
    const openFromLink = (url?: string | null) => {
      if (url && url.startsWith(WIDGET_DEEP_LINK)) setActiveTab('today');
    };
    Linking.getInitialURL().then(openFromLink).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => openFromLink(url));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && setForegroundTick((t) => t + 1));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!isLoaded) return;
    syncFastActivities(state, colors);
  }, [isLoaded, state.activeFasts, colors, foregroundTick]);

  // ---- Reminders ----
  // Per-habit reminders from Day Plan times + a general reminder for the rest.
  // Debounced so dragging a time slider doesn't hammer the OS.
  useEffect(() => {
    if (!isLoaded || Platform.OS === 'web') return;
    const t = setTimeout(async () => {
      const { syncHabitReminders } = await import('./utils/notifications');
      syncHabitReminders(state);
    }, 800);
    return () => clearTimeout(t);
  }, [isLoaded, state.notificationsEnabled, state.notificationTime, state.habits, state.dayPlanSchedules, state.vacations]);

  // ---- Streak-at-risk nudge ----
  // An 8pm heads-up only when a streak of a week or more is still open.
  useEffect(() => {
    if (!isLoaded || Platform.OS === 'web') return;
    const t = setTimeout(async () => {
      const { syncStreakNudges } = await import('./utils/streakNudge');
      syncStreakNudges(state);
    }, 1500);
    return () => clearTimeout(t);
  }, [isLoaded, state.notificationsEnabled, state.habits, state.logs, state.vacations, state.streakSaves, state.petName, foregroundTick]);

  // ---- Home screen widget ----
  // The pet is rasterized off-screen (PetSnapshot) so WidgetKit can show it;
  // we keep one image for the current mood and one for idle (tomorrow's entry).
  const [petImages, setPetImages] = useState<{ current?: string; idle?: string }>({});
  const onPetCaptured = useCallback((uri: string) => setPetImages((p) => (p.current === uri ? p : { ...p, current: uri })), []);
  const onIdlePetCaptured = useCallback((uri: string) => setPetImages((p) => (p.idle === uri ? p : { ...p, idle: uri })), []);
  const todayPct = getDayCompletionPercent(state.habits, state.logs, new Date(), 'all');
  const petMood = getMoodFromProgress(todayPct);

  // ---- Pet evolution ----
  const bestStreak = useMemo(() => bestStreakEver(state.habits, state.logs), [state.habits, state.logs, state.vacations, state.streakSaves]);
  // earnedStage is how far the pet has grown; petStage is the form on show,
  // which the owner can set back to any earlier one.
  const earnedStage = stageForStreak(bestStreak);
  const petStage = shownStage(earnedStage, state.petFormStage);
  // A new species / hat / stage invalidates both widget snapshots
  useEffect(() => {
    setPetImages({});
  }, [state.petSpecies, state.petHat, petStage]);
  // The adult stage is where a pet's path splits. Decide it once, from the
  // habits kept lately, the first time the pet is seen at that stage. Existing
  // users who are already past it get theirs decided the same way.
  useEffect(() => {
    if (isLoaded && earnedStage >= BRANCH_STAGE && !state.petBranch) {
      dispatch({ type: 'SET_PET_BRANCH', payload: decideBranch(state) });
    }
  }, [isLoaded, earnedStage, state.petBranch]);
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  useEffect(() => {
    if (isLoaded && earnedStage > state.petStageSeen) {
      // Let the day's confetti settle before the big reveal
      const t = setTimeout(() => setEvolutionVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoaded, earnedStage, state.petStageSeen]);

  // Ticks made on the widget: apply them BEFORE the first sync, or that sync
  // would overwrite the widget (and its queued taps) with stale state.
  // Re-read on foreground and whenever the widget reports a tap live.
  const [widgetTapsRead, setWidgetTapsRead] = useState(Platform.OS !== 'ios');
  const [widgetRefresh, setWidgetRefresh] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const applyWidgetTaps = useCallback(async () => {
    const taps = await readWidgetTaps();
    if (taps.length > 0) {
      const changes = planWidgetTaps(stateRef.current, taps);
      if (changes.length > 0) dispatch({ type: 'SET_HABITS_DONE', payload: changes });
      // Always rewrite the widget so its tap queue is emptied
      forceNextWidgetSync();
      setWidgetRefresh((n) => n + 1);
    }
    setWidgetTapsRead(true);
  }, [dispatch]);
  useEffect(() => {
    if (!isLoaded || Platform.OS !== 'ios') return;
    applyWidgetTaps();
  }, [isLoaded, foregroundTick, applyWidgetTaps]);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let sub: { remove: () => void } | undefined;
    import('expo-widgets')
      .then(({ addUserInteractionListener }) => {
        sub = addUserInteractionListener((e) => {
          if (e.target?.startsWith('toggle-')) applyWidgetTaps();
        });
      })
      .catch(() => {});
    return () => sub?.remove();
  }, [applyWidgetTaps]);

  useEffect(() => {
    if (!isLoaded || !widgetTapsRead) return;
    syncWidget(state, colors, petImages);
  }, [isLoaded, widgetTapsRead, widgetRefresh, state.habits, state.logs, colors, petImages]);

  // ---- Pet snacks ----
  // Earn for streak milestones and cover missed days. Runs when a day's data
  // changes and on foreground (a new day may have started while we were away).
  useEffect(() => {
    if (!isLoaded || !widgetTapsRead) return;
    dispatch({ type: 'RUN_SNACKS' });
  }, [isLoaded, widgetTapsRead, state.logs, state.habits, state.vacations, foregroundTick]);


  // Render the active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'today':
        return (
          <TodayScreen
            petStage={petStage}
            earnedStage={earnedStage}
            petSpecies={state.petSpecies}
            petHat={state.petHat}
            onOpenHatCloset={() => setHatClosetVisible(true)}
          />
        );
      case 'week':
        return <WeekScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'dayplan':
        return <DayPlanScreen />;
      case 'stats':
        return <StatsScreen />;
      default:
        return (
          <TodayScreen
            petStage={petStage}
            earnedStage={earnedStage}
            petSpecies={state.petSpecies}
            petHat={state.petHat}
            onOpenHatCloset={() => setHatClosetVisible(true)}
          />
        );
    }
  };

  // Handle saving identities
  const handleSaveIdentities = (newIdentities: Identity[]) => {
    // Find deleted identities
    const deletedIds = state.identities
      .filter((old) => !newIdentities.find((n) => n.id === old.id))
      .map((i) => i.id);

    // Delete removed identities
    deletedIds.forEach((id) => {
      dispatch({ type: 'DELETE_IDENTITY', payload: id });
    });

    // Update or add identities
    newIdentities.forEach((identity) => {
      const existing = state.identities.find((i) => i.id === identity.id);
      if (existing) {
        dispatch({ type: 'UPDATE_IDENTITY', payload: identity });
      } else {
        dispatch({ type: 'ADD_IDENTITY', payload: { name: identity.name, color: identity.color } });
      }
    });
  };

  // Calculate total completions for hat closet
  const totalCompletions = Object.values(state.logs).reduce(
    (sum, dayLogs) => sum + dayLogs.length,
    0
  );

  // Determine status bar style based on theme
  // Light status bar text on any theme with a dark background
  const isDarkTheme = textOn(colors.bg) === '#ffffff';

  return (
    <PetBranchProvider value={state.petBranch ?? null}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />

        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <Header
            identities={state.identities}
            currentFilter={state.currentIdentityFilter}
            onChangeFilter={(id) =>
              dispatch({ type: 'SET_IDENTITY_FILTER', payload: id })
            }
            onOpenIdentityFilter={() => setIdentityFilterModalVisible(true)}
            currentTheme={themeName}
            onChangeTheme={setTheme}
            onOpenThemePicker={() => setThemePickerVisible(true)}
            onOpenSettings={() => setSettingsModalVisible(true)}
            onOpenHatCloset={() => setHatClosetVisible(true)}
          />

          {/* Tab Bar */}
          <View style={styles.tabBarContainer}>
            <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
          </View>

          {/* Screen Content */}
          {/* Tabs are peers, so switching is instant: no slide or fade */}
          <View style={styles.screenContainer}>
            {renderScreen()}
          </View>
        </View>

        {/* Identities Modal */}
        <IdentitiesModal
          visible={identitiesModalVisible}
          identities={state.identities}
          onSave={handleSaveIdentities}
          onClose={() => setIdentitiesModalVisible(false)}
        />

        {/* Identity Filter Modal */}
        <IdentityFilterModal
          visible={identityFilterModalVisible}
          identities={state.identities}
          currentFilter={state.currentIdentityFilter}
          onSelectFilter={(id) =>
            dispatch({ type: 'SET_IDENTITY_FILTER', payload: id })
          }
          onClose={() => setIdentityFilterModalVisible(false)}
          onManageIdentities={() => setIdentitiesModalVisible(true)}
        />

        {/* Theme Picker Modal */}
        <ThemePickerModal
          visible={themePickerVisible}
          currentTheme={themeName}
          onSelectTheme={setTheme}
          onClose={() => setThemePickerVisible(false)}
        />

        {/* Onboarding Modal */}
        <OnboardingModal
          visible={isLoaded && restoreChecked && !state.hasCompletedOnboarding}
          species={state.petSpecies}
          hat={state.petHat}
          onComplete={(name, starterKeys) => {
            if (name.trim()) dispatch({ type: 'SET_PET_NAME', payload: name });
            if (starterKeys.length) dispatch({ type: 'ADD_STARTER_HABITS', payload: starterKeys });
            dispatch({ type: 'COMPLETE_ONBOARDING' });
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={settingsModalVisible}
          onClose={() => setSettingsModalVisible(false)}
          sfxEnabled={state.sfxEnabled}
          onToggleSfx={() => dispatch({ type: 'SET_SFX_ENABLED', payload: !state.sfxEnabled })}
          onToggleVacation={() => dispatch({ type: 'SET_VACATION', payload: !isOnVacation(state) })}
          hapticsEnabled={state.hapticsEnabled}
          onToggleHaptics={async () => {
            const { setHapticsEnabled } = await import('./utils/haptics');
            const newEnabled = !state.hapticsEnabled;
            dispatch({ type: 'SET_HAPTICS_ENABLED', payload: newEnabled });
            setHapticsEnabled(newEnabled);
          }}
          notificationsEnabled={state.notificationsEnabled}
          notificationTime={state.notificationTime}
          onToggleNotifications={async () => {
            const newEnabled = !state.notificationsEnabled;
            if (newEnabled) {
              const { requestNotificationPermissions } = await import('./utils/notifications');
              const hasPermission = await requestNotificationPermissions();
              if (!hasPermission) {
                Alert.alert(
                  'Permission Required',
                  'Please enable notifications in your device settings to receive habit reminders.',
                  [{ text: 'OK' }]
                );
                return;
              }
            }
            dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: newEnabled });
            // scheduling itself happens in the reminders effect below
          }}
          onSetNotificationTime={(hour, minute) => {
            dispatch({ type: 'SET_NOTIFICATION_TIME', payload: { hour, minute } });
          }}
          appState={state}
          lastCloudBackupAt={state.lastCloudBackupAt}
          onBackupNow={async () => {
            const res = await backupToICloud(state, Constants.expoConfig?.version ?? undefined);
            if (res.ok && res.at) dispatch({ type: 'SET_CLOUD_BACKUP_AT', payload: res.at });
            if (res.reason === 'cloud-newer') {
              return await new Promise<boolean>((resolve) =>
                Alert.alert(
                  'iCloud has a bigger backup',
                  'Another device wrote a newer backup with more data than this one. Overwrite it with this device\'s data?',
                  [
                    { text: 'Keep iCloud copy', style: 'cancel', onPress: () => resolve(true) },
                    {
                      text: 'Overwrite',
                      style: 'destructive',
                      onPress: async () => {
                        const forced = await backupToICloud(state, Constants.expoConfig?.version ?? undefined, { force: true });
                        if (forced.ok && forced.at) dispatch({ type: 'SET_CLOUD_BACKUP_AT', payload: forced.at });
                        resolve(forced.ok);
                      },
                    },
                  ]
                )
              );
            }
            return res.ok;
          }}
          onRestoreFromCloud={async () => {
            const cloud = await readICloudBackup(8000);
            if (!cloud) return false;
            offerRestore(cloud);
            return true;
          }}
          onRestoreHabit={(id) => dispatch({ type: 'RESTORE_HABIT', payload: id })}
          onDeleteHabit={(id) => dispatch({ type: 'DELETE_HABIT', payload: id })}
          onImportData={(data) => dispatch({ type: 'LOAD_STATE', payload: migrateState(data, state) })}
          currentTheme={themeName}
          customAccentColor={customAccentColor}
          onSetCustomAccentColor={setCustomAccentColor}
        />

        {/* Hat Closet Modal */}
        <HatClosetModal
          visible={hatClosetVisible}
          currentSpecies={state.petSpecies}
          currentHat={state.petHat}
          totalCompletions={totalCompletions}
          petStage={petStage}
          earnedStage={earnedStage}
          onSelectStage={(stage) => dispatch({ type: 'CHOOSE_PET_FORM', payload: stage === earnedStage ? null : stage })}
          bestStreak={bestStreak}
          petName={state.petName}
          onRenamePet={(name) => dispatch({ type: 'SET_PET_NAME', payload: name })}
          onSelectSpecies={(species) => dispatch({ type: 'SET_PET_SPECIES', payload: species })}
          onSelectHat={(hat) => dispatch({ type: 'SET_PET_HAT', payload: hat })}
          petBranch={state.petBranch ?? null}
          onSelectBranch={(branch) => {
            dispatch({ type: 'CHOOSE_PET_BRANCH', payload: branch });
            // Paths only look different from the adult form on, so a pet set
            // back to a younger form returns to its newest to show the change
            if (petStage < BRANCH_STAGE) dispatch({ type: 'CHOOSE_PET_FORM', payload: null });
          }}
          onClose={() => {
            setHatClosetVisible(false);
            // They've seen the closet, so nothing in it is news any more
            dispatch({ type: 'SET_HATS_SEEN', payload: getUnlockedHats(totalCompletions).length });
          }}
        />

        {/* Off-screen pet renders for the home screen widget */}
        <PetSnapshot species={state.petSpecies} hat={state.petHat} mood={petMood} stage={petStage} onCaptured={onPetCaptured} />
        {petMood !== 'idle' && (
          <PetSnapshot species={state.petSpecies} hat={state.petHat} mood="idle" stage={petStage} onCaptured={onIdlePetCaptured} />
        )}

        <EvolutionModal
          visible={evolutionVisible}
          species={state.petSpecies}
          hat={state.petHat}
          stage={earnedStage}
          branch={state.petBranch ?? null}
          petName={state.petName}
          onChooseBranch={(branch) => dispatch({ type: 'CHOOSE_PET_BRANCH', payload: branch })}
          onClose={() => {
            setEvolutionVisible(false);
            dispatch({ type: 'SET_PET_STAGE_SEEN', payload: earnedStage });
          }}
        />
      </SafeAreaView>

      {/* Covers the app until data + theme are in, then animates away */}
      <LaunchScreen
        ready={isLoaded && isThemeLoaded && areFontsReady}
        hasPet={state.hasCompletedOnboarding}
        species={state.petSpecies}
        hat={state.petHat}
        stage={petStage}
        petName={state.petName}
      />
    </GestureHandlerRootView>
    </PetBranchProvider>
  );
}

// ============================================
// ROOT APP (wraps in providers)
// ============================================
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
  },
  screenContainer: {
    flex: 1,
  },
});
