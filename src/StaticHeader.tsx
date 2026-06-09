import { memo } from "react";

import { LayoutChangeEvent, ViewProps } from "react-native";

import Animated from "react-native-reanimated";

import { useCollapsibleTabsContext } from "./Context";

const StaticHeader = ({ children, onLayout, ...props }: ViewProps) => {
  const { updateStaticHeight, staticHeightValue } = useCollapsibleTabsContext();

  const handleLayout = (evt: LayoutChangeEvent) => {
    const height = evt.nativeEvent.layout.height;
    if (
      __DEV__ &&
      (!staticHeightValue || Math.abs(staticHeightValue - height) > 10)
    ) {
      console.info(
        `Set initialStaticHeight=${height} to reduce first-render flicker.`,
      );
    }
    updateStaticHeight(height);
    onLayout?.(evt);
  };

  return (
    <Animated.View {...props} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
};

StaticHeader.displayName = "CollapsibleTabs.StaticHeader";

export default memo(StaticHeader);
