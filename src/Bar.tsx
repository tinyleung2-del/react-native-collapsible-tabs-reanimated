import { ReactNode, memo, useCallback, useMemo, useState } from 'react';

import { LayoutChangeEvent, ScrollViewProps, StyleSheet, Text, View, ViewProps, ViewStyle } from 'react-native';

import { RectButton, ScrollView } from 'react-native-gesture-handler';
import Animated, { SharedValue, interpolate, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { useCollapsibleTabsContext } from './Context';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export type BarProps = Omit<ScrollViewProps, 'contentContainerStyle' | 'style'> & {
  fullWidth?: boolean;
  scrollButtons?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  scrollContainerStyle?: ScrollViewProps['style'];
  tabButtonsGap?: number;
  children?: ReactNode;
  containerProps?: ViewProps;
  backgroundColor?: string;
  scrollButtonBackgroundColor?: string;
  scrollButtonIconColor?: string;
  renderScrollButtonIcon?: (dir: 'left' | 'right') => ReactNode;
};

const Bar = ({
  scrollEnabled = true,
  fullWidth,
  scrollButtons = true,
  left,
  right,
  containerProps,
  children,
  scrollContainerStyle,
  tabButtonsGap = 0,
  backgroundColor = '#ffffff',
  scrollButtonBackgroundColor = 'rgba(255, 255, 255, 0.95)',
  scrollButtonIconColor = 'rgba(48, 48, 48, 0.7)',
  renderScrollButtonIcon,
  ...props
}: BarProps) => {
  const { pageDecimal, itemLayout } = useCollapsibleTabsContext();
  const [barSize, setBarSize] = useState({ width: 0, height: 0, measured: false });

  const contentWidth = useSharedValue(0);
  const layoutWidth = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const leftButtonOpacity = useSharedValue(0);
  const rightButtonOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => {
      if (!scrollButtons || layoutWidth.value === 0 || contentWidth.value === 0) return { showLeft: false, showRight: false };
      const maxScroll = contentWidth.value - layoutWidth.value;
      const isScrollable = maxScroll > 1;
      return { showLeft: isScrollable && scrollX.value > 10, showRight: isScrollable && scrollX.value < maxScroll - 10 };
    },
    (curr, prev) => {
      if (curr.showLeft !== prev?.showLeft) leftButtonOpacity.value = withTiming(curr.showLeft ? 1 : 0);
      if (curr.showRight !== prev?.showRight) rightButtonOpacity.value = withTiming(curr.showRight ? 1 : 0);
    },
    [scrollButtons]
  );

  const onScroll = useAnimatedScrollHandler((evt) => {
    scrollX.value = evt.contentOffset.x;
  });

  const handlePress = useCallback(
    (dir: 'left' | 'right') => {
      'worklet';
      const step = layoutWidth.value / 2;
      const current = scrollX.value;
      const target = dir === 'left' ? current - step : current + step;
      const maxScroll = contentWidth.value - layoutWidth.value;
      scrollTo(scrollRef, Math.max(0, Math.min(target, maxScroll > 0 ? maxScroll : 0)), 0, true);
    },
    [contentWidth, layoutWidth, scrollRef, scrollX]
  );

  const interpolationTable = useDerivedValue(() => {
    if (itemLayout.length <= 1) return null;
    const inputRange = new Array<number>(itemLayout.length);
    const outputRange = new Array<number>(itemLayout.length);
    const halfBar = barSize.width / 2;
    for (let index = 0; index < itemLayout.length; index += 1) {
      inputRange[index] = index;
      const item = itemLayout[index];
      outputRange[index] = +(item.x + item.width / 2 - halfBar).toFixed(2);
    }
    return { inputRange, outputRange };
  }, [barSize.width, itemLayout]);

  const centerOffset = useDerivedValue(() => {
    if (!interpolationTable.value) return 0;
    return interpolate(+pageDecimal.value.toFixed(3), interpolationTable.value.inputRange, interpolationTable.value.outputRange, 'identity');
  }, [interpolationTable]);

  useAnimatedReaction(
    () => Math.round(centerOffset.value),
    (value, prev) => {
      if (value !== prev) scrollTo(scrollRef, value, 0, true);
    }
  );

  const contentContainerStyle = useMemo((): ViewStyle => ({ flex: fullWidth ? 1 : 0, gap: tabButtonsGap }), [fullWidth, tabButtonsGap]);

  const onContentSizeChange = useCallback(
    (width: number) => {
      contentWidth.value = width;
    },
    [contentWidth]
  );

  const onLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      layoutWidth.value = evt.nativeEvent.layout.width;
    },
    [layoutWidth]
  );

  const containerOnLayout = containerProps?.onLayout;
  const onContainerLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      const { width, height } = evt.nativeEvent.layout;
      setBarSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height, measured: true }));
      containerOnLayout?.(evt);
    },
    [containerOnLayout]
  );

  return (
    <View {...containerProps} style={[styles.containerRow, { backgroundColor }, containerProps?.style]} onLayout={onContainerLayout} collapsable={false}>
      {left}
      <View style={[styles.scrollContainer, scrollContainerStyle]}>
        {!!scrollButtons && <ScrollButton dir="left" buttonProgress={leftButtonOpacity} handlePress={handlePress} backgroundColor={scrollButtonBackgroundColor} iconColor={scrollButtonIconColor} renderIcon={renderScrollButtonIcon} />}
        <AnimatedScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          contentContainerStyle={contentContainerStyle}
          directionalLockEnabled
          onContentSizeChange={onContentSizeChange}
          onLayout={onLayout}
          onScroll={onScroll}
          bounces={false}
          collapsable={false}
          {...props}
        >
          {children}
        </AnimatedScrollView>
        {!!scrollButtons && <ScrollButton dir="right" buttonProgress={rightButtonOpacity} handlePress={handlePress} backgroundColor={scrollButtonBackgroundColor} iconColor={scrollButtonIconColor} renderIcon={renderScrollButtonIcon} />}
      </View>
      {right}
    </View>
  );
};

type ScrollButtonProps = {
  dir: 'left' | 'right';
  buttonProgress: SharedValue<number>;
  handlePress: (dir: 'left' | 'right') => void;
  backgroundColor: string;
  iconColor: string;
  renderIcon?: (dir: 'left' | 'right') => ReactNode;
};

const ScrollButton = memo(({ dir, buttonProgress, handlePress, backgroundColor, iconColor, renderIcon }: ScrollButtonProps) => {
  const isLeft = dir === 'left';
  const width = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = buttonProgress.value;
    return { opacity, transform: [{ translateX: interpolate(opacity, [0, 1], [isLeft ? -width.value : width.value, 0]) }], pointerEvents: opacity === 0 ? 'none' : 'auto' };
  }, [isLeft]);

  const onLayoutButton = useCallback(
    (evt: LayoutChangeEvent) => {
      width.value = evt.nativeEvent.layout.width;
    },
    [width]
  );

  const onPress = useCallback(() => handlePress(dir), [dir, handlePress]);

  return (
    <Animated.View style={[isLeft ? scrollButtonStyles.containerLeft : scrollButtonStyles.containerRight, { backgroundColor }, animatedStyle]} onLayout={onLayoutButton}>
      <RectButton style={scrollButtonStyles.button} touchSoundDisabled onPress={onPress}>
        {renderIcon ? renderIcon(dir) : <Text style={[scrollButtonStyles.icon, { color: iconColor }]}>{isLeft ? '<' : '>'}</Text>}
      </RectButton>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  containerRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 20,
  },
});

const scrollButtonStyles = StyleSheet.create({
  containerLeft: {
    position: 'absolute',
    left: 0,
    zIndex: 2,
    height: '100%',
  },
  containerRight: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
    height: '100%',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: '100%',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
});

Bar.displayName = 'CollapsibleTabs.Bar';

export default memo(Bar);
