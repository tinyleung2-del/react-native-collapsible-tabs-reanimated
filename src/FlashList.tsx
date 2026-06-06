import { ReactElement, memo, useCallback, useEffect, useMemo } from "react";

import { FlashList as ShopifyFlashList, FlashListProps as ShopifyFlashListProps } from "@shopify/flash-list";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

import { GestureDetector } from "react-native-gesture-handler";
import Animated, { scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useComposedEventHandler, useSharedValue } from "react-native-reanimated";

import { ListScroller, useCollapsibleTabsContext } from "./Context";
import { useTabSelfContext } from "./Tab";
import { useStableCallback } from "./useStableCallback";

const AnimatedFlashList = Animated.createAnimatedComponent(ShopifyFlashList) as unknown as typeof ShopifyFlashList;

export type CollapsibleFlashListProps<T> = ShopifyFlashListProps<T>;

const CollapsibleFlashList = <T,>({ onLayout, onContentSizeChange, ...props }: CollapsibleFlashListProps<T>) => {
  const { listGestures, activeTabIndex, activeListOffset, registerListScroller } = useCollapsibleTabsContext();
  const { index } = useTabSelfContext();
  const selfOffset = useSharedValue(0);
  const listRef = useAnimatedRef<any>();

  const onScroll = useAnimatedScrollHandler((event) => {
    selfOffset.value = event.contentOffset.y;
    if (activeTabIndex.value === index) activeListOffset.value = event.contentOffset.y;
  });

  const composedScrollEvent = useComposedEventHandler(props.onScroll ? [onScroll, props.onScroll] : [onScroll]);

  useAnimatedReaction(
    () => activeTabIndex.value,
    (value) => {
      if (value === index) activeListOffset.value = selfOffset.value;
    },
    [index]
  );

  const scroller = useMemo(
    (): ListScroller =>
      (animated = true) => {
        "worklet";
        scrollTo(listRef, 0, 0, animated);
      },
    [listRef]
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
    [stableLayout]
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      stableContentSizeChange?.(width, height);
    },
    [stableContentSizeChange]
  );

  return (
    <View style={styles.view} collapsable={false}>
      <GestureDetector gesture={listGestures[index]}>
        <AnimatedFlashList<T>
          ref={listRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          scrollToOverflowEnabled={false}
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
  view: { position: "relative", flex: 1 },
});

CollapsibleFlashList.displayName = "CollapsibleTabs.CollapsibleFlashList";

export default memo(CollapsibleFlashList) as <T>(props: CollapsibleFlashListProps<T>) => ReactElement;
