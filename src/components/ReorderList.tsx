// ============================================
// REORDER LIST
// ============================================
// Drag-to-reorder for the Today screen. Each habit is a compact row with a
// handle on the right; hold the handle and drag, and the other rows move out
// of the way. Dropping saves the new order.
//
// Rows are absolutely positioned at index * SLOT and moved with transforms,
// so nothing re-lays out while dragging.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { useTheme, spacing, radii, fontSizes } from '../theme';
import { moveItem } from '../utils/reorder';
import { lightTap, selectionTap } from '../utils/haptics';
import { useReduceMotion } from '../utils/motion';
import { autoScrollSpeed } from '../utils/autoScroll';

const ROW_HEIGHT = 52;
const ROW_GAP = 8;
const SLOT = ROW_HEIGHT + ROW_GAP;
const SHIFT_MS = 150;
const LIFTED_SCALE = 1.03;

export type ReorderItem = { id: string; name: string; color: string };

interface ReorderListProps {
  items: ReorderItem[];
  /** Called with the ids in their new order when a row is dropped somewhere new */
  onReorder: (ids: string[]) => void;
  /** True while a row is being dragged, so the screen can stop scrolling */
  onDragActiveChange?: (active: boolean) => void;
  /**
   * Lets the list scroll the screen it sits in while a row is held near the
   * top or bottom. `getViewport` is the visible scroll area in window
   * coordinates; `scrollBy` scrolls by that many points and returns how far it
   * actually moved (0 at either end).
   */
  autoScroll?: { getViewport: () => { top: number; bottom: number }; scrollBy: (delta: number) => number };
}

export function ReorderList({ items, onReorder, onDragActiveChange, autoScroll }: ReorderListProps) {
  const reduceMotion = useReduceMotion();
  const [order, setOrder] = useState(() => items.map((i) => i.id));
  const [activeId, setActiveId] = useState<string | null>(null);

  // One animated position per row, created on demand and kept across renders
  const positions = useRef<Record<string, Animated.Value>>({}).current;
  const positionOf = (id: string, index: number) => (positions[id] ??= new Animated.Value(index * SLOT));

  // `scrolled` is how far the screen has auto-scrolled during this drag. The
  // row has to move that much further to stay under the finger.
  const drag = useRef<{ id: string; from: number; hover: number; live: string[]; translationY: number; fingerY: number; scrolled: number } | null>(null);
  const autoScrollFrame = useRef<number | null>(null);
  const autoScrollRef = useRef(autoScroll);
  autoScrollRef.current = autoScroll;

  const stopAutoScroll = () => {
    if (autoScrollFrame.current !== null) cancelAnimationFrame(autoScrollFrame.current);
    autoScrollFrame.current = null;
  };
  useEffect(() => stopAutoScroll, []);

  // Follow the list when habits are added, removed or reordered elsewhere
  const itemIds = items.map((i) => i.id).join('|');
  useEffect(() => {
    if (drag.current) return;
    const ids = items.map((i) => i.id);
    ids.forEach((id, index) => positionOf(id, index).setValue(index * SLOT));
    setOrder(ids);
  }, [itemIds]);

  const settle = (id: string, index: number) =>
    Animated.timing(positionOf(id, index), {
      toValue: index * SLOT,
      duration: reduceMotion ? 0 : SHIFT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

  const handleStart = (id: string) => {
    const from = order.indexOf(id);
    if (from === -1) return;
    drag.current = { id, from, hover: from, live: order, translationY: 0, fingerY: 0, scrolled: 0 };
    setActiveId(id);
    lightTap();
    onDragActiveChange?.(true);
  };

  // Scrolls the screen while the finger rests near an edge, one step per frame
  const autoScrollTick = () => {
    autoScrollFrame.current = null;
    const current = drag.current;
    const scroller = autoScrollRef.current;
    if (!current || !scroller) return;
    const { top, bottom } = scroller.getViewport();
    const speed = autoScrollSpeed(current.fingerY, top, bottom);
    if (speed === 0) return;
    const moved = scroller.scrollBy(speed);
    if (moved === 0) return; // reached the top or bottom
    current.scrolled += moved;
    placeDraggedRow();
    autoScrollFrame.current = requestAnimationFrame(autoScrollTick);
  };

  const handleMove = (id: string, translationY: number, fingerY: number) => {
    const current = drag.current;
    if (!current || current.id !== id) return;
    current.translationY = translationY;
    current.fingerY = fingerY;
    placeDraggedRow();
    if (autoScrollRef.current && autoScrollFrame.current === null) {
      autoScrollFrame.current = requestAnimationFrame(autoScrollTick);
    }
  };

  // Puts the dragged row under the finger and moves the others out of its way
  const placeDraggedRow = () => {
    const current = drag.current;
    if (!current) return;
    const { id } = current;
    const maxY = (order.length - 1) * SLOT;
    const y = Math.max(0, Math.min(maxY, current.from * SLOT + current.translationY + current.scrolled));
    positionOf(id, current.from).setValue(y);

    const hover = Math.round(y / SLOT);
    if (hover === current.hover) return;
    current.hover = hover;
    current.live = moveItem(order, current.from, hover);
    selectionTap();
    // The other rows slide to where they would end up
    Animated.parallel(current.live.filter((other) => other !== id).map((other) => settle(other, current.live.indexOf(other)))).start();
  };

  const handleEnd = (id: string) => {
    const current = drag.current;
    if (!current || current.id !== id) return;
    stopAutoScroll();
    const { live, hover, from } = current;
    settle(id, hover).start(() => {
      drag.current = null;
      setActiveId(null);
      setOrder(live);
      onDragActiveChange?.(false);
      if (hover !== from) onReorder(live);
    });
  };

  const byId = new Map(items.map((i) => [i.id, i]));

  return (
    <View style={{ height: Math.max(0, order.length * SLOT - ROW_GAP) }}>
      {order.map((id, index) => {
        const item = byId.get(id);
        if (!item) return null;
        return (
          <ReorderRow
            key={id}
            item={item}
            position={positionOf(id, index)}
            isActive={activeId === id}
            onStart={handleStart}
            onMove={handleMove}
            onEnd={handleEnd}
          />
        );
      })}
    </View>
  );
}

interface ReorderRowProps {
  item: ReorderItem;
  position: Animated.Value;
  isActive: boolean;
  onStart: (id: string) => void;
  /** `fingerY` is the finger's position in window coordinates */
  onMove: (id: string, translationY: number, fingerY: number) => void;
  onEnd: (id: string) => void;
}

function ReorderRow({ item, position, isActive, onStart, onMove, onEnd }: ReorderRowProps) {
  const { colors, radius, headingFont } = useTheme();

  // The latest handlers, so the gesture never calls a stale one
  const handlers = useRef({ onStart, onMove, onEnd });
  handlers.current = { onStart, onMove, onEnd };

  const pan = usePanGesture({
    // Starts as soon as the handle moves; the handle is the only draggable part
    activeOffsetY: [-2, 2],
    onActivate: () => handlers.current.onStart(item.id),
    onUpdate: (event) => handlers.current.onMove(item.id, event.translationY, event.absoluteY),
    onFinalize: () => handlers.current.onEnd(item.id),
  });

  return (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.accent : colors.divider,
          borderRadius: radius.md,
          zIndex: isActive ? 2 : 1,
          elevation: isActive ? 6 : 0,
          shadowOpacity: isActive ? 0.2 : 0,
          transform: [{ translateY: position }, { scale: isActive ? LIFTED_SCALE : 1 }],
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <Text style={[styles.name, { color: colors.text }, headingFont]} numberOfLines={1}>
        {item.name}
      </Text>
      <GestureDetector gesture={pan}>
        <View
          style={styles.handle}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Reorder ${item.name}`}
          accessibilityHint="Hold and drag up or down to move this habit"
        >
          <Text style={[styles.handleIcon, { color: colors.muted }]}>≡</Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  name: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  // A full-height, 56pt-wide target so the handle is easy to grab
  handle: {
    width: 56,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleIcon: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
  },
});
