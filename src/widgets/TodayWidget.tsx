// ============================================
// HOME SCREEN WIDGET — "Today"
// ============================================
// Rendered by WidgetKit via expo-widgets. The layout function below is
// compiled into its own bundle and runs OUTSIDE the app, so the rules are
// strict (see https://docs.expo.dev/versions/latest/sdk/widgets/):
//
//   - only @expo/ui/swift-ui components + modifiers (no RN View/Text)
//   - no hooks, no state, no async, no module-scope references
//   - everything it needs arrives via `props` (set from the app with
//     updateTimeline) or `environment` (family, colour scheme, ...)
//
// The app side that computes and pushes the props is src/utils/widgetSync.ts.
// ============================================

import { Divider, Gauge, HStack, Image, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  minimumScaleFactor,
  opacity,
  padding,
  resizable,
  strokeBorder,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

export type WidgetHabit = {
  name: string;
  done: boolean;
};

export type WidgetDay = {
  label: string;
  pct: number;
  isToday: boolean;
  isFuture: boolean;
};

export type TodayWidgetProps = {
  /** YYYY-MM-DD the entry describes — lets the widget say "Today" honestly */
  date: string;
  done: number;
  total: number;
  /** Longest current streak across the user's habits */
  bestStreak: number;
  /** Pet mood word, e.g. "thrilled" — mirrors getMoodFromProgress */
  mood: string;
  /** Evolution stage name, e.g. "Veteran" */
  stageName: string;
  /** Today's habits, undone first, capped by the sender */
  habits: WidgetHabit[];
  /** Mon..Sun of the current week for the mini heatmap */
  week: WidgetDay[];
  /** file:// URI of the rasterized pet, or '' until the app has produced one */
  petImage: string;
  /** Theme colours so the widget matches the app */
  bg: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  good: string;
};

export const WIDGET_NAME = 'HablitsToday';
export const WIDGET_DEEP_LINK = 'hablits://today';

const TodayWidget = (props: TodayWidgetProps, environment: { widgetFamily?: string }) => {
  'widget';

  // ---- everything the layout needs is declared INSIDE the function ----
  const family = environment.widgetFamily ?? 'systemSmall';
  const total = props.total ?? 0;
  const done = props.done ?? 0;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const allDone = total > 0 && done >= total;
  const remaining = Math.max(0, total - done);
  const link = 'hablits://today';

  const headline = total === 0 ? 'No habits today' : allDone ? 'All done!' : `${remaining} to go`;

  const sub =
    total === 0
      ? 'Add one in the app'
      : allDone
        ? `Your pet is ${props.mood}`
        : props.bestStreak > 0
          ? `${props.stageName} · ${props.bestStreak}-day streak`
          : `Your pet is ${props.mood}`;

  const ringColor = allDone ? props.good : props.accent;

  // Circular progress with the fraction in the middle
  const ring = (size: number, labelSize: number) => (
    <Gauge
      value={pct}
      min={0}
      max={1}
      modifiers={[gaugeStyle('circularCapacity'), tint(ringColor), frame({ width: size, height: size })]}
      currentValueLabel={
        <Text modifiers={[font({ size: labelSize, weight: 'bold', design: 'rounded' }), foregroundStyle(props.text)]}>
          {total === 0 ? '–' : `${done}/${total}`}
        </Text>
      }
    />
  );

  // One row in the habit list
  const row = (h: WidgetHabit, idx: number) => (
    <HStack key={`${idx}-${h.name}`} spacing={8}>
      <Image
        systemName={h.done ? 'checkmark.circle.fill' : 'circle'}
        size={15}
        color={h.done ? props.good : props.muted}
      />
      <Text
        modifiers={[
          font({ size: 14, weight: h.done ? 'regular' : 'medium' }),
          foregroundStyle(h.done ? props.muted : props.text),
          lineLimit(1),
        ]}
      >
        {h.name}
      </Text>
      <Spacer />
    </HStack>
  );

  const streakBadge = (
    <HStack spacing={4}>
      <Image systemName="flame.fill" size={12} color={props.accent} />
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.muted)]}>
        {`${props.bestStreak}`}
      </Text>
    </HStack>
  );

  // The pet, when the app has rasterized one for the widget to read
  const hasPet = typeof props.petImage === 'string' && props.petImage.length > 0;
  const pet = (size: number) =>
    hasPet ? (
      <Image uiImage={props.petImage} modifiers={[resizable(), frame({ width: size, height: size })]} />
    ) : null;

  // Mon..Sun mini heatmap — fill opacity tracks that day's completion
  const week = props.week ?? [];
  const heatmap = (cell: number) => (
    <HStack spacing={8}>
      {week.map((d, i) => (
        <VStack key={`${i}-${d.label}`} spacing={4}>
          <ZStack modifiers={[frame({ width: cell, height: cell })]}>
            <RoundedRectangle
              cornerRadius={cell * 0.28}
              modifiers={[
                foregroundStyle(d.isFuture ? props.muted : props.accent),
                opacity(d.isFuture ? 0.12 : 0.18 + 0.82 * Math.min(1, d.pct)),
                frame({ width: cell, height: cell }),
              ]}
            />
            {d.isToday ? (
              <RoundedRectangle
                cornerRadius={cell * 0.28}
                modifiers={[strokeBorder({ content: props.text, style: { lineWidth: 1.5 }, shape: 'roundedRectangle', cornerRadius: cell * 0.28 }), frame({ width: cell, height: cell })]}
              />
            ) : null}
          </ZStack>
          <Text modifiers={[font({ size: 10, weight: d.isToday ? 'bold' : 'medium' }), foregroundStyle(d.isToday ? props.text : props.muted)]}>
            {d.label}
          </Text>
        </VStack>
      ))}
    </HStack>
  );

  // ---------------- Lock screen families ----------------
  if (family === 'accessoryCircular') {
    return (
      <Gauge
        value={pct}
        min={0}
        max={1}
        modifiers={[gaugeStyle('circularCapacity'), widgetURL(link)]}
        currentValueLabel={<Text modifiers={[font({ size: 13, weight: 'bold', design: 'rounded' })]}>{`${done}/${total}`}</Text>}
      />
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2} modifiers={[widgetURL(link)]}>
        <Text modifiers={[font({ size: 13, weight: 'bold', design: 'rounded' })]}>{`Hablits · ${done}/${total}`}</Text>
        <Text modifiers={[font({ size: 12 }), lineLimit(1)]}>{headline}</Text>
        {props.bestStreak > 0 ? (
          <Text modifiers={[font({ size: 12 }), lineLimit(1)]}>{`${props.bestStreak}-day streak`}</Text>
        ) : null}
      </VStack>
    );
  }

  if (family === 'accessoryInline') {
    return <Text modifiers={[widgetURL(link)]}>{`Hablits ${done}/${total} · ${headline}`}</Text>;
  }

  // ---------------- Home screen: small ----------------
  if (family === 'systemSmall') {
    return (
      <VStack spacing={6} modifiers={[containerBackground(props.bg, 'widget'), widgetURL(link), padding({ all: 4 })]}>
        {hasPet ? (
          <HStack spacing={6}>
            {pet(54)}
            {ring(76, 20)}
          </HStack>
        ) : (
          ring(84, 22)
        )}
        <Text
          modifiers={[font({ size: 14, weight: 'semibold', design: 'rounded' }), foregroundStyle(props.text), lineLimit(1), minimumScaleFactor(0.8)]}
        >
          {headline}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(props.muted), lineLimit(1), minimumScaleFactor(0.8)]}>{sub}</Text>
      </VStack>
    );
  }

  // ---------------- Home screen: medium ----------------
  if (family === 'systemMedium') {
    const list = props.habits.slice(0, 4);
    return (
      <HStack spacing={16} modifiers={[containerBackground(props.bg, 'widget'), widgetURL(link)]}>
        <VStack spacing={6}>
          {hasPet ? (
            <HStack spacing={4}>
              {pet(52)}
              {ring(84, 22)}
            </HStack>
          ) : (
            ring(88, 22)
          )}
          <Text modifiers={[font({ size: 12, weight: 'semibold', design: 'rounded' }), foregroundStyle(props.text), lineLimit(1)]}>
            {headline}
          </Text>
        </VStack>
        <VStack alignment="leading" spacing={7}>
          <HStack>
            <Text modifiers={[font({ size: 12, weight: 'bold', design: 'rounded' }), foregroundStyle(props.muted)]}>TODAY</Text>
            <Spacer />
            {props.bestStreak > 0 ? streakBadge : null}
          </HStack>
          {list.length === 0 ? (
            <Text modifiers={[font({ size: 13 }), foregroundStyle(props.muted)]}>Nothing scheduled</Text>
          ) : (
            list.map(row)
          )}
          {total > list.length ? (
            <Text modifiers={[font({ size: 11 }), foregroundStyle(props.muted)]}>{`+${total - list.length} more`}</Text>
          ) : null}
          <Spacer />
        </VStack>
      </HStack>
    );
  }

  // ---------------- Home screen: large / extra large ----------------
  const list = props.habits.slice(0, 7);
  return (
    <VStack alignment="leading" spacing={10} modifiers={[containerBackground(props.bg, 'widget'), widgetURL(link)]}>
      <HStack spacing={16}>
        {ring(96, 24)}
        <VStack alignment="leading" spacing={4}>
          <Text modifiers={[font({ size: 20, weight: 'bold', design: 'rounded' }), foregroundStyle(props.text), lineLimit(1)]}>
            {headline}
          </Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle(props.muted), lineLimit(2)]}>{sub}</Text>
          {props.bestStreak > 0 ? streakBadge : null}
        </VStack>
        <Spacer />
        {pet(84)}
      </HStack>
      <Divider />
      {week.length === 7 ? (
        <HStack>
          <Spacer />
          {heatmap(30)}
          <Spacer />
        </HStack>
      ) : null}
      <Divider />
      {list.length === 0 ? (
        <Text modifiers={[font({ size: 14 }), foregroundStyle(props.muted)]}>Nothing scheduled today</Text>
      ) : (
        list.map(row)
      )}
      {total > list.length ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(props.muted)]}>{`+${total - list.length} more in the app`}</Text>
      ) : null}
      <Spacer />
    </VStack>
  );
};

const initialProps: TodayWidgetProps = {
  date: '',
  done: 0,
  total: 0,
  bestStreak: 0,
  mood: 'curious',
  stageName: 'Hatchling',
  habits: [],
  week: [],
  petImage: '',
  bg: '#eef2f7',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  accent: '#3ddc97',
  good: '#22c55e',
};

export default createWidget<TodayWidgetProps>(WIDGET_NAME, TodayWidget, initialProps);
