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
      const d = data.value;
      if (
        d.input.length === 0 ||
        d.width.length === 0 ||
        d.translateX.length === 0
      )
        return { opacity: 0, width: 0 };
      if (d.input.length === 1)
        return {
          opacity: 1,
          width: d.width[0],
          transform: [{ translateX: d.translateX[0] }],
        };
      return {
        opacity: 1,
        width: interpolate(pageDecimal.value, d.input, d.width, "clamp"),
        transform: [
          {
            translateX: interpolate(
              pageDecimal.value,
              d.input,
              d.translateX,
              "clamp",
            ),
          },
        ],
      };
    }, []);

    return (
      <Animated.View
        pointerEvents="none"
        collapsable={false}
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
      const d = data.value;
      if (
        d.input.length === 0 ||
        d.width.length === 0 ||
        d.translateX.length === 0
      )
        return { opacity: 0, width: 0 };
      if (d.input.length === 1)
        return {
          opacity: 1,
          width: d.width[0],
          transform: [{ translateX: d.translateX[0] }],
          height: d.height[0],
        };
      return {
        opacity: 1,
        width: interpolate(pageDecimal.value, d.input, d.width, "clamp"),
        transform: [
          {
            translateX: interpolate(
              pageDecimal.value,
              d.input,
              d.translateX,
              "clamp",
            ),
          },
        ],
        height: d.height[0],
      };
    }, []);

    return (
      <Animated.View
        pointerEvents="none"
        collapsable={false}
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
    borderRadius: 999,
    paddingVertical: 4,
  },
});
