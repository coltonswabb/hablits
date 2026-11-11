// ============================================
// ONBOARDING MODAL COMPONENT
// ============================================
// First-time guide. The pages sit side by side in a pager, so you can swipe
// between them as the dots suggest, or use Next. The order is:
//
//   what Hablits is → a real habit card to practise swiping on →
//   themes and pets → name your pet → pick some starter habits
// ============================================

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableScale } from './TouchableScale';
import { useTheme, themes } from '../theme';
import { Pet } from './Pet';
import { SwipeableHabitCard } from './SwipeableHabitCard';
import { StarterHabitsPicker } from './StarterHabitsPicker';
import { Habit, Identity, PetSpecies, HatType } from '../types';
import { NAME_SUGGESTIONS, MAX_PET_NAME } from '../utils/petName';
import { todayStr } from '../utils';
import { useReduceMotion } from '../utils/motion';
import { radii, fontSizes } from '../theme/tokens';

interface OnboardingModalProps {
  visible: boolean;
  species: PetSpecies;
  hat: HatType;
  /** Called with the chosen pet name ('' if skipped) and the starter habits picked (maybe none) */
  onComplete: (petName: string, starterKeys: string[]) => void;
}

type Page =
  | { kind: 'info'; title: string; description: string; details: string[]; art: 'pet' | 'emoji'; emoji?: string }
  | { kind: 'swipe'; title: string; description: string; details: string[] }
  | { kind: 'naming'; title: string; description: string }
  | { kind: 'starters'; title: string; description: string };

const PAGES: Page[] = [
  {
    kind: 'info',
    title: '👋 Welcome to Hablits',
    description: 'Small habits, looked after by a pet.',
    details: [
      'Add the habits you want to keep',
      'Tick them off each day',
      'Your pet gets a treat for every one',
      'Streaks build as you go',
    ],
    art: 'pet',
  },
  {
    kind: 'swipe',
    title: '👉 Swipe to tick',
    description: 'The fastest way to mark a habit.',
    details: ['Swipe right to complete', 'Swipe left to skip', 'Or tap the box to cycle ✓ → – → ×'],
  },
  {
    kind: 'info',
    title: '🎨 Make it yours',
    description: 'Themes, pets and hats.',
    details: [
      `${Object.keys(themes).length} themes, each with its own look`,
      'Earn hats for your pet as you go',
      'Group habits by identity, like "Reader" or "Athlete"',
      'See streaks and trends in Stats',
    ],
    art: 'emoji',
    emoji: '🎨',
  },
  {
    kind: 'naming',
    title: 'Meet your pet',
    description: 'It gets happier as you complete habits, and it grows for good when your streaks do. Give it a name?',
  },
  {
    kind: 'starters',
    title: 'Pick a few to start',
    description: 'Tap any that fit, or skip. You can rename, change or remove them later.',
  },
];

const NAMING_PAGE = PAGES.findIndex((p) => p.kind === 'naming');
const LAST_PAGE = PAGES.length - 1;

// The practice card on the "Swipe to tick" page. It is the real habit card,
// fed a made-up habit, so it behaves exactly like the ones on Today.
const DEMO_HABIT: Habit = {
  id: 'onboarding-demo',
  name: 'Try me',
  weeklyGoal: 7,
  identityId: 'general',
  createdAt: '2000-01-01T00:00:00.000Z',
  days: [true, true, true, true, true, true, true],
  order: 1,
};
const DEMO_IDENTITY: Identity = { id: 'general', name: 'Practice', color: '#3ddc97' };
type DemoStatus = 'empty' | 'done' | 'skipped';
const NEXT_DEMO_STATUS: Record<DemoStatus, DemoStatus> = { empty: 'done', done: 'skipped', skipped: 'empty' };

export function OnboardingModal({ visible, species, hat, onComplete }: OnboardingModalProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [petName, setPetName] = useState('');
  const [starterKeys, setStarterKeys] = useState<string[]>([]);
  const [demoStatus, setDemoStatus] = useState<DemoStatus>('empty');
  // While a finger is on the practice card, the pager must not scroll with it
  const [pagerLocked, setPagerLocked] = useState(false);

  const today = todayStr();

  const goTo = (page: number) => {
    Keyboard.dismiss();
    pager.current?.scrollTo({ x: page * width, animated: !reduceMotion });
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < LAST_PAGE) goTo(currentPage + 1);
    else onComplete(petName, starterKeys);
  };

  // Skip the tour but still offer the name and the starter habits
  const handleSkip = () => goTo(NAMING_PAGE);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page !== currentPage && page >= 0 && page <= LAST_PAGE) {
      Keyboard.dismiss();
      setCurrentPage(page);
    }
  };

  const toggleStarter = (key: string) =>
    setStarterKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  const page = PAGES[currentPage];
  const primaryLabel =
    page.kind === 'naming'
      ? petName.trim()
        ? `Meet ${petName.trim()}`
        : 'Maybe later'
      : page.kind === 'starters'
        ? starterKeys.length
          ? `Add ${starterKeys.length} and start`
          : 'Pick a habit'
        : 'Next';
  const onStarters = page.kind === 'starters';
  // On the last page the main button needs at least one habit picked; Skip finishes without any
  const primaryDisabled = onStarters && starterKeys.length === 0;

  const renderHeading = (p: Page) => (
    <View style={styles.slideContent}>
      <Text style={[styles.title, { color: colors.text }]}>{p.title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{p.description}</Text>
      {'details' in p && (
        <View style={styles.detailsList}>
          {p.details.map((detail) => (
            <View key={detail} style={styles.detailItem}>
              <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.detailText, { color: colors.text }]}>{detail}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderBody = (p: Page) => {
    switch (p.kind) {
      case 'info':
        return (
          <View style={[styles.illustration, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            {p.art === 'pet' ? (
              <Pet species={species} mood="happy" hat={hat} size={120} />
            ) : (
              <Text style={styles.illustrationEmoji}>{p.emoji}</Text>
            )}
          </View>
        );
      case 'swipe':
        return (
          <View
            style={styles.demo}
            onTouchStart={() => setPagerLocked(true)}
            onTouchEnd={() => setPagerLocked(false)}
            onTouchCancel={() => setPagerLocked(false)}
          >
            <SwipeableHabitCard
              habit={DEMO_HABIT}
              identity={DEMO_IDENTITY}
              logs={demoStatus === 'done' ? { [today]: [DEMO_HABIT.id] } : {}}
              marks={demoStatus === 'skipped' ? { [today]: { skip: [DEMO_HABIT.id], fail: [] } } : {}}
              today={today}
              onToggle={() => setDemoStatus((status) => NEXT_DEMO_STATUS[status])}
              onPress={() => {}}
              isComplete={demoStatus === 'done'}
              isSkipped={demoStatus === 'skipped'}
            />
            <Text style={[styles.demoCaption, { color: colors.muted }]}>
              {demoStatus === 'empty'
                ? 'Try it: swipe this card to the right'
                : demoStatus === 'done'
                  ? 'Done! Now try swiping it left to skip'
                  : 'Skipped. That is all there is to it.'}
            </Text>
          </View>
        );
      case 'naming':
        return (
          <View style={[styles.illustration, { backgroundColor: colors.card, borderColor: colors.divider, height: undefined, paddingVertical: 24 }]}>
            <Pet species={species} mood={petName.trim() ? 'excited' : 'curious'} hat={hat} size={120} />
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.bg }]}
              placeholder="Name your pet"
              placeholderTextColor={colors.muted}
              value={petName}
              onChangeText={(t) => setPetName(t.slice(0, MAX_PET_NAME))}
              maxLength={MAX_PET_NAME}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              accessibilityLabel="Pet name"
            />
            <View style={styles.suggestions}>
              {NAME_SUGGESTIONS[species].map((n) => (
                <TouchableScale
                  key={n}
                  onPress={() => setPetName(n)}
                  style={[styles.chip, { borderColor: colors.divider, backgroundColor: petName === n ? colors.accent : 'transparent' }]}
                >
                  <Text style={[styles.chipText, { color: petName === n ? colors.textOnAccent : colors.text }]}>{n}</Text>
                </TouchableScale>
              ))}
            </View>
            <Text style={[styles.hint, { color: colors.muted }]}>You can change this any time from the Hat Closet.</Text>
          </View>
        );
      case 'starters':
        return (
          <View style={styles.starters}>
            <StarterHabitsPicker selected={starterKeys} onToggle={toggleStarter} />
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="fade">
      <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Page dots */}
        <View style={styles.indicators}>
          {PAGES.map((p, index) => (
            <View
              key={p.title}
              style={[styles.indicator, { backgroundColor: index === currentPage ? colors.accent : colors.divider }]}
            />
          ))}
        </View>

        {/* Pages side by side: swipe between them, or use the buttons */}
        <ScrollView
          ref={pager}
          style={styles.pager}
          horizontal
          pagingEnabled
          scrollEnabled={!pagerLocked}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {PAGES.map((p) => (
            <ScrollView
              key={p.title}
              style={{ width }}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderHeading(p)}
              {renderBody(p)}
            </ScrollView>
          ))}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.footer, { backgroundColor: colors.bg }]}>
          {/* Skip the tour (early pages), or start without any starter habits (last page) */}
          {(currentPage < NAMING_PAGE || onStarters) && (
            <TouchableScale
              style={styles.skipButton}
              onPress={onStarters ? () => onComplete(petName, []) : handleSkip}
              accessibilityRole="button"
              accessibilityLabel={onStarters ? 'Skip starter habits' : 'Skip the tour'}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
            </TouchableScale>
          )}

          <TouchableScale
            style={[
              styles.nextButton,
              { backgroundColor: primaryDisabled ? colors.divider : colors.accent },
              page.kind === 'naming' && { flex: 1 },
            ]}
            onPress={handleNext}
            disabled={primaryDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: primaryDisabled }}
          >
            <Text style={[styles.nextText, { color: primaryDisabled ? colors.muted : colors.textOnAccent }]}>{primaryLabel}</Text>
          </TouchableScale>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    marginTop: 18,
    width: '80%',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  suggestions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { fontSize: fontSizes.sm, fontWeight: '600' },
  hint: { fontSize: fontSizes.xs, marginTop: 14, textAlign: 'center' },
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  demo: {
    marginTop: 'auto',
  },
  demoCaption: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  starters: {
    marginTop: 8,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 0,
    paddingBottom: 120,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    marginTop: 64,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: radii.xs,
  },
  slideContent: {
    marginBottom: 32,
  },
  title: {
    fontSize: fontSizes.hero,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSizes.lg,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: radii.xs,
  },
  detailText: {
    fontSize: fontSizes.md,
    flex: 1,
  },
  illustration: {
    height: 200,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
});
