import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

function AnimatedCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);
  return (
    <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>
  );
}
export default AnimatedCard;

// Animation delay for progressive fade-in
export const cardFadeDelay = 150;
