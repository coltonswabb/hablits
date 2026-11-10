// ============================================
// ROUTINE LIVE ACTIVITY (Lock Screen + Dynamic Island)
// ============================================
// The routine runner's current step and timer, visible with the phone
// locked. Same isolated-runtime rules as FastLiveActivity: only
// @expo/ui/swift-ui, no hooks, nothing from module scope, JSON props.
//
// The timer text is system-driven, so it keeps ticking without the app.
// A step with a duration counts down to `endMs`; one without counts up
// from `startMs`. While paused we show the frozen time instead.
// ============================================

import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, lineLimit, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type RoutineActivityProps = {
  routineName: string;
  stepName: string;
  /** 1-based */
  stepNumber: number;
  stepCount: number;
  /** When the step's clock started, shifted forward by any time spent paused */
  startMs: number;
  /** When the step's time is up; 0 for a step without a duration */
  endMs: number;
  paused: boolean;
  /** "04:12" — shown while paused */
  frozen: string;
  accent: string;
  text: string;
  muted: string;
};

export const ROUTINE_ACTIVITY_NAME = 'HablitsRoutine';

const RoutineLiveActivity = (props: RoutineActivityProps) => {
  'widget';

  const countsDown = props.endMs > 0;
  // A count-up timer needs an upper bound; a day is plenty for one step
  const range = { lower: new Date(props.startMs), upper: new Date(countsDown ? props.endMs : props.startMs + 24 * 60 * 60 * 1000) };
  const stepLabel = `Step ${props.stepNumber} of ${props.stepCount}`;

  const clock = (size: number, maxWidth?: number) =>
    props.paused ? (
      <Text modifiers={[font({ size, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(props.muted), lineLimit(1)]}>
        {props.frozen}
      </Text>
    ) : (
      <Text
        timerInterval={range}
        countsDown={countsDown}
        modifiers={[
          font({ size, weight: 'bold', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle(props.text),
          lineLimit(1),
          ...(maxWidth ? [frame({ maxWidth })] : []),
        ]}
      />
    );

  return {
    banner: (
      <HStack spacing={14} modifiers={[padding({ all: 14 })]}>
        <Image systemName={props.paused ? 'pause.circle.fill' : 'figure.walk.circle.fill'} size={40} color={props.accent} />
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.muted), lineLimit(1)]}>
            {`${props.routineName} · ${stepLabel}`}
          </Text>
          <Text modifiers={[font({ size: 17, weight: 'semibold' }), foregroundStyle(props.text), lineLimit(1)]}>{props.stepName}</Text>
        </VStack>
        <Spacer />
        {clock(28)}
      </HStack>
    ),
    compactLeading: <Image systemName="checklist" size={14} color={props.accent} />,
    compactTrailing: clock(14, 56),
    minimal: <Image systemName="checklist" size={12} color={props.accent} />,
    expandedLeading: <Image systemName={props.paused ? 'pause.circle.fill' : 'checklist'} size={28} color={props.accent} />,
    expandedCenter: (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.muted), lineLimit(1)]}>{stepLabel}</Text>
        <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(props.text), lineLimit(1)]}>{props.stepName}</Text>
      </VStack>
    ),
    expandedTrailing: clock(22, 80),
  };
};

export default createLiveActivity<RoutineActivityProps>(ROUTINE_ACTIVITY_NAME, RoutineLiveActivity);
