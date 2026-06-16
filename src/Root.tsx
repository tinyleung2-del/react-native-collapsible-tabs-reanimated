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

import { Gesture, GestureType } from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";
import {
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
  ItemLayout,
  ListScroller,
} from "./Context";

export type CollapsibleTabsRootRef = {
  scrollToViewTop: (animated?: boolean) => void;
};

export type RootProps = {
  children?: ReactNode;
  pageLength: number;
  initialStaticHeight?: number;
  initialStickyHeight?: number;
  offsetAdjustment?: number;
};

const DECELERATION = Platform.OS === "android" ? 0.985 : 0.998;
const HEIGHT_EPSILON = 0.5;

type RootInnerProps = Required<
  Pick<
    RootProps,
    "initialStaticHeight" | "initialStickyHeight" | "offsetAdjustment"
  >
> &
  Pick<RootProps, "children" | "pageLength">;

const RootInner = memo(
  forwardRef<CollapsibleTabsRootRef, RootInnerProps>(
    (
      {
        initialStaticHeight,
        initialStickyHeight,
        pageLength,
        offsetAdjustment,
        children,
      },
      ref,
    ) => {
      const headerOffset = useSharedValue(0);
      const staticHeight = useSharedValue(initialStaticHeight);
      const stickyHeight = useSharedValue(initialStickyHeight);
      const offsetAdjustmentShared = useDerivedValue(
        () => offsetAdjustment,
        [offsetAdjustment],
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
            const scroller = listScrollersRef.current.get(activeTabIndex.value);
            scroller?.(animated);
            headerOffset.value = withSpring(0, {
              duration: 250,
              dampingRatio: 1,
              mass: 4,
            });
          },
        }),
        [activeTabIndex, headerOffset],
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
          if (offsetY > 0 || velocityY <= 0) return;
          if (headerOffset.value >= 0) return;

          headerOffset.value = withSpring(0, {
            damping: 100, // High damping prevents bouncing and smooths the stop
            stiffness: Math.min(Math.abs(velocityY), 600), // Low stiffness makes the movement feel heavy and gradual
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

      const listPanGestureRef = useRef<GestureType | undefined>(undefined);

      const minOffset = useDerivedValue(
        () => -(staticHeight.value - offsetAdjustmentShared.value),
        [staticHeight, offsetAdjustmentShared],
      );

      const listGestures = useMemo(
        () =>
          Array.from({ length: pageLength }, () =>
            Gesture.Native().simultaneousWithExternalGesture(listPanGestureRef),
          ),
        [pageLength],
      );

      const listPanGesture = useMemo(() => {
        return Gesture.Pan()
          .withRef(listPanGestureRef)
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
              if (cur !== minOffset.value) headerOffset.value = minOffset.value;
            } else {
              headerOffset.value = next;
            }
          })
          .onEnd((evt) => {
            const toTop = evt.translationY > 0;
            const isPartial = headerOffset.value !== 0;
            const min = minOffset.value;
            const isFast = Math.abs(evt.velocityY) > 800;

            if (isFast) {
              if (toTop && isPartial) {
                headerOffset.value = withSpring(0, {
                  duration: 250,
                  dampingRatio: 1,
                  mass: 4,
                  overshootClamping: false,
                  velocity: evt.velocityY,
                });
              } else if (!toTop && isPartial) {
                headerOffset.value = withSpring(min, {
                  duration: 250,
                  dampingRatio: 1,
                  mass: 4,
                  overshootClamping: false,
                  velocity: evt.velocityY,
                });
              }
            } else {
              headerOffset.value = withDecay({
                velocity: evt.velocityY,
                rubberBandEffect: false,
                clamp: [min, 0],
                deceleration: DECELERATION,
              });
            }
          });
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

      return (
        <CollapsibleTabsContextProvider {...ctxValue}>
          {children}
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
  >
    {props.children}
  </RootInner>
));

Root.displayName = "CollapsibleTabs.Root";

export default memo(Root);
