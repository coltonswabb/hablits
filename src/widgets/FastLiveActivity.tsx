// ============================================
// FASTING LIVE ACTIVITY (Lock Screen + Dynamic Island)
// ============================================
// Shows the active fast as a live countdown without the app running. Same
// isolated-runtime rules as the home screen widget: only @expo/ui/swift-ui,
// no hooks, nothing from module scope — everything comes in via props.
// Dates arrive as epoch millis (props must be JSON) and are rebuilt inside.
// ============================================

import { Gauge, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, gaugeStyle, lineLimit, monospacedDigit, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type FastActivityProps = {
  habitName: string;
  startMs: number;
  targetMs: number;
  durationHours: number;
  accent: string;
  text: string;
  muted: string;
};

export const FAST_ACTIVITY_NAME = 'HablitsFast';

const FastLiveActivity = (props: FastActivityProps) => {
  'widget';

  const start = new Date(props.startMs);
  const target = new Date(props.targetMs);
  const range = { lower: start, upper: target };
  const totalMs = Math.max(1, props.targetMs - props.startMs);
  // Gauge can't animate on its own in a Live Activity; it reflects the value
  // at the last update(). The timer text is what moves.
  const now = Date.now();
  const pct = Math.min(1, Math.max(0, (now - props.startMs) / totalMs));
  const title = props.habitName && props.habitName.length > 0 ? props.habitName : 'Fasting';

  const timer = (size: number, color: string) => (
    <Text timerInterval={range} countsDown={true} modifiers={[font({ size, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(color), lineLimit(1)]} />
  );

  return {
    banner: (
      <HStack spacing={14} modifiers={[padding({ all: 14 })]}>
        <Gauge
          value={pct}
          min={0}
          max={1}
          modifiers={[gaugeStyle('circularCapacity'), tint(props.accent), frame({ width: 52, height: 52 })]}
          currentValueLabel={<Image systemName="fork.knife" size={16} color={props.accent} />}
        />
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(props.muted), lineLimit(1)]}>{`${props.durationHours}h fast · ${title}`}</Text>
          {timer(30, props.text)}
          <Text modifiers={[font({ size: 12 }), foregroundStyle(props.muted), lineLimit(1)]}>remaining</Text>
        </VStack>
        <Spacer />
      </HStack>
    ),
    compactLeading: <Image systemName="fork.knife" size={14} color={props.accent} />,
    compactTrailing: (
      <Text timerInterval={range} countsDown={true} modifiers={[font({ size: 14, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(props.text), lineLimit(1), frame({ maxWidth: 64 })]} />
    ),
    minimal: <Image systemName="fork.knife" size={12} color={props.accent} />,
    expandedLeading: (
      <Gauge
        value={pct}
        min={0}
        max={1}
        modifiers={[gaugeStyle('circularCapacity'), tint(props.accent), frame({ width: 44, height: 44 })]}
        currentValueLabel={<Image systemName="fork.knife" size={14} color={props.accent} />}
      />
    ),
    expandedCenter: (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(props.muted), lineLimit(1)]}>{`${props.durationHours}h fast`}</Text>
        {timer(26, props.text)}
      </VStack>
    ),
    expandedTrailing: <Text modifiers={[font({ size: 12 }), foregroundStyle(props.muted)]}>{title}</Text>,
  };
};

export default createLiveActivity<FastActivityProps>(FAST_ACTIVITY_NAME, FastLiveActivity);
