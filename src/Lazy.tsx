import { ReactNode, useEffect, useState } from 'react';

import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export type LazyProps = {
  focused: boolean;
  children?: ReactNode;
  placeholder?: ReactNode;
  placeholderStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  disableEntering?: boolean;
  duration?: number;
  delay?: number;
};

export function Lazy({ placeholder, placeholderStyle, disableEntering = false, focused, duration = 200, delay = 50, children, style }: LazyProps) {
  const [canMount, setCanMount] = useState(false);

  useEffect(() => {
    if (focused) setCanMount(true);
  }, [focused]);

  if (!canMount) {
    return (
      <Animated.View exiting={FadeOut.duration(300)} style={[styles.placeholder, placeholderStyle]} pointerEvents="box-none">
        {placeholder}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={disableEntering ? undefined : FadeIn.duration(duration).delay(delay)} style={[styles.container, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    height: '100%',
  },
  placeholder: {
    paddingVertical: 12,
    width: '100%',
  },
});
