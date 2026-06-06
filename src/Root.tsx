import { ReactNode, forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { Platform } from 'react-native';

import { Gesture } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import { clamp, useAnimatedReaction, useDerivedValue, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CollapsibleTabsContextProvider, CollapsibleTabsContextValue, ItemLayout, ListScroller } from './Context';

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

const DECELERATION = Platform.OS === 'android' ? 0.985 : 0.998;
const HEIGHT_EPSILON = 0.5;

type RootInnerProps = Required<Pick<RootProps, 'initialStaticHeight' | 'initialStickyHeight' | 'offsetAdjustment'>> & Pick<RootProps, 'children' | 'pageLength'>;

const RootInner = memo(
  forwardRef<CollapsibleTabsRootRef, RootInnerProps>(({ initialStaticHeight, initialStickyHeight, pageLength, offsetAdjustment, children }, ref) => {
    const headerOffset = useSharedValue(0);
    const staticHeight = useSharedValue(initialStaticHeight);
    const stickyHeight = useSharedValue(initialStickyHeight);
    const offsetAdjustmentShared = useDerivedValue(() => offsetAdjustment, [offsetAdjustment]);

    const activeTabIndex = useSharedValue(0);
    const [activeTabIndexValue, setActiveTabIndexValue] = useState(0);
    useAnimatedReaction(
      () => activeTabIndex.value,
      (next, prev) => {
        if (next !== prev) scheduleOnRN(setActiveTabIndexValue, next);
      },
      []
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

    const registerListScroller = useCallback((index: number, scroller: ListScroller | null) => {
      if (scroller) listScrollersRef.current.set(index, scroller);
      else listScrollersRef.current.delete(index);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        scrollToViewTop: (animated = true) => {
          const scroller = listScrollersRef.current.get(activeTabIndex.value);
          scroller?.(animated);
          headerOffset.value = withSpring(0, { duration: 250, dampingRatio: 1, mass: 4 });
        },
      }),
      [activeTabIndex, headerOffset]
    );

    const [staticHeightValue, setStaticHeightValue] = useState(initialStaticHeight);
    const [stickyHeightValue, setStickyHeightValue] = useState(initialStickyHeight);

    const updateStaticHeight = useCallback(
      (height: number) => {
        staticHeight.value = height;
        setStaticHeightValue((prev) => {
          if (Math.abs(prev - height) < HEIGHT_EPSILON) return prev;
          return height;
        });
      },
      [staticHeight]
    );

    const updateStickyHeight = useCallback(
      (height: number) => {
        stickyHeight.value = height;
        setStickyHeightValue((prev) => {
          if (Math.abs(prev - height) < HEIGHT_EPSILON) return prev;
          return height;
        });
      },
      [stickyHeight]
    );

    const touchX = useSharedValue(0);
    const touchY = useSharedValue(0);
    const isVertical = useSharedValue(false);
    const activeListOffset = useSharedValue(0);
    const listGestures = useMemo(() => Array.from({ length: pageLength }, () => Gesture.Native().cancelsTouchesInView(true)), [pageLength]);

    const listPanGesture = useMemo(() => {
      return Gesture.Pan()
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
          const toTop = touch.y > touchY.value;
          const isHorizontal = Math.abs(touch.x - touchX.value) > 5;
          const vertical = Math.abs(touch.y - touchY.value) > 5;

          if (vertical) isVertical.value = true;
          if (isHorizontal && !isVertical.value) return state.fail();
          if (!vertical) return;

          const minOffset = -(staticHeight.value - offsetAdjustmentShared.value);
          if (toTop && activeListOffset.value === 0) state.activate();
          else if (!toTop && headerOffset.value > minOffset) state.activate();
        })
        .onChange((evt) => {
          isVertical.value = true;
          const minOffset = -(staticHeight.value - offsetAdjustmentShared.value);
          headerOffset.value = clamp(headerOffset.value + evt.changeY, minOffset, 0);
        })
        .onEnd((evt) => {
          const toTop = evt.translationY > 0;
          const isHeaderPartialShown = headerOffset.value !== 0;
          const minOffset = -(staticHeight.value - offsetAdjustmentShared.value);
          const isFast = Math.abs(evt.velocityY) > 800;

          if (isFast) {
            if (toTop && isHeaderPartialShown) {
              headerOffset.value = withSpring(0, { duration: 250, dampingRatio: 1, mass: 4, overshootClamping: false, velocity: evt.velocityY });
            } else if (!toTop && isHeaderPartialShown) {
              headerOffset.value = withSpring(minOffset, { duration: 250, dampingRatio: 1, mass: 4, overshootClamping: false, velocity: evt.velocityY });
            }
          } else {
            headerOffset.value = withDecay({ velocity: evt.velocityY, rubberBandEffect: false, clamp: [minOffset, 0], deceleration: DECELERATION });
          }
        })
        .simultaneousWithExternalGesture(...listGestures);
    }, [activeListOffset, headerOffset, isVertical, listGestures, offsetAdjustmentShared, staticHeight, touchX, touchY]);

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
      }),
      [activeListOffset, activeTabIndex, activeTabIndexValue, headerOffset, itemLayout, listGestures, listPanGesture, offsetAdjustmentShared, pageDecimal, registerButton, registerListScroller, staticHeight, staticHeightValue, stickyHeight, stickyHeightValue, updateStaticHeight, updateStickyHeight]
    );

    return <CollapsibleTabsContextProvider {...ctxValue}>{children}</CollapsibleTabsContextProvider>;
  })
);

RootInner.displayName = 'CollapsibleTabs.RootInner';

const Root = forwardRef<CollapsibleTabsRootRef, RootProps>((props, ref) => (
  <RootInner ref={ref} initialStaticHeight={props.initialStaticHeight ?? 0} initialStickyHeight={props.initialStickyHeight ?? 0} pageLength={props.pageLength} offsetAdjustment={props.offsetAdjustment ?? 0}>
    {props.children}
  </RootInner>
));

Root.displayName = 'CollapsibleTabs.Root';

export default memo(Root);
