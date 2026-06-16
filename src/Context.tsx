import { ReactNode, RefObject, createContext, memo, useContext } from "react";

import PagerView from "react-native-pager-view";
import { SharedValue } from "react-native-reanimated";

export type ItemLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
};

export type ListScroller = (animated?: boolean) => void;

export type CollapsibleTabsContextValue = {
  headerOffset: SharedValue<number>;
  staticHeight: SharedValue<number>;
  stickyHeight: SharedValue<number>;
  offsetAdjustment: SharedValue<number>;
  activeTabIndex: SharedValue<number>;
  activeTabIndexValue: number;
  activeListOffset: SharedValue<number>;
  pageDecimal: SharedValue<number>;
  listPanGesture: any;
  listGestures: any[];
  pagerRef: RefObject<PagerView | null>;
  itemLayout: ItemLayout[];
  registerButton: (config: ItemLayout) => void;
  registerListScroller: (index: number, scroller: ListScroller | null) => void;
  staticHeightValue: number;
  stickyHeightValue: number;
  updateStaticHeight: (height: number) => void;
  updateStickyHeight: (height: number) => void;
  revealHeaderOnListReachTop: (offsetY: number, velocityY: number) => void;
};

export type CollapsibleTabsRefreshContextValue = {
  refreshOffset: SharedValue<number>;
  refreshProgress: SharedValue<number>;
  refreshThreshold: SharedValue<number>;
  refreshHoldDistance: SharedValue<number>;
  maxRefreshPullDistance: SharedValue<number>;
  canRefresh: SharedValue<boolean>;
  isRefreshing: SharedValue<boolean>;
  updateRefreshPull: (pullDistance: number) => void;
  endRefreshPull: () => void;
  requestRefresh: () => void;
};

const CollapsibleTabsContext = createContext({} as CollapsibleTabsContextValue);

export const useCollapsibleTabsContext = () =>
  useContext(CollapsibleTabsContext);

export const CollapsibleTabsContextProvider = memo(
  ({
    children,
    ...props
  }: CollapsibleTabsContextValue & { children: ReactNode }) => {
    return (
      <CollapsibleTabsContext.Provider value={props}>
        {children}
      </CollapsibleTabsContext.Provider>
    );
  },
);

const CollapsibleTabsRefreshContext = createContext(
  {} as CollapsibleTabsRefreshContextValue,
);

export const useCollapsibleTabsRefreshContext = () =>
  useContext(CollapsibleTabsRefreshContext);

export const CollapsibleTabsRefreshContextProvider = memo(
  ({
    children,
    ...props
  }: CollapsibleTabsRefreshContextValue & { children: ReactNode }) => {
    return (
      <CollapsibleTabsRefreshContext.Provider value={props}>
        {children}
      </CollapsibleTabsRefreshContext.Provider>
    );
  },
);
