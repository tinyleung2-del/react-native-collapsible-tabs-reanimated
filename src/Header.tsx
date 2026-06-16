import { ReactNode, memo, useMemo } from "react";

import { Platform, StyleSheet, ViewProps } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  clamp,
  useAnimatedStyle,
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

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-5, 5])
        .failOffsetX([-5, 5])
        .maxPointers(1)
        .onChange((evt) => {
          if (evt.changeY > 0 && headerOffset.value >= 0 && canRefresh.value) {
            updateRefreshPull(refreshOffset.value + evt.changeY);
            return;
          }

          if (refreshOffset.value > 0) {
            updateRefreshPull(refreshOffset.value + evt.changeY);
            return;
          }

          const minOffset = -(staticHeight.value - offsetAdjustment.value);
          headerOffset.value = clamp(
            headerOffset.value + evt.changeY,
            minOffset,
            0,
          );
        })
        .onEnd((evt) => {
          if (canRefresh.value && refreshOffset.value > 0) {
            endRefreshPull();
            return;
          }

          const minOffset = -(staticHeight.value - offsetAdjustment.value);
          headerOffset.value = withDecay({
            velocity: evt.velocityY,
            rubberBandEffect: false,
            clamp: [minOffset, 0],
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
        {renderRefreshControl ? (
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
        ) : null}
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
