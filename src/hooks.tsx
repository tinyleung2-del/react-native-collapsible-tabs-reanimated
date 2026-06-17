import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useCollapsibleTabsContext } from "./Context";
import { useMemo } from "react";

export const useAnimatedScroller = (index: number) => {
  const { activeTabIndex, activeListOffset, revealHeaderOnListReachTop } =
    useCollapsibleTabsContext();

  const selfOffset = useSharedValue(0);
  const releaseVelocityY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        selfOffset.value = event.contentOffset.y;
        if (activeTabIndex.value === index)
          activeListOffset.value = event.contentOffset.y;
      },
      onEndDrag: (event) => {
        releaseVelocityY.value = event.velocity?.y ?? 0;
        revealHeaderOnListReachTop(
          event.contentOffset.y,
          releaseVelocityY.value,
        );
      },
      onMomentumBegin: (event) => {
        revealHeaderOnListReachTop(
          event.contentOffset.y,
          releaseVelocityY.value,
        );
      },
      onMomentumEnd: () => {
        // revealHeaderOnListReachTop(
        //   event.contentOffset.y,
        //   releaseVelocityY.value,
        // );
        releaseVelocityY.value = 0;
      },
    },
    [revealHeaderOnListReachTop],
  );

  return useMemo(() => ({ onScroll, selfOffset }), []);
};
