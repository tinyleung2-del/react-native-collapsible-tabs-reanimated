import { memo, useMemo } from 'react';

import { Platform, ViewProps } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, withDecay } from 'react-native-reanimated';

import { useCollapsibleTabsContext } from './Context';

const DECELERATION = Platform.OS === 'android' ? 0.985 : 0.998;

const Header = ({ children, style, ...props }: ViewProps) => {
  const { headerOffset, staticHeight, offsetAdjustment } = useCollapsibleTabsContext();

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-5, 5])
        .failOffsetX([-5, 5])
        .maxPointers(1)
        .onChange((evt) => {
          const minOffset = -(staticHeight.value - offsetAdjustment.value);
          headerOffset.value = clamp(headerOffset.value + evt.changeY, minOffset, 0);
        })
        .onEnd((evt) => {
          const minOffset = -(staticHeight.value - offsetAdjustment.value);
          headerOffset.value = withDecay({ velocity: evt.velocityY, rubberBandEffect: false, clamp: [minOffset, 0], deceleration: DECELERATION });
        }),
    [headerOffset, offsetAdjustment, staticHeight]
  );

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: headerOffset.value }] }), []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View {...props} style={[style, animatedStyle]} collapsable={false}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

Header.displayName = 'CollapsibleTabs.Header';

export default memo(Header);
