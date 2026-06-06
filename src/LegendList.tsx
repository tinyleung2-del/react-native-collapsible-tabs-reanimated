import { ReactElement, memo, useCallback, useEffect, useMemo } from "react";

import {
  LegendList,
  LegendListProps as LegendListLibProps,
  LegendListRef,
} from "@legendapp/list/react-native";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

import {
  GestureDetector,
  ScrollView as RNGHScrollView,
} from "react-native-gesture-handler";
import Animated, {
  AnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useComposedEventHandler,
  useSharedValue,
} from "react-native-reanimated";

import { ListScroller, useCollapsibleTabsContext } from "./Context";
import { useTabSelfContext } from "./Tab";
import { useStableCallback } from "./useStableCallback";

const AnimatedLegendList = Animated.createAnimatedComponent(LegendList) as <T>(
  props: AnimatedProps<
    LegendListLibProps<T> & {
      ref?: React.Ref<LegendListRef> | undefined;
    }
  >,
) => ReactElement;

export type CollapsibleLegendListProps<T> = LegendListLibProps<T>;

const CollapsibleLegendList = <T,>({
  onLayout,
  onContentSizeChange,
  ...props
}: CollapsibleLegendListProps<T>) => {
  const {
    listGestures,
    activeTabIndex,
    activeListOffset,
    registerListScroller,
  } = useCollapsibleTabsContext();
  const { index } = useTabSelfContext();
  const selfOffset = useSharedValue(0);
  const listRef = useAnimatedRef<any>();

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
        (listRef.current as unknown as LegendListRef)?.scrollToOffset({
          offset: 0,
          animated,
        });
      },
    [listRef],
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
        <AnimatedLegendList<T>
          ref={listRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          {...props}
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

CollapsibleLegendList.displayName = "CollapsibleTabs.CollapsibleLegendList";

export default memo(CollapsibleLegendList) as <T>(
  props: CollapsibleLegendListProps<T>,
) => ReactElement;
