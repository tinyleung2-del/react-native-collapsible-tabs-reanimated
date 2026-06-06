import { ReactElement, memo, useCallback, useEffect, useMemo } from "react";

import {
  LayoutChangeEvent,
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  StyleSheet,
  View,
} from "react-native";

import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useComposedEventHandler,
  useSharedValue,
} from "react-native-reanimated";

import { ListScroller, useCollapsibleTabsContext } from "./Context";
import { useTabSelfContext } from "./Tab";
import { useStableCallback } from "./useStableCallback";

const AnimatedScrollView = Animated.createAnimatedComponent(
  RNScrollView,
) as unknown as typeof RNScrollView;

export type ScrollViewProps = RNScrollViewProps;

const ScrollView = ({
  onLayout,
  onContentSizeChange,
  ...props
}: ScrollViewProps) => {
  const {
    listGestures,
    activeTabIndex,
    activeListOffset,
    registerListScroller,
  } = useCollapsibleTabsContext();
  const { index } = useTabSelfContext();
  const selfOffset = useSharedValue(0);
  const scrollRef = useAnimatedRef<any>();

  const onScroll = useAnimatedScrollHandler((event) => {
    selfOffset.value = event.contentOffset.y;
    if (activeTabIndex.value === index)
      activeListOffset.value = event.contentOffset.y;
  });

  const composedScrollEvent = useComposedEventHandler(
    props.onScroll ? [onScroll, props.onScroll] : [onScroll],
  );

  useAnimatedReaction(
    () => activeTabIndex.value,
    (value) => {
      if (value === index) activeListOffset.value = selfOffset.value;
    },
    [index],
  );

  const scroller = useMemo(
    (): ListScroller =>
      (animated = true) => {
        "worklet";
        scrollTo(scrollRef, 0, 0, animated);
      },
    [scrollRef],
  );

  useEffect(() => {
    registerListScroller(index, scroller);
    return () => registerListScroller(index, null);
  }, [index, registerListScroller, scroller]);

  const stableLayout = useStableCallback(
    onLayout as ((event: LayoutChangeEvent) => void) | undefined,
  );
  const stableContentSizeChange = useStableCallback(
    onContentSizeChange as
      | ((width: number, height: number) => void)
      | undefined,
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      stableLayout?.(event);
    },
    [stableLayout],
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      stableContentSizeChange?.(width, height);
    },
    [stableContentSizeChange],
  );

  return (
    <View style={styles.view} collapsable={false}>
      <GestureDetector gesture={listGestures[index]}>
        <AnimatedScrollView
          ref={scrollRef}
          scrollEventThrottle={16}
          bounces={false}
          showsVerticalScrollIndicator
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          {...props}
          // onScroll={onScroll as RNScrollViewProps["onScroll"]}
          onScroll={composedScrollEvent}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
        />
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  view: { position: "relative" },
});

ScrollView.displayName = "CollapsibleTabs.ScrollView";

export default memo(ScrollView) as (props: ScrollViewProps) => ReactElement;
