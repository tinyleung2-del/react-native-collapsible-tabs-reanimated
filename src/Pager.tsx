import { ReactNode, memo, useCallback, useMemo } from "react";

import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { GestureDetector } from "react-native-gesture-handler";
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEvent,
  PagerViewProps,
} from "react-native-pager-view";
import Animated, {
  useAnimatedStyle,
  useEvent,
  useHandler,
} from "react-native-reanimated";

import { useCollapsibleTabsContext } from "./Context";

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type OnPageScrollWorklet = (
  event: PagerViewOnPageScrollEventData,
  context: Record<string, unknown>,
) => void;

type PageScrollHandlers = {
  onPageScroll?: OnPageScrollWorklet;
};

function usePageScrollHandler(
  handlers: PageScrollHandlers,
  dependencies?: unknown[],
) {
  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies);
  return useEvent<PagerViewOnPageScrollEventData>(
    (event) => {
      "worklet";
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith("onPageScroll"))
        onPageScroll(event, context);
    },
    ["onPageScroll"],
    doDependenciesDiffer,
  );
}

export type PagerProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  height?: number;
  getHeight?: (
    staticHeaderHeight: number,
    stickyHeaderHeight: number,
  ) => number;
} & PagerViewProps;

const Pager = ({
  children,
  style,
  height,
  getHeight,
  ...pagerProps
}: PagerProps) => {
  const {
    headerOffset,
    listPanGesture,
    activeTabIndex,
    activeListOffset,
    pageDecimal,
    pagerRef,
    staticHeightValue,
    stickyHeightValue,
  } = useCollapsibleTabsContext();

  const listHeight =
    height ?? getHeight?.(staticHeightValue, stickyHeightValue) ?? null;

  const pageScrollHandlers = useMemo<PageScrollHandlers>(
    () => ({
      onPageScroll: (event) => {
        "worklet";
        pageDecimal.value = event.position + event.offset;
      },
    }),
    [pageDecimal],
  );
  const onPageScroll = usePageScrollHandler(pageScrollHandlers);

  const onPageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      activeTabIndex.value = event.nativeEvent.position;
      activeListOffset.value = 0;
    },
    [activeListOffset, activeTabIndex],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      ...(listHeight != null ? { height: listHeight } : null),
      transform: [{ translateY: headerOffset.value }],
    }),
    [listHeight],
  );

  return (
    <GestureDetector gesture={listPanGesture}>
      <Animated.View
        style={[listHeight == null && styles.flex1, animatedStyle]}
      >
        <AnimatedPagerView
          ref={pagerRef}
          orientation="horizontal"
          overScrollMode="never"
          style={[styles.flex1, style]}
          onPageScroll={
            onPageScroll as unknown as PagerViewProps["onPageScroll"]
          }
          onPageSelected={onPageSelected}
          {...pagerProps}
        >
          {children}
        </AnimatedPagerView>
      </Animated.View>
    </GestureDetector>
  );
};

Pager.displayName = "CollapsibleTabs.Pager";

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});

export default memo(Pager);
