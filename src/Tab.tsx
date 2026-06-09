import { ReactNode, createContext, memo, useContext, useState } from "react";

import { StyleProp, ViewStyle } from "react-native";

import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useCollapsibleTabsContext } from "./Context";
import { Lazy, type LazyProps } from "./Lazy";

export type TabProps = {
  index: number;
  loader?: ReactNode;
  children?:
    | ReactNode
    | ((info: {
        isFocused: boolean;
        pageDecimal: SharedValue<number>;
      }) => ReactNode);
  disableLazyEntering?: boolean;
  disablePreload?: boolean;
  lazy?: boolean;
  isLoading?: boolean;
  isScreenFocused?: boolean;
  loaderStyle?: StyleProp<ViewStyle>;
  lazyProps?: Omit<
    LazyProps,
    | "children"
    | "disableEntering"
    | "focused"
    | "placeholder"
    | "placeholderStyle"
  >;
};

const Tab = ({
  index,
  loader,
  loaderStyle,
  lazyProps,
  disableLazyEntering = true,
  disablePreload = false,
  lazy = true,
  children,
  isLoading = false,
  isScreenFocused = true,
}: TabProps) => {
  const { activeTabIndexValue, pageDecimal } = useCollapsibleTabsContext();
  const [shouldPreload, setShouldPreload] = useState(false);
  const [canMount, setCanMount] = useState(lazy === false);

  const preloadLatched = useSharedValue(disablePreload);
  const mountLatched = useSharedValue(lazy === false);

  useAnimatedReaction(
    () => pageDecimal.value,
    (value) => {
      if (!preloadLatched.value && Math.round(value) === index) {
        preloadLatched.value = true;
        scheduleOnRN(setShouldPreload, true);
      }
      if (
        !mountLatched.value &&
        Math.abs(value - index) <= 1.5 &&
        isScreenFocused
      ) {
        mountLatched.value = true;
        scheduleOnRN(setCanMount, true);
      }
    },
    [index, isScreenFocused],
  );

  const isFocused = index === activeTabIndexValue && isScreenFocused;
  const isMounted = lazy ? (isFocused || shouldPreload) && !isLoading : true;

  const renderChildren = () => {
    if (lazy) {
      if (!canMount) return null;
      return (
        <Lazy
          {...lazyProps}
          focused={isMounted && !isLoading}
          disableEntering={disableLazyEntering}
          placeholder={loader}
          placeholderStyle={loaderStyle}
        >
          {typeof children === "function"
            ? children({ isFocused, pageDecimal })
            : children}
        </Lazy>
      );
    }

    return typeof children === "function"
      ? children({ isFocused, pageDecimal })
      : children;
  };

  return (
    <TabSelfContextProvider
      index={index}
      isFocused={isFocused}
      isMounted={isMounted}
    >
      {renderChildren()}
    </TabSelfContextProvider>
  );
};

export type TabSelfContextValue = {
  index: number;
  isFocused: boolean;
  isMounted: boolean;
};

const TabSelfContext = createContext({} as TabSelfContextValue);

const TabSelfContextProvider = memo(
  ({ children, ...props }: TabSelfContextValue & { children: ReactNode }) => {
    return (
      <TabSelfContext.Provider value={props}>
        {children}
      </TabSelfContext.Provider>
    );
  },
);

export const useTabSelfContext = () => useContext(TabSelfContext);

Tab.displayName = "CollapsibleTabs.Tab";

export default memo(Tab);
