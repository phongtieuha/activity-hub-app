import type { PropsWithChildren, ReactElement } from "react";
import { RefreshControl, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

// import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  className?: string;
  contentContainerClassName?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  className,
  contentContainerClassName,
  refreshing: propsrefreshing,
  onRefresh: propsOnRefresh,
}: Props) {
  // const colorScheme = useColorScheme() ?? "light";
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = 0; //useBottomTabOverflow();
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    // <View style={styles.container}>
    <Animated.ScrollView
      ref={scrollRef}
      scrollEventThrottle={0}
      scrollIndicatorInsets={{ bottom }}
      contentContainerStyle={{ paddingBottom: bottom }}
      contentContainerClassName={contentContainerClassName}
      className={className}
      refreshControl={
        <RefreshControl
          refreshing={propsrefreshing ?? false}
          onRefresh={propsOnRefresh}
          tintColor="#e11d48"
          colors={["#e11d48", "#fff"]}
          progressBackgroundColor="#222"
        />
      }
    >
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {headerImage}
      </Animated.View>
      {children}
    </Animated.ScrollView>
    // </View>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  // },
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  // content: {
  //   flex: 1,
  //   paddingLeft: 16,
  //   paddingRight: 16,
  //   paddingTop: 24,
  //   paddingBottom: 24,
  //   gap: 16,
  //   overflow: "hidden",
  // },
});
