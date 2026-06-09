import { ComponentProps, ReactNode, useEffect, useRef, useState } from "react";

import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useStableCallback } from "./useStableCallback";

type AnimatedViewProps = ComponentProps<typeof Animated.View>;
type LazyViewProps = Omit<
  AnimatedViewProps,
  "children" | "entering" | "exiting" | "style"
>;

export type LazyPlaceholderInfo = {
  focused: boolean;
  canMount: boolean;
};

export type LazyProps = {
  focused: boolean;
  children?: ReactNode;
  placeholder?: ReactNode;
  renderPlaceholder?: (info: LazyPlaceholderInfo) => ReactNode;
  placeholderStyle?: StyleProp<ViewStyle>;
  placeholderProps?: LazyViewProps & { style?: StyleProp<ViewStyle> };
  style?: StyleProp<ViewStyle>;
  containerProps?: LazyViewProps & { style?: StyleProp<ViewStyle> };
  disableEntering?: boolean;
  disableExiting?: boolean;
  entering?: AnimatedViewProps["entering"] | null;
  exiting?: AnimatedViewProps["exiting"] | null;
  enteringDuration?: number;
  enteringDelay?: number;
  exitingDuration?: number;
  duration?: number;
  delay?: number;
  onMount?: () => void;
};

export function Lazy({
  placeholder,
  renderPlaceholder,
  placeholderStyle,
  placeholderProps,
  containerProps,
  disableEntering = false,
  disableExiting = false,
  entering,
  exiting,
  enteringDuration,
  enteringDelay,
  exitingDuration = 300,
  focused,
  duration = 200,
  delay = 50,
  onMount,
  children,
  style,
}: LazyProps) {
  const [canMount, setCanMount] = useState(false);
  const mountNotifiedRef = useRef(false);
  const stableOnMount = useStableCallback(onMount);

  useEffect(() => {
    if (focused) {
      setCanMount(true);
      if (!mountNotifiedRef.current) {
        mountNotifiedRef.current = true;
        stableOnMount();
      }
    }
  }, [focused, stableOnMount]);

  const placeholderPointerEvents =
    placeholderProps?.pointerEvents ?? "box-none";
  const {
    style: placeholderContainerStyle,
    pointerEvents: _placeholderPointerEvents,
    ...restPlaceholderProps
  } = placeholderProps ?? {};
  const { style: containerStyle, ...restContainerProps } = containerProps ?? {};

  const enteringAnimation =
    disableEntering || entering === null
      ? undefined
      : (entering ??
        FadeIn.duration(enteringDuration ?? duration).delay(
          enteringDelay ?? delay,
        ));
  const exitingAnimation =
    disableExiting || exiting === null
      ? undefined
      : (exiting ?? FadeOut.duration(exitingDuration));

  if (!canMount) {
    return (
      <Animated.View
        {...restPlaceholderProps}
        exiting={exitingAnimation}
        style={[
          styles.placeholder,
          placeholderStyle,
          placeholderContainerStyle,
        ]}
        pointerEvents={placeholderPointerEvents}
      >
        {renderPlaceholder
          ? renderPlaceholder({ focused, canMount })
          : placeholder}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      {...restContainerProps}
      entering={enteringAnimation}
      style={[styles.container, style, containerStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    height: "100%",
  },
  placeholder: {
    paddingVertical: 12,
    width: "100%",
  },
});
