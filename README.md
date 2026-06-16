# react-native-collapsible-tabs-reanimated

Collapsible tab views for React Native powered by Reanimated, Gesture Handler, Pager View, and Worklets.

Use this library when you need a screen with:

- A static header that collapses away as content scrolls.
- A sticky tab bar that remains visible.
- Horizontal pager tabs with independent vertical scroll positions.
- Reanimated tab indicators, including underline and segmented-button styles.
- Optional custom pull-to-refresh from the header.
- Optional FlashList and LegendList wrappers.

## Demo

<video src="./demo/demo.mp4" controls width="360"></video>

[View demo video](./demo/demo.mp4)

## Installation

```sh
npm install react-native-collapsible-tabs-reanimated react-native-reanimated react-native-gesture-handler react-native-pager-view react-native-worklets
```

If you use an optional list adapter, install its peer dependency too:

```sh
npm install @shopify/flash-list
npm install @legendapp/list
```

## Required Setup

Configure Reanimated and Gesture Handler in your app before using this package.

```tsx
// Usually at the app entry point
import "react-native-gesture-handler";
```

Make sure Reanimated is configured in Babel according to the [Reanimated installation guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started).

## Quick Start

```tsx
import { useCallback } from "react";
import { Text, View } from "react-native";
import CollapsibleTabs from "react-native-collapsible-tabs-reanimated";

const data = Array.from({ length: 40 }, (_, index) => ({ id: String(index) }));

export function PortfolioScreen() {
  const renderItem = useCallback(
    ({ item }: { item: { id: string } }) => (
      <View style={{ padding: 16 }}>
        <Text>Row {item.id}</Text>
      </View>
    ),
    [],
  );

  return (
    <CollapsibleTabs.Root
      pageLength={2}
      initialStaticHeight={220}
      initialStickyHeight={56}
    >
      <CollapsibleTabs.Header>
        <CollapsibleTabs.StaticHeader>
          <View style={{ height: 220, justifyContent: "flex-end", padding: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: "800" }}>Portfolio</Text>
          </View>
        </CollapsibleTabs.StaticHeader>

        <CollapsibleTabs.StickyHeader>
          <CollapsibleTabs.Bar>
            <CollapsibleTabs.Button index={0} name="Assets">
              Assets
            </CollapsibleTabs.Button>
            <CollapsibleTabs.Button index={1} name="Activity">
              Activity
            </CollapsibleTabs.Button>
            <CollapsibleTabs.MaterialIndicator />
          </CollapsibleTabs.Bar>
        </CollapsibleTabs.StickyHeader>
      </CollapsibleTabs.Header>

      <CollapsibleTabs.Pager>
        <CollapsibleTabs.Tab index={0} lazy={false}>
          <CollapsibleTabs.List
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </CollapsibleTabs.Tab>

        <CollapsibleTabs.Tab index={1} lazy={false}>
          <CollapsibleTabs.ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text>Activity content</Text>
          </CollapsibleTabs.ScrollView>
        </CollapsibleTabs.Tab>
      </CollapsibleTabs.Pager>
    </CollapsibleTabs.Root>
  );
}
```

## Component Anatomy

Use the components in this order:

```tsx
<CollapsibleTabs.Root pageLength={numberOfTabs}>
  <CollapsibleTabs.Header>
    <CollapsibleTabs.StaticHeader>{/* collapses */}</CollapsibleTabs.StaticHeader>
    <CollapsibleTabs.StickyHeader>{/* stays visible */}</CollapsibleTabs.StickyHeader>
  </CollapsibleTabs.Header>

  <CollapsibleTabs.Pager>
    <CollapsibleTabs.Tab index={0}>{/* scrollable */}</CollapsibleTabs.Tab>
    <CollapsibleTabs.Tab index={1}>{/* scrollable */}</CollapsibleTabs.Tab>
  </CollapsibleTabs.Pager>
</CollapsibleTabs.Root>
```

### Root

`Root` owns shared scroll state, pager progress, header heights, and optional refresh state.

Important props:

- `pageLength`: required. Must match the number of tabs.
- `initialStaticHeight`: recommended to reduce first-render flicker.
- `initialStickyHeight`: recommended to reduce first-render flicker.
- `offsetAdjustment`: use when the header should stop before fully collapsing, such as under a native status bar or custom inset.
- `refreshing`, `onRefresh`: enable header pull-to-refresh.

### Header

`Header` wraps the collapsible and sticky header content. It also handles direct drag gestures on the header.

```tsx
<CollapsibleTabs.Header>
  <CollapsibleTabs.StaticHeader>{/* hero */}</CollapsibleTabs.StaticHeader>
  <CollapsibleTabs.StickyHeader>{/* tab bar */}</CollapsibleTabs.StickyHeader>
</CollapsibleTabs.Header>
```

### Pager And Tab

`Pager` renders the horizontal pages. Each `Tab` must receive a stable `index` matching the related button.

```tsx
<CollapsibleTabs.Pager>
  <CollapsibleTabs.Tab index={0} lazy={false}>
    <CollapsibleTabs.List data={data} renderItem={renderItem} />
  </CollapsibleTabs.Tab>
</CollapsibleTabs.Pager>
```

`Tab` is lazy by default. Pass `lazy={false}` if a tab should mount immediately.

## Tab Bar Styles

### Underline Tabs

Use `MaterialIndicator` for a classic underline bar.

```tsx
<CollapsibleTabs.Bar tabButtonsGap={12}>
  <CollapsibleTabs.Button index={0} name="Assets">Assets</CollapsibleTabs.Button>
  <CollapsibleTabs.Button index={1} name="Activity">Activity</CollapsibleTabs.Button>
  <CollapsibleTabs.MaterialIndicator color="#2563eb" />
</CollapsibleTabs.Bar>
```

### Segmented Tabs

Use `SegmentIndicator` before the buttons and set `variant="segment"` on each button.

```tsx
<CollapsibleTabs.Bar
  backgroundColor="#eef2ff"
  tabButtonsGap={4}
  scrollButtons
  scrollContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6 }}
>
  <CollapsibleTabs.SegmentIndicator color="#ffffff" />
  <CollapsibleTabs.Button index={0} name="Assets" variant="segment">
    Assets
  </CollapsibleTabs.Button>
  <CollapsibleTabs.Button index={1} name="Allocation" variant="segment">
    Allocation
  </CollapsibleTabs.Button>
</CollapsibleTabs.Bar>
```

For a two-tab full-width segmented control, pass `fullWidth` to `Bar` and each `Button`.

```tsx
<CollapsibleTabs.Bar fullWidth tabButtonsGap={4}>
  <CollapsibleTabs.SegmentIndicator />
  <CollapsibleTabs.Button fullWidth index={0} name="First" variant="segment">
    First
  </CollapsibleTabs.Button>
  <CollapsibleTabs.Button fullWidth index={1} name="Second" variant="segment">
    Second
  </CollapsibleTabs.Button>
</CollapsibleTabs.Bar>
```

## Scrollable Content

Use one of the built-in scroll wrappers inside each `Tab`.

```tsx
<CollapsibleTabs.Tab index={0}>
  <CollapsibleTabs.List data={data} renderItem={renderItem} />
</CollapsibleTabs.Tab>

<CollapsibleTabs.Tab index={1}>
  <CollapsibleTabs.ScrollView>
    <Text>Short-form content</Text>
  </CollapsibleTabs.ScrollView>
</CollapsibleTabs.Tab>
```

Use `List` for regular `FlatList` data and `ScrollView` for short composed content. Each tab keeps its own independent scroll offset.

## Custom Pull To Refresh

Pull-to-refresh is driven by dragging the header while it is fully visible.

```tsx
import Animated, { useAnimatedStyle } from "react-native-reanimated";

function RefreshIndicator({ refreshProgress, isRefreshing }) {
  const style = useAnimatedStyle(() => ({
    opacity: isRefreshing.value ? 1 : refreshProgress.value,
    transform: [{ scale: 0.8 + refreshProgress.value * 0.2 }],
  }));

  return <Animated.View style={[{ width: 32, height: 32, borderRadius: 16 }, style]} />;
}

<CollapsibleTabs.Root refreshing={refreshing} onRefresh={reload} pageLength={2}>
  <CollapsibleTabs.Header
    renderRefreshControl={(info) => <RefreshIndicator {...info} />}
  >
    {/* header content */}
  </CollapsibleTabs.Header>
</CollapsibleTabs.Root>;
```

Refresh props on `Root`:

- `refreshing`: controlled refreshing state.
- `onRefresh`: called when the pull distance reaches the threshold.
- `refreshTriggerDistance`: default `72`.
- `refreshHoldDistance`: default `56`.
- `maxRefreshPullDistance`: default `140`.

The refresh context is also exported as `useCollapsibleTabsRefreshContext` for advanced custom UI.

## FlashList

`CollapsibleFlashList` is available from a separate entry point so `@shopify/flash-list` remains optional.

```tsx
import { CollapsibleFlashList } from "react-native-collapsible-tabs-reanimated/flash-list";

<CollapsibleTabs.Tab index={0}>
  <CollapsibleFlashList
    data={data}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
    estimatedItemSize={72}
  />
</CollapsibleTabs.Tab>;
```

Install the peer dependency first:

```sh
npm install @shopify/flash-list
```

## LegendList

`CollapsibleLegendList` is available from a separate entry point so `@legendapp/list` remains optional.

```tsx
import { CollapsibleLegendList } from "react-native-collapsible-tabs-reanimated/legend-list";

<CollapsibleTabs.Tab index={1}>
  <CollapsibleLegendList
    data={data}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
    estimatedItemSize={72}
    recycleItems
  />
</CollapsibleTabs.Tab>;
```

Install the peer dependency first:

```sh
npm install @legendapp/list
```

## Imperative API

Attach a ref to `Root` to scroll the active tab back to the top and reveal the header.

```tsx
const ref = useRef<CollapsibleTabsRootRef>(null);

<CollapsibleTabs.Root ref={ref} pageLength={2} />;

ref.current?.scrollToViewTop();
```

## Example App

The `example` folder contains a runnable Expo SDK 56 app demonstrating:

- `ScrollView`
- `List`
- `CollapsibleFlashList`
- `CollapsibleLegendList`
- Underline and segmented tab bars
- Custom header pull-to-refresh

```sh
npm install
cd example
npx expo start
```

Press `a` to open Android, `i` to open iOS, or scan the QR code with Expo Go.

## Notes

- The package is unstyled by default. Colors, labels, indicators, refresh controls, and placeholders are configured through props.
- `@shopify/flash-list` and `@legendapp/list` are optional peer dependencies. Install only what you use.
- `initialStaticHeight` and `initialStickyHeight` are strongly recommended for smoother first render.
- The tab bar button `index`, tab `index`, and `Root.pageLength` must stay in sync.
