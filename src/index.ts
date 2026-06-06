import Bar from './Bar';
import Button from './Button';
import Header from './Header';
import { MaterialIndicator, SegmentIndicator } from './Indicator';
import List from './List';
import Pager from './Pager';
import Root from './Root';
import StaticHeader from './StaticHeader';
import StickyHeader from './StickyHeader';
import Tab from './Tab';

export { default as Bar } from './Bar';
export { default as Button } from './Button';
export { useCollapsibleTabsContext } from './Context';
export { default as Header } from './Header';
export { MaterialIndicator, SegmentIndicator } from './Indicator';
export { default as List } from './List';
export { default as Pager } from './Pager';
export { default as Root } from './Root';
export { default as StaticHeader } from './StaticHeader';
export { default as StickyHeader } from './StickyHeader';
export { default as Tab, useTabSelfContext } from './Tab';

export type { BarProps } from './Bar';
export type { ButtonProps, RenderTabLabelProps } from './Button';
export type { CollapsibleTabsContextValue, ItemLayout, ListScroller } from './Context';
export type { ListProps } from './List';
export type { PagerProps } from './Pager';
export type { CollapsibleTabsRootRef, RootProps } from './Root';
export type { TabProps, TabSelfContextValue } from './Tab';

const CollapsibleTabs = {
  Root,
  Header,
  StickyHeader,
  StaticHeader,
  Pager,
  Tab,
  List,
  Bar,
  Button,
  MaterialIndicator,
  SegmentIndicator,
} as const;

export default CollapsibleTabs;
