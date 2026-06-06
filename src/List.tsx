import { ReactElement, memo, useCallback, useEffect, useMemo } from 'react';

import { FlatList, FlatListProps, LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { ListScroller, useCollapsibleTabsContext } from './Context';
import { useTabSelfContext } from './Tab';
import { useStableCallback } from './useStableCallback';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

export type ListProps<T> = FlatListProps<T>;

const List = <T,>({ onLayout, onContentSizeChange, ...props }: ListProps<T>) => {
  const { listGestures, activeTabIndex, activeListOffset, registerListScroller } = useCollapsibleTabsContext();
  const { index } = useTabSelfContext();
  const selfOffset = useSharedValue(0);
  const listRef = useAnimatedRef<any>();

  const onScroll = useAnimatedScrollHandler((event) => {
    selfOffset.value = event.contentOffset.y;
    if (activeTabIndex.value === index) activeListOffset.value = event.contentOffset.y;
  });

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
        'worklet';
        scrollTo(listRef, 0, 0, animated);
      },
    [listRef]
  );

  useEffect(() => {
    registerListScroller(index, scroller);
    return () => registerListScroller(index, null);
  }, [index, registerListScroller, scroller]);

  const stableLayout = useStableCallback(onLayout as ((event: LayoutChangeEvent) => void) | undefined);
  const stableContentSizeChange = useStableCallback(onContentSizeChange as ((width: number, height: number) => void) | undefined);

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
        <AnimatedFlatList<T>
          ref={listRef}
          scrollEventThrottle={16}
          bounces={false}
          showsVerticalScrollIndicator
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          {...props}
          onScroll={onScroll as FlatListProps<T>['onScroll']}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
        />
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  view: { position: 'relative' },
});

List.displayName = 'CollapsibleTabs.List';

export default memo(List) as <T>(props: ListProps<T>) => ReactElement;
