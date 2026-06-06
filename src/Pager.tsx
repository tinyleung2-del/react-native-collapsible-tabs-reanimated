import { Children, ReactNode, memo, useCallback, useMemo, useState } from 'react';

import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { GestureDetector } from 'react-native-gesture-handler';
import PagerView, { PagerViewOnPageScrollEventData, PagerViewOnPageSelectedEvent, PagerViewProps } from 'react-native-pager-view';
import Animated, { useAnimatedStyle, useEvent, useHandler } from 'react-native-reanimated';

import { useCollapsibleTabsContext } from './Context';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type OnPageScrollWorklet = (event: PagerViewOnPageScrollEventData, context: Record<string, unknown>) => void;

type PageScrollHandlers = {
  onPageScroll?: OnPageScrollWorklet;
};

function usePageScrollHandler(handlers: PageScrollHandlers, dependencies?: unknown[]) {
  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies);
  return useEvent<PagerViewOnPageScrollEventData>(
    (event) => {
      'worklet';
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith('onPageScroll')) onPageScroll(event, context);
    },
    ['onPageScroll'],
    doDependenciesDiffer
  );
}

export type PagerProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  height?: number;
} & PagerViewProps;

const Pager = ({ children, style, height, ...pagerProps }: PagerProps) => {
  const { headerOffset, listPanGesture, activeTabIndex, activeListOffset, pageDecimal, pagerRef } = useCollapsibleTabsContext();
  const [pageWidth, setPageWidth] = useState(0);
  const childPages = useMemo(() => Children.toArray(children), [children]);

  const pageScrollHandlers = useMemo<PageScrollHandlers>(
    () => ({
      onPageScroll: (event) => {
        'worklet';
        pageDecimal.value = event.position + event.offset;
      },
    }),
    [pageDecimal]
  );
  const onPageScroll = usePageScrollHandler(pageScrollHandlers);

  const onPageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      activeTabIndex.value = event.nativeEvent.position;
      activeListOffset.value = 0;
    },
    [activeListOffset, activeTabIndex]
  );

  const animatedStyle = useAnimatedStyle(() => ({ ...(height != null ? { height } : null), transform: [{ translateY: headerOffset.value }] }), [height]);
  const staticPagerTranslateStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -pageDecimal.value * pageWidth }] }), [pageWidth]);

  const onStaticPagerLayout = useCallback((event: LayoutChangeEvent) => {
    setPageWidth(event.nativeEvent.layout.width);
  }, []);

  if (pagerProps.scrollEnabled === false) {
    pagerRef.current = null;
    return (
      <GestureDetector gesture={listPanGesture}>
        <Animated.View style={[height == null && styles.flex1, animatedStyle]}>
          <View onLayout={onStaticPagerLayout} style={[styles.flex1, style]}>
            <Animated.View style={[styles.staticPagerRow, staticPagerTranslateStyle, pageWidth > 0 && { width: pageWidth * childPages.length }]}>
              {childPages.map((child, index) => (
                <View key={index} style={[styles.staticPage, pageWidth > 0 && { width: pageWidth }]} collapsable={false}>
                  {child}
                </View>
              ))}
            </Animated.View>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={listPanGesture}>
      <Animated.View style={[height == null && styles.flex1, animatedStyle]}>
        <AnimatedPagerView
          ref={pagerRef}
          orientation="horizontal"
          overScrollMode="never"
          style={[styles.flex1, style]}
          onPageScroll={onPageScroll as unknown as PagerViewProps['onPageScroll']}
          onPageSelected={onPageSelected}
          {...pagerProps}
        >
          {children}
        </AnimatedPagerView>
      </Animated.View>
    </GestureDetector>
  );
};

Pager.displayName = 'CollapsibleTabs.Pager';

const styles = StyleSheet.create({
  flex1: { flexGrow: 1 },
  staticPage: { flexGrow: 1 },
  staticPagerRow: { flexDirection: 'row', flexGrow: 1 },
});

export default memo(Pager);
