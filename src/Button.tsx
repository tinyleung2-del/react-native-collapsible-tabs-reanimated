import { ReactNode, memo, useCallback, useMemo, useRef } from "react";

import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { Pressable, PressableProps } from "react-native-gesture-handler";
import Animated, {
  AnimatedStyle,
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { useCollapsibleTabsContext } from "./Context";

type PressableEvent = Parameters<NonNullable<PressableProps["onPress"]>>[0];

export type RenderTabLabelProps = {
  index: number;
  name: string;
  isActive: boolean;
  style: StyleProp<TextStyle>;
  animatedStyle: AnimatedStyle<StyleProp<TextStyle>>;
  pageDecimal: SharedValue<number>;
};

export type ButtonProps = {
  index: number;
  name: string;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  activeStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeLabelStyle?: StyleProp<TextStyle>;
  labelProps?: Omit<TextProps, "style">;
  contentWrapperStyle?: StyleProp<ViewStyle>;
  activeLabelColor?: string;
  inactiveLabelColor?: string;
  children?: string | ((props: RenderTabLabelProps) => ReactNode);
} & Omit<PressableProps, "style" | "children">;

const Button = ({
  index,
  name,
  onPress,
  style,
  fullWidth,
  labelStyle,
  labelProps,
  activeLabelStyle,
  activeStyle,
  children,
  contentWrapperStyle,
  activeLabelColor = "#111827",
  inactiveLabelColor = "#9ca3af",
  ...props
}: ButtonProps) => {
  const {
    activeTabIndex,
    activeTabIndexValue,
    pageDecimal,
    pagerRef,
    registerButton,
    itemLayout,
  } = useCollapsibleTabsContext();
  const isActive = activeTabIndexValue === index;

  const combinedStaticLabelStyle = useMemo(
    (): StyleProp<TextStyle> => [
      styles.label,
      labelStyle,
      activeLabelStyle && isActive && activeLabelStyle,
    ],
    [activeLabelStyle, isActive, labelStyle],
  );

  const animatedLabelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      pageDecimal.value,
      [index - 1, index, index + 1],
      [inactiveLabelColor, activeLabelColor, inactiveLabelColor],
    );
    return { color };
  }, [activeLabelColor, inactiveLabelColor, index, pageDecimal]);

  const handleOnPress = useCallback(
    (event: PressableEvent) => {
      onPress?.(event);
      if (pagerRef.current) {
        pagerRef.current.setPage(index);
        return;
      }
      activeTabIndex.value = index;
      pageDecimal.value = withTiming(index);
    },
    [activeTabIndex, index, onPress, pageDecimal, pagerRef],
  );

  const pressableLayoutRef = useRef<{ x: number; y: number } | null>(null);
  const contentLayoutRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const commitLayout = useCallback(() => {
    const pressable = pressableLayoutRef.current;
    const content = contentLayoutRef.current;
    if (!pressable || !content) return;
    registerButton({
      width: content.width,
      height: content.height,
      x: pressable.x + content.x,
      y: pressable.y + content.y,
      name,
      index,
    });
  }, [index, name, registerButton]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      props.onLayout?.(event);
      const { x, y } = event.nativeEvent.layout;
      pressableLayoutRef.current = { x, y };
      commitLayout();
    },
    [commitLayout, props],
  );

  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      contentLayoutRef.current = { x, y, width, height };
      commitLayout();
    },
    [commitLayout],
  );

  const isLast = itemLayout.length - 1 === index;
  const isFirst = index === 0;
  const mergedStyle = useMemo(
    (): StyleProp<ViewStyle> => [
      styles.pressable,
      isFirst && { paddingLeft: 0 },
      isLast && { paddingRight: 0 },
      fullWidth && styles.fullWidth,
      style,
      isActive && activeStyle,
    ],
    [activeStyle, fullWidth, isActive, isFirst, isLast, style],
  );

  return (
    <Pressable
      onPress={handleOnPress}
      {...props}
      onLayout={onLayout}
      style={mergedStyle}
    >
      <View
        onLayout={onContentLayout}
        style={[styles.contentWrapper, contentWrapperStyle]}
      >
        {typeof children === "function" ? (
          children({
            isActive,
            index,
            name,
            style: combinedStaticLabelStyle,
            animatedStyle: animatedLabelStyle,
            pageDecimal,
          })
        ) : (
          <Animated.Text
            style={[combinedStaticLabelStyle, animatedLabelStyle]}
            numberOfLines={1}
            {...labelProps}
          >
            {children}
          </Animated.Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  fullWidth: {
    flex: 1,
  },
  contentWrapper: {
    position: "relative",
    alignSelf: "center",
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
});

Button.displayName = "CollapsibleTabs.Button";

export default memo(Button);
