import { ReactNode, memo, useMemo } from "react";

import { Platform, StyleSheet, ViewProps } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withDecay,
} from "react-native-reanimated";

import {
  useCollapsibleTabsContext,
  useCollapsibleTabsRefreshContext,
} from "./Context";

const DECELERATION = Platform.OS === "android" ? 0.985 : 0.998;

export type HeaderRefreshControlInfo = {
  refreshOffset: SharedValue<number>;
  refreshProgress: SharedValue<number>;
  refreshThreshold: SharedValue<number>;
  refreshHoldDistance: SharedValue<number>;
  maxRefreshPullDistance: SharedValue<number>;
  isRefreshing: SharedValue<boolean>;
};

export type HeaderProps = ViewProps & {
  renderRefreshControl?: (info: HeaderRefreshControlInfo) => ReactNode;
};

const Header = ({
  children,
  style,
  renderRefreshControl,
  ...props
}: HeaderProps) => {
  const { headerOffset, staticHeight, offsetAdjustment } =
    useCollapsibleTabsContext();
  const {
    refreshOffset,
    refreshProgress,
    refreshThreshold,
    refreshHoldDistance,
    maxRefreshPullDistance,
    canRefresh,
    isRefreshing,
    updateRefreshPull,
    endRefreshPull,
  } = useCollapsibleTabsRefreshContext();

  const minOffset = useDerivedValue(
    () => -(staticHeight.value - offsetAdjustment.value),
    [staticHeight, offsetAdjustment],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-5, 5])
        .failOffsetX([-5, 5])
        .maxPointers(1)
        .onBegin(() => {
          cancelAnimation(headerOffset);
          cancelAnimation(refreshOffset);
        })
        .onChange((evt) => {
          if (evt.changeY > 0 && headerOffset.value >= 0 && canRefresh.value) {
            updateRefreshPull(refreshOffset.value + evt.changeY);
            return;
          }

          if (refreshOffset.value > 0) {
            updateRefreshPull(refreshOffset.value + evt.changeY);
            return;
          }

          headerOffset.value = Math.min(
            0,
            Math.max(headerOffset.value + evt.changeY, minOffset.value),
          );
        })
        .onEnd((evt) => {
          if (canRefresh.value && refreshOffset.value > 0) {
            endRefreshPull();
            return;
          }

          headerOffset.value = withDecay({
            velocity: evt.velocityY,
            velocityFactor: 1.8,
            rubberBandEffect: false,
            clamp: [minOffset.value, 0],
            deceleration: DECELERATION,
          });
        }),
    [
      canRefresh,
      endRefreshPull,
      headerOffset,
      offsetAdjustment,
      refreshOffset,
      staticHeight,
      updateRefreshPull,
    ],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ translateY: headerOffset.value }] }),
    [],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        {...props}
        style={[style, animatedStyle]}
        collapsable={false}
      >
        {children}
        {!!renderRefreshControl && (
          <Animated.View pointerEvents="none" style={styles.refreshControl}>
            {renderRefreshControl({
              refreshOffset,
              refreshProgress,
              refreshThreshold,
              refreshHoldDistance,
              maxRefreshPullDistance,
              isRefreshing,
            })}
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

Header.displayName = "CollapsibleTabs.Header";

const styles = StyleSheet.create({
  refreshControl: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
});

export default memo(Header);
