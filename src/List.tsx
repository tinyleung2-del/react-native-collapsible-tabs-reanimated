import { ReactElement, memo, useCallback, useEffect, useMemo } from "react";

import {
  FlatListProps,
  LayoutChangeEvent,
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

export type ListProps<T> = Omit<FlatListProps<T>, "CellRendererComponent">;

const List = <T,>({
  onLayout,
  onContentSizeChange,
  ...props
}: ListProps<T>) => {
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
  const listRef = useAnimatedRef<Animated.FlatList<T>>();

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
        scrollTo(listRef, 0, 0, animated);
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
        <Animated.FlatList
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

List.displayName = "CollapsibleTabs.List";

export default memo(List) as <T>(props: ListProps<T>) => ReactElement;
