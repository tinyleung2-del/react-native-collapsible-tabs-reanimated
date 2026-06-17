import {
  ReactNode,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Platform } from "react-native";

import { Gesture } from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";
import {
  cancelAnimation,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  CollapsibleTabsContextProvider,
  CollapsibleTabsContextValue,
  CollapsibleTabsRefreshContextProvider,
  CollapsibleTabsRefreshContextValue,
  ItemLayout,
  ListScroller,
} from "./Context";
import { useStableCallback } from "./useStableCallback";

export type CollapsibleTabsRootRef = {
  scrollToViewTop: (animated?: boolean) => void;
  setPage: (page: number, animated?: boolean) => void;
};

export type RootProps = {
  children?: ReactNode;
  pageLength: number;
  initialStaticHeight?: number;
  initialStickyHeight?: number;
  offsetAdjustment?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshTriggerDistance?: number;
  refreshHoldDistance?: number;
  maxRefreshPullDistance?: number;
};

const DECELERATION = Platform.OS === "android" ? 0.985 : 0.998;
const HEIGHT_EPSILON = 0.5;

type RootInnerProps = Required<
  Pick<
    RootProps,
    "initialStaticHeight" | "initialStickyHeight" | "offsetAdjustment"
  >
> &
  Pick<RootProps, "children" | "pageLength" | "onRefresh"> & {
    refreshing: boolean;
    refreshTriggerDistance: number;
    refreshHoldDistance: number;
    maxRefreshPullDistance: number;
  };

const RootInner = memo(
  forwardRef<CollapsibleTabsRootRef, RootInnerProps>(
    (
      {
        initialStaticHeight,
        initialStickyHeight,
        pageLength,
        offsetAdjustment,
        refreshing,
        onRefresh,
        refreshTriggerDistance,
        refreshHoldDistance,
        maxRefreshPullDistance,
        children,
      },
      ref,
    ) => {
      const headerOffset = useSharedValue(0);
      const refreshOffset = useSharedValue(0);
      const staticHeight = useSharedValue(initialStaticHeight);
      const stickyHeight = useSharedValue(initialStickyHeight);
      const offsetAdjustmentShared = useDerivedValue(
        () => offsetAdjustment,
        [offsetAdjustment],
      );
      const canRefresh = useDerivedValue(() => !!onRefresh, [onRefresh]);
      const isRefreshing = useDerivedValue(() => refreshing, [refreshing]);
      const refreshThreshold = useDerivedValue(
        () => refreshTriggerDistance,
        [refreshTriggerDistance],
      );
      const refreshHoldDistanceShared = useDerivedValue(
        () => refreshHoldDistance,
        [refreshHoldDistance],
      );
      const maxRefreshPullDistanceShared = useDerivedValue(
        () => maxRefreshPullDistance,
        [maxRefreshPullDistance],
      );
      const refreshProgress = useDerivedValue(
        () => Math.min(refreshOffset.value / refreshThreshold.value, 1),
        [refreshOffset, refreshThreshold],
      );
      const stableOnRefresh = useStableCallback(onRefresh);

      const requestRefresh = useCallback(() => {
        stableOnRefresh?.();
      }, [stableOnRefresh]);

      const updateRefreshPull = useCallback(
        (pullDistance: number) => {
          "worklet";
          if (!canRefresh.value) return;
          refreshOffset.value = Math.max(
            0,
            Math.min(pullDistance, maxRefreshPullDistanceShared.value),
          );
        },
        [canRefresh, maxRefreshPullDistanceShared, refreshOffset],
      );

      const endRefreshPull = useCallback(() => {
        "worklet";
        if (!canRefresh.value || refreshOffset.value <= 0) return;

        const shouldRefresh =
          !isRefreshing.value && refreshOffset.value >= refreshThreshold.value;

        if (shouldRefresh) {
          refreshOffset.value = withSpring(refreshHoldDistanceShared.value, {
            dampingRatio: 1,
            mass: 4,
          });
          scheduleOnRN(requestRefresh);
        } else if (isRefreshing.value) {
          refreshOffset.value = withSpring(refreshHoldDistanceShared.value, {
            dampingRatio: 1,
            mass: 4,
          });
        } else {
          refreshOffset.value = withSpring(0, {
            dampingRatio: 1,
            mass: 4,
          });
        }
      }, [
        canRefresh,
        isRefreshing,
        refreshHoldDistanceShared,
        refreshOffset,
        refreshThreshold,
        requestRefresh,
      ]);

      useAnimatedReaction(
        () => isRefreshing.value,
        (value, prev) => {
          if (value === prev) return;
          refreshOffset.value = withSpring(
            value ? refreshHoldDistanceShared.value : 0,
            { dampingRatio: 1, mass: 4 },
          );
        },
        [isRefreshing, refreshHoldDistanceShared],
      );

      const activeTabIndex = useSharedValue(0);
      const [activeTabIndexValue, setActiveTabIndexValue] = useState(0);
      useAnimatedReaction(
        () => activeTabIndex.value,
        (next, prev) => {
          if (next !== prev) scheduleOnRN(setActiveTabIndexValue, next);
        },
        [],
      );

      const pageDecimal = useSharedValue(0);
      const pagerRef = useRef<PagerView | null>(null);
      const [itemLayout, setItemLayout] = useState<ItemLayout[]>([]);
      const listScrollersRef = useRef<Map<number, ListScroller>>(new Map());

      const registerButton = useCallback((config: ItemLayout) => {
        setItemLayout((prev) => {
          const next = prev.slice();
          next[config.index] = config;
          return next;
        });
      }, []);

      const registerListScroller = useCallback(
        (index: number, scroller: ListScroller | null) => {
          if (scroller) listScrollersRef.current.set(index, scroller);
          else listScrollersRef.current.delete(index);
        },
        [],
      );

      useImperativeHandle(
        ref,
        () => ({
          scrollToViewTop: (animated = true) => {
            const scroller = listScrollersRef.current.get(activeTabIndexValue);
            scroller?.(animated);

            headerOffset.value = withSpring(0, {
              duration: 300,
              dampingRatio: 1,
              mass: 4,
            });
          },
          setPage: (page, animated = true) => {
            if (animated) pagerRef.current?.setPage(page);
            else pagerRef.current?.setPageWithoutAnimation(page);
          },
        }),
        [activeTabIndexValue, headerOffset],
      );

      const [staticHeightValue, setStaticHeightValue] =
        useState(initialStaticHeight);
      const [stickyHeightValue, setStickyHeightValue] =
        useState(initialStickyHeight);

      const updateStaticHeight = useCallback(
        (height: number) => {
          staticHeight.value = height;
          setStaticHeightValue((prev) => {
            if (Math.abs(prev - height) < HEIGHT_EPSILON) return prev;
            return height;
          });
        },
        [staticHeight],
      );

      const updateStickyHeight = useCallback(
        (height: number) => {
          stickyHeight.value = height;
          setStickyHeightValue((prev) => {
            if (Math.abs(prev - height) < HEIGHT_EPSILON) return prev;
            return height;
          });
        },
        [stickyHeight],
      );

      const revealHeaderOnListReachTop = useCallback(
        (offsetY: number, velocityY: number) => {
          "worklet";
          velocityY = velocityY * 1000;
          // if (offsetY > 0 || velocityY <= 0) return;
          if (velocityY <= 3000) return;
          // if (headerOffset.value >= 0) return;

          headerOffset.value = withSpring(0, {
            damping: 100, // High damping prevents bouncing and smooths the stop
            stiffness: Math.min(velocityY / 10, 600), // Low stiffness makes the movement feel heavy and gradual
            mass: 2, // Slightly higher mass gives it that "heavy content" inertia
            overshootClamping: true, // CRITICAL: Stops the spring the millisecond it reaches the target
          });
        },
        [headerOffset],
      );

      const touchX = useSharedValue(0);
      const touchY = useSharedValue(0);
      const isVertical = useSharedValue(false);
      const activeListOffset = useSharedValue(0);

      const listPanGestureRef = useRef<any>(undefined);

      const minOffset = useDerivedValue(
        () => -(staticHeight.value - offsetAdjustmentShared.value),
        [staticHeight, offsetAdjustmentShared],
      );

      const listGestures = useMemo(
        () =>
          Array.from({ length: pageLength }, () =>
            Gesture.Native()
              .onBegin(() => {
                cancelAnimation(headerOffset);
                cancelAnimation(refreshOffset);
              })
              .shouldCancelWhenOutside(false)
              .disallowInterruption(true)
              .simultaneousWithExternalGesture(listPanGestureRef),
          ),
        [pageLength],
      );

      const listPanGesture = useMemo(() => {
        return (
          Gesture.Pan()
            .withRef(listPanGestureRef)
            .shouldCancelWhenOutside(false)
            // .simultaneousWithExternalGesture(...listGestures)
            .manualActivation(true)
            .maxPointers(1)
            .minPointers(1)
            .onTouchesDown((evt) => {
              const touch = evt.allTouches[0];
              touchX.value = touch.x;
              touchY.value = touch.y;
              isVertical.value = false;
            })
            .onTouchesMove((evt, state) => {
              const touch = evt.allTouches[0];
              const dx = touch.x - touchX.value;
              const dy = touch.y - touchY.value;

              if (Math.abs(dy) > 5) isVertical.value = true;
              if (Math.abs(dx) > 5 && !isVertical.value) return state.fail();
              if (Math.abs(dy) <= 5) return;

              if (dy > 0 && activeListOffset.value <= 0) state.activate();
              else if (dy < 0 && headerOffset.value > minOffset.value)
                state.activate();
            })
            .onChange((evt) => {
              isVertical.value = true;
              const cur = headerOffset.value;
              const next = cur + evt.changeY;
              if (next > 0) {
                if (cur !== 0) headerOffset.value = 0;
              } else if (next < minOffset.value) {
                if (cur !== minOffset.value)
                  headerOffset.value = minOffset.value;
              } else {
                headerOffset.value = next;
              }
            })
            .onEnd((evt) => {
              const toTop = evt.translationY > 0;
              const min = minOffset.value;
              const isPartial = headerOffset.value !== 0;

              if (isPartial) {
                if (toTop) {
                  headerOffset.value = withSpring(0, {
                    mass: 8,
                    damping: 1000,
                    stiffness: 2000,
                    overshootClamping: false,
                    velocity: evt.velocityY,
                  });
                  return;
                } else {
                  headerOffset.value = withSpring(min, {
                    mass: 8,
                    damping: 1000,
                    stiffness: 2000,
                    overshootClamping: false,
                    velocity: evt.velocityY,
                  });
                  return;
                }
              }

              headerOffset.value = withDecay({
                velocity: evt.velocityY,
                velocityFactor: 10,
                rubberBandEffect: false,
                clamp: [min, 0],
                deceleration: DECELERATION,
              });
            })
        );
        // NOTE: do NOT add .simultaneousWithExternalGesture(...listGestures) here.
        // Bidirectional simultaneous recognition on iOS causes the native scroll
        // and the pan gesture to fight over the same touch events, producing jitter.
      }, [
        activeListOffset,
        headerOffset,
        isVertical,
        minOffset,
        touchX,
        touchY,
      ]);

      const ctxValue = useMemo(
        (): CollapsibleTabsContextValue => ({
          headerOffset,
          staticHeight,
          stickyHeight,
          offsetAdjustment: offsetAdjustmentShared,
          activeTabIndex,
          activeTabIndexValue,
          pageDecimal,
          listPanGesture,
          listGestures,
          pagerRef,
          itemLayout,
          registerButton,
          registerListScroller,
          staticHeightValue,
          stickyHeightValue,
          activeListOffset,
          updateStaticHeight,
          updateStickyHeight,
          revealHeaderOnListReachTop,
        }),
        [
          activeListOffset,
          activeTabIndex,
          activeTabIndexValue,
          headerOffset,
          itemLayout,
          listGestures,
          listPanGesture,
          offsetAdjustmentShared,
          pageDecimal,
          registerButton,
          registerListScroller,
          staticHeight,
          staticHeightValue,
          stickyHeight,
          stickyHeightValue,
          updateStaticHeight,
          updateStickyHeight,
          revealHeaderOnListReachTop,
        ],
      );

      const refreshCtxValue = useMemo(
        (): CollapsibleTabsRefreshContextValue => ({
          refreshOffset,
          refreshProgress,
          refreshThreshold,
          refreshHoldDistance: refreshHoldDistanceShared,
          maxRefreshPullDistance: maxRefreshPullDistanceShared,
          canRefresh,
          isRefreshing,
          updateRefreshPull,
          endRefreshPull,
          requestRefresh,
        }),
        [
          canRefresh,
          endRefreshPull,
          isRefreshing,
          maxRefreshPullDistanceShared,
          refreshHoldDistanceShared,
          refreshOffset,
          refreshProgress,
          refreshThreshold,
          requestRefresh,
          updateRefreshPull,
        ],
      );

      return (
        <CollapsibleTabsContextProvider {...ctxValue}>
          <CollapsibleTabsRefreshContextProvider {...refreshCtxValue}>
            {children}
          </CollapsibleTabsRefreshContextProvider>
        </CollapsibleTabsContextProvider>
      );
    },
  ),
);

RootInner.displayName = "CollapsibleTabs.RootInner";

const Root = forwardRef<CollapsibleTabsRootRef, RootProps>((props, ref) => (
  <RootInner
    ref={ref}
    initialStaticHeight={props.initialStaticHeight ?? 0}
    initialStickyHeight={props.initialStickyHeight ?? 0}
    pageLength={props.pageLength}
    offsetAdjustment={props.offsetAdjustment ?? 0}
    refreshing={props.refreshing ?? false}
    onRefresh={props.onRefresh}
    refreshTriggerDistance={props.refreshTriggerDistance ?? 72}
    refreshHoldDistance={props.refreshHoldDistance ?? 56}
    maxRefreshPullDistance={props.maxRefreshPullDistance ?? 140}
  >
    {props.children}
  </RootInner>
));

Root.displayName = "CollapsibleTabs.Root";

export default memo(Root);
