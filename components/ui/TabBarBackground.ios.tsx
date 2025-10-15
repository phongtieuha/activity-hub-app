import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="light"
      intensity={100}
      style={[
        StyleSheet.absoluteFill,
        { borderColor: "transparent" },
        {
          borderRadius: 27,
          overflow: "hidden",
        },
      ]}
    ></BlurView>
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
