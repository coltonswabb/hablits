# Design note: ticking habits from the widget

**Status: deferred — needs a device build.** Written so the next person
(probably us) doesn't rediscover the trap.

## The trap

expo-widgets lets a `Button` in the widget return new props, and WidgetKit
persists them and re-renders — all without the app running. So a tick in
the widget can *look* instant. But the app's source of truth is AsyncStorage
inside the app sandbox, which the widget extension cannot touch. The app only
learns about the tap via `addUserInteractionListener`, which fires **only
while the app process is alive**. Tap with the app killed → widget says done,
app says not done → next `syncWidget()` overwrites the widget with the app's
truth → the user's tick silently vanishes.

## The fix: a shared outbox in the App Group

Both the app and the widget can read/write the App Group container
(`widgetsDirectory`). Use it as a one-way queue:

1. Widget `Button target="toggle:<habitId>"` `onPress` returns props with the
   habit marked done AND appends `{habitId, date, ts}` to
   `pending-toggles.json` in the App Group. *(Open question: the widget
   runtime is sandboxed JS with no file API today — this likely needs a tiny
   AppIntent in Swift that writes the file, invoked via the Button. Check the
   expo-widgets changelog for an `AppIntent`/file-write hook before building.)*
2. App, on launch and on foreground (`AppState` listener), reads
   `pending-toggles.json`, dispatches `TOGGLE_HABIT` for each entry whose
   date is today and whose state differs, then truncates the file.
3. `syncWidget()` then pushes truth as usual — now consistent.

Conflict rule: the outbox wins for *today* only; stale entries (yesterday)
are dropped, not applied.

## Why not just make the widget the source of truth?

Because the pet, streaks, letter, and backup all read AsyncStorage, and
moving the store into the App Group means every read path changes. Worth it
eventually (it also enables the Live Activity to show habit state), but not
as a side quest.

## Acceptance checks on device

- Kill app → tick in widget → open app: habit is done, confetti does NOT
  fire retroactively, streak updated.
- Tick in widget, untick in app within 2s: app wins, widget follows.
- Tick at 23:59, open app at 00:01: entry dropped (different day), widget
  rolled over to the new day's list.
