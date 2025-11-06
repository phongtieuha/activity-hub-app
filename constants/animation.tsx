import Animated, {
  BaseAnimationBuilder,
  Easing,
  EntryOrExitLayoutType,
  FadeInDown,
} from "react-native-reanimated";

export const ElementEntering: EntryOrExitLayoutType = FadeInDown.duration(
  400
).easing(Easing.inOut(Easing.cubic));

export const LayoutEntering: EntryOrExitLayoutType = FadeInDown.duration(
  600
).easing(Easing.inOut(Easing.cubic));

export const LayoutEnteringLonger: EntryOrExitLayoutType = FadeInDown.duration(
  800
).easing(Easing.inOut(Easing.cubic));

type AnimatedViewProps = React.ComponentProps<typeof Animated.View> & {
  delay?: number;
  entering?: BaseAnimationBuilder;
};

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  delay = 0,
  entering = ElementEntering as BaseAnimationBuilder,
  children,
  ...rest
}) => (
  <Animated.View entering={entering.delay(delay)} {...rest}>
    {children}
  </Animated.View>
);
