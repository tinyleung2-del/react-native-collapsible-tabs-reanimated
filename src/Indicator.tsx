import { memo } from "react";

import {
  PixelRatio,
  StyleProp,
  StyleSheet,
  ViewProps,
  ViewStyle,
} from "react-native";

import Animated, {
  AnimatedStyle,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

import { useCollapsibleTabsContext } from "./Context";

type CommonIndicatorProps = {
  style?: AnimatedStyle<StyleProp<ViewStyle>>;
  color?: string;
  borderRadius?: number;
} & ViewProps;

export const MaterialIndicator = memo(
  ({
    style,
    color = "#111827",
    borderRadius = 999,
    ...props
  }: CommonIndicatorProps) => {
    const { itemLayout, pageDecimal } = useCollapsibleTabsContext();

    const data = useDerivedValue(() => {
      if (!itemLayout || itemLayout.length === 0)
        return { input: [], width: [], translateX: [] };
      const input = new Array<number>(itemLayout.length);
      const translateX = new Array<number>(itemLayout.length);
      const width = new Array<number>(itemLayout.length);
      for (let index = 0; index < itemLayout.length; index += 1) {
        const item = itemLayout[index];
        input[index] = index;
        translateX[index] = item.x;
        width[index] = item.width;
      }
      return {
        input,
        translateX,
        width,
      };
    }, [itemLayout]);

    const animatedStyles = useAnimatedStyle(() => {
      if (
        data.value.input.length === 0 ||
        data.value.width.length === 0 ||
        data.value.translateX.length === 0
      )
        return { opacity: 0, width: 0 };
      if (data.value.input.length === 1)
        return {
          opacity: 1,
          width: data.value.width[0],
          transform: [{ translateX: data.value.translateX[0] }],
        };
      return {
        opacity: 1,
        width: interpolate(
          pageDecimal.value,
          data.value.input,
          data.value.width,
          "clamp",
        ),
        transform: [
          {
            translateX: interpolate(
              pageDecimal.value,
              data.value.input,
              data.value.translateX,
              "clamp",
            ),
          },
        ],
      };
    }, []);

    return (
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: color, borderRadius },
          style,
          animatedStyles,
        ]}
        {...props}
      />
    );
  },
);

export const SegmentIndicator = memo(
  ({
    style,
    color = "#ffffff",
    borderRadius = 999,
    ...props
  }: CommonIndicatorProps) => {
    const { itemLayout, pageDecimal } = useCollapsibleTabsContext();

    const data = useDerivedValue(() => {
      if (!itemLayout || itemLayout.length === 0)
        return { input: [], width: [], translateX: [], height: [] };
      const input = new Array<number>(itemLayout.length);
      const translateX = new Array<number>(itemLayout.length);
      const width = new Array<number>(itemLayout.length);
      const height = new Array<number>(itemLayout.length);
      for (let index = 0; index < itemLayout.length; index += 1) {
        const item = itemLayout[index];
        input[index] = index;
        translateX[index] = item.x;
        width[index] = item.width;
        height[index] = item.height;
      }
      return {
        input,
        translateX,
        width,
        height,
      };
    }, [itemLayout]);

    const animatedStyles = useAnimatedStyle(() => {
      const input = data.value.input;
      const width = data.value.width;
      const translateX = data.value.translateX;
      const height = data.value.height;
      if (input.length === 0 || width.length === 0 || translateX.length === 0)
        return { opacity: 0, width: 0 };
      if (input.length === 1)
        return {
          opacity: 1,
          width: width[0],
          transform: [{ translateX: translateX[0] }],
          height: height[0],
        };
      return {
        opacity: 1,
        width: interpolate(pageDecimal.value, input, width, "clamp"),
        transform: [
          {
            translateX: interpolate(
              pageDecimal.value,
              input,
              translateX,
              "clamp",
            ),
          },
        ],
        height: height[0],
      };
    }, []);

    return (
      <Animated.View
        style={[
          styles.segment,
          { backgroundColor: color, borderRadius },
          style,
          animatedStyles,
        ]}
        {...props}
      />
    );
  },
);

MaterialIndicator.displayName = "CollapsibleTabs.MaterialIndicator";
SegmentIndicator.displayName = "CollapsibleTabs.SegmentIndicator";

const styles = StyleSheet.create({
  indicator: {
    height: PixelRatio.roundToNearestPixel(3),
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  segment: {
    position: "absolute",
    left: 0,
    zIndex: 0,
  },
});
