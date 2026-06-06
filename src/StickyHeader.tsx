import { memo } from 'react';

import { LayoutChangeEvent, ViewProps } from 'react-native';

import Animated from 'react-native-reanimated';

import { useCollapsibleTabsContext } from './Context';

const StickyHeader = ({ children, onLayout, ...props }: ViewProps) => {
  const { updateStickyHeight, stickyHeightValue } = useCollapsibleTabsContext();

  const handleLayout = (evt: LayoutChangeEvent) => {
    const height = evt.nativeEvent.layout.height;
    if (__DEV__ && (!stickyHeightValue || Math.abs(stickyHeightValue - height) > 10)) {
      console.info(`Set initialStickyHeight=${height} to reduce first-render flicker.`);
    }
    updateStickyHeight(height);
    onLayout?.(evt);
  };

  return (
    <Animated.View {...props} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
};

StickyHeader.displayName = 'CollapsibleTabs.StickyHeader';

export default memo(StickyHeader);
