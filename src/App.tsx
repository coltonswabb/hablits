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
import { View, StyleSheet, SafeAreaView, StatusBar, Animated, Alert, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Providers
import { ThemeProvider, useTheme } from './theme';
import { AppProvider, useApp } from './state';

// Components
import { Header, TabBar, IdentitiesModal, IdentityFilterModal, OnboardingModal, ThemePickerModal, SettingsModal, HatClosetModal, ErrorBoundary, PetSnapshot, EvolutionModal, getMoodFromProgress } from './components';

// Screens
import { TodayScreen, WeekScreen, CalendarScreen, DayPlanScreen, StatsScreen } from './screens';

// Types
import { TabName, Identity } from './types';

// Utils
import { initializeAudio, setSoundsEnabled } from './utils/sounds';
import { syncWidget } from './utils/widgetSync';
import { useReduceMotion } from './utils/motion';
import { getDayCompletionPercent } from './utils/habits';
import { bestStreakEver, stageForStreak } from './utils/evolution';
import { migrateState } from './state/migrations';

// ============================================
// MAIN CONTENT (inside providers)
// ============================================
function AppContent() {
  const { colors, themeName, setTheme, customAccentColor, setCustomAccentColor } = useTheme();
  const { state, dispatch, isLoaded } = useApp();
  const [activeTab, setActiveTab] = useState<TabName>('today');
  const [identitiesModalVisible, setIdentitiesModalVisible] = useState(false);
  const [identityFilterModalVisible, setIdentityFilterModalVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Hat closet state
  const [hatClosetVisible, setHatClosetVisible] = useState(false);

  // Screen transition animations
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

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

  // Keep the sound and haptics gates in sync with Settings
  useEffect(() => {
    setSoundsEnabled(state.sfxEnabled);
  }, [state.sfxEnabled]);

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
  }, [isLoaded, state.notificationsEnabled, state.notificationTime, state.habits, state.dayPlanSchedules]);

  // ---- Home screen widget ----
  // The pet is rasterized off-screen (PetSnapshot) so WidgetKit can show it;
  // we keep one image for the current mood and one for idle (tomorrow's entry).
  const [petImages, setPetImages] = useState<{ current?: string; idle?: string }>({});
  const onPetCaptured = useCallback((uri: string) => setPetImages((p) => (p.current === uri ? p : { ...p, current: uri })), []);
  const onIdlePetCaptured = useCallback((uri: string) => setPetImages((p) => (p.idle === uri ? p : { ...p, idle: uri })), []);
  const todayPct = getDayCompletionPercent(state.habits, state.logs, new Date(), 'all');
  const petMood = getMoodFromProgress(todayPct);

  // ---- Pet evolution ----
  const bestStreak = useMemo(() => bestStreakEver(state.habits, state.logs), [state.habits, state.logs]);
  const petStage = stageForStreak(bestStreak);
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  useEffect(() => {
    if (isLoaded && petStage > state.petStageSeen) {
      // Let the day's confetti settle before the big reveal
      const t = setTimeout(() => setEvolutionVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoaded, petStage, state.petStageSeen]);

  useEffect(() => {
    if (!isLoaded) return;
    syncWidget(state, colors, petImages);
  }, [isLoaded, state.habits, state.logs, colors, petImages]);

  // Animate screen transitions (a plain cross-fade when Reduce Motion is on)
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    if (reduceMotion) {
      screenTranslateX.setValue(0);
      screenScale.setValue(1);
      screenOpacity.setValue(0.4);
      Animated.timing(screenOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      return;
    }
    // Slide and fade out, then slide and fade in
    Animated.sequence([
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 0.97,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(screenTranslateX, {
          toValue: 0,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.spring(screenScale, {
          toValue: 1,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeTab]);

  // Render the active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'today':
        return (
          <TodayScreen
            petStage={petStage}
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
  const isDarkTheme = ['dark', 'fzero', 'mmbn'].includes(themeName);

  return (
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
          <Animated.View
            style={[
              styles.screenContainer,
              {
                opacity: screenOpacity,
                transform: [
                  { translateX: screenTranslateX },
                  { scale: screenScale },
                ],
              },
            ]}
          >
            {renderScreen()}
          </Animated.View>
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
          visible={!state.hasCompletedOnboarding}
          onComplete={() => dispatch({ type: 'COMPLETE_ONBOARDING' })}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={settingsModalVisible}
          onClose={() => setSettingsModalVisible(false)}
          sfxEnabled={state.sfxEnabled}
          onToggleSfx={() => dispatch({ type: 'SET_SFX_ENABLED', payload: !state.sfxEnabled })}
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
          bestStreak={bestStreak}
          onSelectSpecies={(species) => dispatch({ type: 'SET_PET_SPECIES', payload: species })}
          onSelectHat={(hat) => dispatch({ type: 'SET_PET_HAT', payload: hat })}
          onClose={() => setHatClosetVisible(false)}
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
          stage={petStage}
          onClose={() => {
            setEvolutionVisible(false);
            dispatch({ type: 'SET_PET_STAGE_SEEN', payload: petStage });
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
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
