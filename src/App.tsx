// ============================================
// HABLITS - MAIN APP
// ============================================
// This is the root component that:
// 1. Wraps everything in Providers (Theme, State)
// 2. Shows the Header
// 3. Shows the TabBar
// 4. Renders the active screen
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Providers
import { ThemeProvider, useTheme } from './theme';
import { AppProvider, useApp } from './state';

// Components
import { Header, TabBar, IdentitiesModal, IdentityFilterModal, OnboardingModal, ThemePickerModal, SettingsModal, HatClosetModal } from './components';

// Screens
import { TodayScreen, WeekScreen, CalendarScreen, DayPlanScreen, StatsScreen } from './screens';

// Types
import { TabName, Identity } from './types';

// Utils
import { initializeAudio } from './utils/sounds';

// ============================================
// MAIN CONTENT (inside providers)
// ============================================
function AppContent() {
  const { colors, themeName, setTheme } = useTheme();
  const { state, dispatch } = useApp();
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

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
  }, []);

  // Animate screen transitions
  useEffect(() => {
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
          appState={state}
          onImportData={(data) => dispatch({ type: 'LOAD_STATE', payload: data })}
        />

        {/* Hat Closet Modal */}
        <HatClosetModal
          visible={hatClosetVisible}
          currentSpecies={state.petSpecies}
          currentHat={state.petHat}
          totalCompletions={totalCompletions}
          onSelectSpecies={(species) => dispatch({ type: 'SET_PET_SPECIES', payload: species })}
          onSelectHat={(hat) => dispatch({ type: 'SET_PET_HAT', payload: hat })}
          onClose={() => setHatClosetVisible(false)}
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
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
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
