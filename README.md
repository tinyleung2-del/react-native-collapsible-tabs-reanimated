# react-native-collapsible-tabs-reanimated

Collapsible tab views for React Native powered by Reanimated, Gesture Handler, and Pager View.

## Installation

```sh
npm install react-native-collapsible-tabs-reanimated react-native-reanimated react-native-gesture-handler react-native-pager-view react-native-worklets
```

Make sure Reanimated is configured in your app. See the Reanimated installation guide for the required Babel plugin and native setup.

## Usage

```tsx
import CollapsibleTabs from 'react-native-collapsible-tabs-reanimated';

export function Example() {
  return (
    <CollapsibleTabs.Root pageLength={2}>
      <CollapsibleTabs.Header>
        <CollapsibleTabs.StaticHeader>
          {/* Header content */}
        </CollapsibleTabs.StaticHeader>
        <CollapsibleTabs.StickyHeader>
          <CollapsibleTabs.Bar>
            <CollapsibleTabs.Button index={0} name="First">First</CollapsibleTabs.Button>
            <CollapsibleTabs.Button index={1} name="Second">Second</CollapsibleTabs.Button>
            <CollapsibleTabs.MaterialIndicator />
          </CollapsibleTabs.Bar>
        </CollapsibleTabs.StickyHeader>
      </CollapsibleTabs.Header>

      <CollapsibleTabs.Pager>
        <CollapsibleTabs.Tab index={0}>
          <CollapsibleTabs.List data={[1, 2, 3]} renderItem={({ item }) => null} />
        </CollapsibleTabs.Tab>
        <CollapsibleTabs.Tab index={1}>
          <CollapsibleTabs.List data={[4, 5, 6]} renderItem={({ item }) => null} />
        </CollapsibleTabs.Tab>
      </CollapsibleTabs.Pager>
    </CollapsibleTabs.Root>
  );
}
```

## Notes

This package does not depend on app-specific theme hooks. Colors, labels, scroll buttons, indicators, and lazy placeholders are configurable through props.

## Example App

The `example` folder contains a runnable Expo app with basic and customized lazy tab implementations.

```sh
cd example
yarn install
yarn start
```

## Lazy Tab Customization

`CollapsibleTabs.Tab` accepts `lazyProps` for customizing the lazy mount wrapper without replacing the tab implementation.

```tsx
<CollapsibleTabs.Tab
  index={0}
  loader={<ActivityIndicator />}
  loaderStyle={{ minHeight: 160, alignItems: 'center', justifyContent: 'center' }}
  lazyProps={{
    enteringDuration: 280,
    enteringDelay: 0,
    exitingDuration: 120,
    placeholderProps: { accessibilityLabel: 'Loading tab content' },
    containerProps: { testID: 'first-tab-content' },
    onMount: () => {
      // Track or prefetch once the tab content is allowed to mount.
    },
  }}
>
  <CollapsibleTabs.List data={[1, 2, 3]} renderItem={({ item }) => null} />
</CollapsibleTabs.Tab>
```

For lower-level use cases, `Lazy`, `LazyProps`, and `LazyPlaceholderInfo` are exported directly.
