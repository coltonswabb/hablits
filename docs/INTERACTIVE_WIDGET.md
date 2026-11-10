# Design note: ticking habits from the widget

**Status: built in 1.4** (`src/utils/widgetTaps.ts`, the habit rows in
`src/widgets/TodayWidget.tsx`, wiring in `App.tsx`). Needs the on-device
checks below before release.

## The trap

expo-widgets lets a `Button` in the widget return new props, and WidgetKit
persists them and re-renders — all without the app running. So a tick in
the widget can *look* instant. But the app's source of truth is AsyncStorage
inside the app sandbox, which the widget extension cannot touch. The app only
learns about the tap via `addUserInteractionListener`, which fires **only
while the app process is alive**. Tap with the app killed → widget says done,
app says not done → next `syncWidget()` overwrites the widget with the app's
truth → the user's tick silently vanishes.

## The fix: an outbox in the widget's own props

No Swift needed. In expo-widgets 58 the button's AppIntent
(`WidgetUserInteraction` in `ios/Widgets/AppIntent.swift`) runs the layout's
`onPress` in the widget's JS runtime and **merges the returned props into the
stored timeline entry** in the App Group. `Widget.getTimeline()` reads that
same storage from the app. So the props themselves are the outbox:

1. Each medium/large habit row is a `Button target="toggle-<habitId>"`. Its
   `onPress` flips the row, adjusts `done`, and appends
   `{ id, date: props.date, done, ts }` to `props.taps`.
2. The app reads `taps` from every timeline entry (`readWidgetTaps`) on
   launch — **before the first `syncWidget()`**, which would otherwise wipe
   them — on foreground, and on a live `toggle-*` interaction event.
3. `planWidgetTaps` reduces them to changes (last tap wins per habit/day;
   drops unknown/archived habits, future dates and anything older than two
   days; drops taps that already match) and `SET_HABITS_DONE` applies them.
   Taps are absolute ("set done"), not toggles, so reading a list twice is
   harmless.
4. `forceNextWidgetSync()` + a resync rewrite the widget with the app's
   truth and `taps: []`.

Yesterday's taps are kept on purpose: ticking a habit at 23:59 and opening
the app at 00:01 should still count.

## Why not make the widget the source of truth?

Because the pet, streaks, letter, and backup all read AsyncStorage, and
moving the store into the App Group means every read path changes. Worth it
eventually (it also enables the Live Activity to show habit state), but not
as a side quest.

## Checks

- Unit: `src/__tests__/widgetTaps.test.ts`.
- Runtime: compile the layout and press a row in Expo's widget JS runtime
  without a device — build `ExpoWidgets.bundle`
  (`node node_modules/expo-widgets/scripts/build-bundle.mjs "$PWD" ios <out>`)
  and the layout registry (see DEVELOPMENT.md), evaluate both in a `vm`
  context, then call `__expoWidgetHandlePress(props, { widgetFamily, target })`.

## Acceptance checks on device

- Kill app → tick in widget → open app: habit is done, confetti does NOT
  fire retroactively, streak updated.
- Tick in widget with the app open in the background: app updates when you
  return to it.
- Tick then untick in the widget, open app: no change.
- Tick in widget, untick in app: app wins, widget follows.
- Tick at 23:59, open app after midnight: yesterday shows the habit done,
  widget shows the new day's list.
