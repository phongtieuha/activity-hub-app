import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

export const useScroll = () => {
  function detectScroll(
    lastOffsetY: React.RefObject<number>,
    event: NativeSyntheticEvent<NativeScrollEvent>,
    onGoUp: () => void,
    onGoDown: () => void
  ) {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    // Only trigger if not at very top or bottom (avoid bounce effect)
    const atTop = currentOffsetY <= 0;
    const atBottom = currentOffsetY + layoutHeight >= contentHeight - 1;
    if (!atTop && !atBottom) {
      if (currentOffsetY > lastOffsetY.current) {
        onGoDown();
      } else if (currentOffsetY < lastOffsetY.current) {
        onGoUp();
      }
    }
    lastOffsetY.current = currentOffsetY;
  }
  return {
    detectScroll,
  };
};
