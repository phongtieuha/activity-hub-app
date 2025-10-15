import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

function AnimatedCard({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
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
    <Animated.View style={[{ opacity: fadeAnim }, style]} className={className}>
      {children}
    </Animated.View>
  );
}
export default AnimatedCard;

// Animation delay for progressive fade-in
export const cardFadeDelay = 150;
