import { useCallback } from "react";

import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import CollapsibleTabs from "react-native-collapsible-tabs-reanimated";
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const TAB_COUNT = 2;

const overviewCards = [
  {
    title: "ScrollView support",
    text: "Plain scroll content now reports offsets to the collapsible header.",
  },
  {
    title: "Shared gestures",
    text: "Vertical drags coordinate with the header while horizontal swipes move pages.",
  },
  {
    title: "Imperative reset",
    text: "The root can still ask the active tab scroller to return to top.",
  },
  {
    title: "Expo ready",
    text: "This example imports the local workspace package in an Expo SDK 56 app.",
  },
  {
    title: "Non-virtual content",
    text: "Use this for short pages, forms, and composed marketing-style sections.",
  },
  {
    title: "Independent offsets",
    text: "Each tab keeps its own vertical position while the active offset drives header gestures.",
  },
  {
    title: "Sticky navigation",
    text: "The static hero collapses away while the sticky tab bar remains available.",
  },
  {
    title: "Gesture handoff",
    text: "The outer pager and inner scroll views coordinate through Gesture Handler native gestures.",
  },
  {
    title: "Measured header",
    text: "Static and sticky header heights are reported through context as they lay out.",
  },
  {
    title: "Simple composition",
    text: "Cards, forms, and rich layouts can be nested directly without virtualized list requirements.",
  },
  {
    title: "Reanimated powered",
    text: "Header movement, tab indicators, and pager progress stay on the animation runtime.",
  },
  {
    title: "Workspace import",
    text: "The example resolves the package from local source so changes can be tested immediately.",
  },
  {
    title: "Mobile friendly",
    text: "The demo uses safe-area top spacing and fixed header estimates to reduce first-render flicker.",
  },
];

const details = [
  "Pull down at the top of a tab to reveal the full header.",
  "Scroll up to collapse the static header and keep the tab bar pinned.",
  "Swipe horizontally to switch tabs without losing each tab scroll offset.",
  "The new component mirrors List defaults: no bounce, handled keyboard taps, and overflow disabled.",
  "Both tabs below are backed by CollapsibleTabs.ScrollView.",
  "Switch back to the overview tab after scrolling here to verify each tab restores its own offset.",
  "Drag on the header itself to collapse or reveal it without starting from the scroll content.",
  "Use short, composed content with ScrollView; use CollapsibleTabs.List for long virtualized datasets.",
  "The tab indicator follows pager progress while the sticky header remains visible.",
  "Try quick upward and downward flings to exercise the header decay and spring behavior.",
  "The same collapsible root can mix ScrollView tabs and List tabs when needed.",
  "This page intentionally has more rows so the collapsible interaction is easier to test.",
  "All records are static demo data and can be replaced with real screen content.",
  "The scroll views register a scroller with the root for active-tab scroll-to-top behavior.",
  "The active tab offset is synchronized whenever the selected page changes.",
  "Pager swipes should remain horizontal while vertical movement is handled by the scroll view and header.",
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

  const keyExtractor = useCallback((_: string, index: number) => String(index), []);

  const renderDetailItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View style={styles.detailRow}>
        <Text style={styles.detailNumber}>{index + 1}</Text>
        <Text style={styles.detailText}>{item}</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: "#172554" }} />
      <CollapsibleTabs.Root
        pageLength={TAB_COUNT}
        initialStaticHeight={176}
        initialStickyHeight={56}
      >
        <CollapsibleTabs.Header>
          <CollapsibleTabs.StaticHeader
            style={[styles.hero, { paddingBottom: insets.top }]}
          >
            <Text style={styles.eyebrow}>
              react-native-collapsible-tabs-reanimated
            </Text>
            <Text style={styles.title}>ScrollView example</Text>
            <Text style={styles.subtitle}>
              A compact Expo demo for the new collapsible scroll container.
            </Text>
          </CollapsibleTabs.StaticHeader>

          <CollapsibleTabs.StickyHeader style={styles.stickyHeader}>
            <CollapsibleTabs.Bar
              fullWidth
              scrollButtons={false}
              backgroundColor="#ffffff"
              scrollContainerStyle={styles.tabBar}
            >
              <CollapsibleTabs.Button
                index={0}
                name="Overview"
                fullWidth
                activeLabelColor="#101828"
                inactiveLabelColor="#98a2b3"
              >
                Overview
              </CollapsibleTabs.Button>
              <CollapsibleTabs.Button
                index={1}
                name="Details"
                fullWidth
                activeLabelColor="#101828"
                inactiveLabelColor="#98a2b3"
              >
                Details
              </CollapsibleTabs.Button>
              <CollapsibleTabs.MaterialIndicator color="#2563eb" />
            </CollapsibleTabs.Bar>
          </CollapsibleTabs.StickyHeader>
        </CollapsibleTabs.Header>

        <CollapsibleTabs.Pager
          getHeight={(_, stickyHeightValue) =>
            frame.height - insets.top - insets.bottom - stickyHeightValue
          }
        >
          <CollapsibleTabs.Tab index={0} lazy={false}>
            <CollapsibleTabs.ScrollView
              contentContainerStyle={styles.scrollContent}
            >
              {overviewCards.map((item) => (
                <View key={item.title} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardText}>{item.text}</Text>
                </View>
              ))}
            </CollapsibleTabs.ScrollView>
          </CollapsibleTabs.Tab>

          <CollapsibleTabs.Tab index={1} lazy={false}>
            <CollapsibleTabs.List
              data={details}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.scrollContent}
              ListHeaderComponent={
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Try these interactions</Text>
                </View>
              }
              renderItem={renderDetailItem}
            />
          </CollapsibleTabs.Tab>
        </CollapsibleTabs.Pager>
      </CollapsibleTabs.Root>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f4f7",
  },
  hero: {
    minHeight: 176,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#172554",
  },
  eyebrow: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 22,
  },
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d0d5dd",
    backgroundColor: "#ffffff",
  },
  tabBar: {
    paddingHorizontal: 24,
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    shadowColor: "#101828",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
  },
  cardText: {
    marginTop: 8,
    color: "#475467",
    fontSize: 15,
    lineHeight: 22,
  },
  panelHeader: {
    padding: 20,
    paddingBottom: 8,
    borderRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#ffffff",
  },
  panelTitle: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e4e7ec",
  },
  detailNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 28,
    textAlign: "center",
  },
  detailText: {
    flex: 1,
    color: "#475467",
    fontSize: 15,
    lineHeight: 22,
  },
});
