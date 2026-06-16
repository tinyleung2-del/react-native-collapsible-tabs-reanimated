import { ReactElement, memo, useCallback, useEffect, useMemo } from "react";

import {
  LayoutChangeEvent,
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
    revealHeaderOnListReachTop,
  } = useCollapsibleTabsContext();
  const { index } = useTabSelfContext();
  const selfOffset = useSharedValue(0);
  const releaseVelocityY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        selfOffset.value = event.contentOffset.y;
        if (activeTabIndex.value === index)
          activeListOffset.value = event.contentOffset.y;
      },
      onEndDrag: (event) => {
        releaseVelocityY.value = event.velocity?.y ?? 0;
        revealHeaderOnListReachTop(
          event.contentOffset.y,
          releaseVelocityY.value,
        );
      },
      onMomentumEnd: (event) => {
        revealHeaderOnListReachTop(
          event.contentOffset.y,
          releaseVelocityY.value,
        );
        releaseVelocityY.value = 0;
      },
    },
    [revealHeaderOnListReachTop],
  );

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

  const stableLayout = useStableCallback(onLayout);
  const stableContentSizeChange = useStableCallback(onContentSizeChange);

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
        <Animated.ScrollView
          ref={scrollRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
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
  view: { position: "relative", flex: 1 },
});

ScrollView.displayName = "CollapsibleTabs.ScrollView";

export default memo(ScrollView) as (props: ScrollViewProps) => ReactElement;
