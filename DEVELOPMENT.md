# Hablits — development notes

## Daily loop

```bash
npm install            # once per clone / after pulling dependency changes
npm run typecheck      # tsc --noEmit — must be clean before pushing
npm test               # jest — dates, streaks, migrations, widget props
git add -A && git commit -m "..." && git push   # GitHub is the backup. Push every session.
```

## Running the app

The app now includes a native widget extension (`expo-widgets`), so **Expo Go
can no longer run it**. Use a development build instead:

```bash
# One-time (or whenever app.json / native deps change):
npx eas build --profile development --platform ios
# Install the resulting build on your phone, then:
npx expo start
```

Or, with Xcode installed, `npx expo run:ios` builds and launches locally.

## Shipping

```bash
npx eas build --profile production --platform ios
npx eas submit --platform ios
```

`runtimeVersion` follows `appVersion`, so **any native change (SDK upgrade,
new native module, app.json plugin change) needs a version bump** in
`app.json` and a new store build — `eas update` alone would push JS that the
old binary can't run.

## Home screen widget

- Layout: `src/widgets/TodayWidget.tsx` — runs *outside* the app in WidgetKit.
  Only `@expo/ui/swift-ui` components, no hooks, no module-scope references.
  Everything it shows arrives via props.
- Data: `src/utils/widgetSync.ts` builds the props from app state + theme and
  pushes two timeline entries — now, and next midnight (so it rolls over to
  tomorrow's habits on its own).
- Wiring: `src/App.tsx` calls `syncWidget` whenever habits, logs or theme change.
- Config: the `expo-widgets` plugin block in `app.json`. App group
  `group.com.hablits.app`; deep link `hablits://today`.
- Families: small / medium / large, plus Lock Screen circular, rectangular, inline.
- Pet: `src/components/PetSnapshot.tsx` renders the pet off-screen and
  rasterizes it (react-native-svg `toDataURL`) to the app-group folder as
  `pet-<species>-<hat>-<mood>.png`; the widget shows it with `Image uiImage`.
  One file per combination, written once. Two snapshots are mounted: the
  current mood (today's entry) and idle (tomorrow's entry).
- Large widget also shows a Mon–Sun heatmap (`buildWeek` in widgetSync).
- To compile-check the widget without a device:
  `node node_modules/expo-widgets/scripts/build-layout-registry.mjs "$PWD" ios /tmp/registry.json`

Not yet: tapping a habit *in* the widget. Widget-side state can't reach the
app when it's closed, so v1 is read-only and taps open the app.

## Persistence

- `src/state/AppContext.tsx` saves to AsyncStorage **only after** the initial
  load completes (the 1.0 build had a race that could wipe data).
- Saved blobs carry `schemaVersion`. Changing the shape of `AppState`? Bump
  `SCHEMA_VERSION` in `src/state/migrations.ts` and add a step.
- Theme + accent colour persist separately under `hablits_theme_v1`.

## Accessibility & motion

- `useReduceMotion()` / `isReduceMotion()` in `src/utils/motion.ts` mirror the
  OS Reduce Motion setting. Pet idle loops, reactive bounces, milestone jumps,
  screen slide transitions and confetti all stand down when it's on. Blinking
  stays. Gate any new continuous animation the same way.
- Themes are contrast-tested (`src/__tests__/colors.test.ts`). Text on an
  accent/good/danger surface must use `colors.textOnAccent` or `textOn(bg)`,
  never a literal white.

## Known gaps

- Sound effects are only implemented on web (`src/utils/sounds.ts`). On iOS the
  toggle does nothing yet. `expo-audio` is installed and ready; the old
  prototype's `sfx/*.wav` files are a starting point.
- `dayPlanTimes` is deprecated in favour of `dayPlanSchedules`; finish the
  migration and delete it.
- `react-native-gesture-handler` 3.x deprecates `PanGestureHandler`
  (used in `SwipeableHabitCard`, `SettingsModal`). Still works; migrate to
  `Gesture.Pan()` before v4.
