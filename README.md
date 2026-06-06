# react-native-collapsible-tabs-reanimated

Collapsible tab views for React Native powered by Reanimated, Gesture Handler, and Pager View.

## Installation

```sh
npm install react-native-collapsible-tabs-reanimated react-native-reanimated react-native-gesture-handler react-native-pager-view react-native-worklets
```

Make sure Reanimated is configured in your app. See the [Reanimated installation guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started) for the required Babel plugin and native setup.

## Usage

```tsx
import { useCallback } from "react";
import CollapsibleTabs from "react-native-collapsible-tabs-reanimated";

export function Example() {
  const keyExtractor = useCallback((item: number) => String(item), []);
  const renderItem = useCallback(({ item }: { item: number }) => null, []);

  return (
    <CollapsibleTabs.Root pageLength={2}>
      <CollapsibleTabs.Header>
        <CollapsibleTabs.StaticHeader>
          {/* Collapses on scroll */}
        </CollapsibleTabs.StaticHeader>
        <CollapsibleTabs.StickyHeader>
          <CollapsibleTabs.Bar>
            <CollapsibleTabs.Button index={0} name="First">
              First
            </CollapsibleTabs.Button>
            <CollapsibleTabs.Button index={1} name="Second">
              Second
            </CollapsibleTabs.Button>
            <CollapsibleTabs.MaterialIndicator />
          </CollapsibleTabs.Bar>
        </CollapsibleTabs.StickyHeader>
      </CollapsibleTabs.Header>

      <CollapsibleTabs.Pager>
        <CollapsibleTabs.Tab index={0}>
          <CollapsibleTabs.List
            data={[1, 2, 3]}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        </CollapsibleTabs.Tab>
        <CollapsibleTabs.Tab index={1}>
          <CollapsibleTabs.List
            data={[4, 5, 6]}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        </CollapsibleTabs.Tab>
      </CollapsibleTabs.Pager>
    </CollapsibleTabs.Root>
  );
}
```

## FlashList

`CollapsibleFlashList` is a drop-in replacement for `CollapsibleTabs.List` backed by `@shopify/flash-list`. It lives in a separate entry point so the dependency remains optional.

**Install the peer dependency:**

```sh
npm install @shopify/flash-list
```

**Import from the sub-path:**

```tsx
import { CollapsibleFlashList } from "react-native-collapsible-tabs-reanimated/flash-list";
import type { ListRenderItemInfo } from "@shopify/flash-list";
```

**Use inside a `CollapsibleTabs.Tab`** exactly as you would use `@shopify/flash-list`'s `FlashList`. The component must be rendered as a direct child of `CollapsibleTabs.Tab`:

```tsx
import { useCallback } from "react";
import CollapsibleTabs from "react-native-collapsible-tabs-reanimated";
import { CollapsibleFlashList } from "react-native-collapsible-tabs-reanimated/flash-list";

type Item = { id: string; label: string };

export function FlashListTab({ data }: { data: Item[] }) {
  const keyExtractor = useCallback((item: Item) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Item }) => <MyRow item={item} />,
    [],
  );

  return (
    <CollapsibleTabs.Tab index={0}>
      <CollapsibleFlashList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={72}
      />
    </CollapsibleTabs.Tab>
  );
}
```

`CollapsibleFlashList` accepts all props from `FlashList` except `renderScrollComponent`, which is managed internally. `stickyHeaderIndices` is supported.

## LegendList

`CollapsibleLegendList` wraps `@legendapp/list` (v3+) with the same collapsible gesture integration. It also lives behind an optional sub-path entry.

**Install the peer dependency:**

```sh
npm install @legendapp/list
```

**Import from the sub-path:**

```tsx
import { CollapsibleLegendList } from "react-native-collapsible-tabs-reanimated/legend-list";
import type { LegendListRenderItemProps } from "@legendapp/list/react-native";
```

**Use inside a `CollapsibleTabs.Tab`:**

```tsx
import { useCallback } from "react";
import CollapsibleTabs from "react-native-collapsible-tabs-reanimated";
import { CollapsibleLegendList } from "react-native-collapsible-tabs-reanimated/legend-list";
import type { LegendListRenderItemProps } from "@legendapp/list/react-native";

type Item = { id: string; label: string };

export function LegendListTab({ data }: { data: Item[] }) {
  const keyExtractor = useCallback((item: Item) => item.id, []);
  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<Item>) => <MyRow item={item} />,
    [],
  );

  return (
    <CollapsibleTabs.Tab index={1}>
      <CollapsibleLegendList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={72}
        recycleItems
      />
    </CollapsibleTabs.Tab>
  );
}
```

`CollapsibleLegendList` accepts all props from `LegendList`. `stickyHeaderIndices` is supported.

## Example App

The `example` folder contains a runnable Expo SDK 56 app that demonstrates `ScrollView`, `List`, `CollapsibleFlashList`, and `CollapsibleLegendList` tabs side by side.

**Prerequisites:** Node.js ≥ 18, the [Expo CLI](https://docs.expo.dev/more/expo-cli/), and either an Android emulator / iOS simulator or the Expo Go app on a physical device.

```sh
# From the repository root — installs both root and example dependencies
npm install

# Start the Metro bundler
cd example
npx expo start
```

Press `a` to open on Android, `i` for iOS, or scan the QR code with Expo Go.

**Run on Android with a local build:**

```sh
cd example
npx expo run:android
```

**Run on iOS with a local build:**

```sh
cd example
npx expo run:ios
```

> The example resolves `react-native-collapsible-tabs-reanimated` from the local workspace source (`workspace:*`), so any changes you make to `src/` are reflected immediately without a separate build step.

## Lazy Tab Customization

`CollapsibleTabs.Tab` mounts its children lazily by default. Pass `lazy={false}` to mount eagerly, or use `lazyProps` to fine-tune the lazy behaviour:

```tsx
<CollapsibleTabs.Tab
  index={0}
  loader={<ActivityIndicator />}
  loaderStyle={{
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  }}
  lazyProps={{
    enteringDuration: 280,
    enteringDelay: 0,
    exitingDuration: 120,
    placeholderProps: { accessibilityLabel: "Loading tab content" },
    containerProps: { testID: "first-tab-content" },
    onMount: () => {
      // Called once the tab content is allowed to mount.
    },
  }}
>
  <CollapsibleTabs.List
    data={[1, 2, 3]}
    keyExtractor={keyExtractor}
    renderItem={renderItem}
  />
</CollapsibleTabs.Tab>
```

For lower-level use cases, `Lazy`, `LazyProps`, and `LazyPlaceholderInfo` are exported directly.

## Notes

- Colors, labels, scroll buttons, indicators, and lazy placeholders are all configurable through props — the package has no opinion on your app's theme.
- `@shopify/flash-list` and `@legendapp/list` are optional peer dependencies. Install only what you use.
- Each tab keeps its own independent scroll offset. The active tab's offset drives the collapsible header gesture.
