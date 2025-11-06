import React from "react";
import Animated, {
  BaseAnimationBuilder,
  Easing,
  FadeInDown,
  FadeInLeft,
  FadeOutDown,
} from "react-native-reanimated";

export const ElementEnteringFadeInDown: BaseAnimationBuilder =
  FadeInDown.duration(400).easing(Easing.inOut(Easing.cubic));

export const ElementEnteringFadeInLeft: BaseAnimationBuilder =
  FadeInLeft.duration(400).easing(Easing.inOut(Easing.cubic));

export const ElementExitingFadeOutDown: BaseAnimationBuilder =
  FadeOutDown.duration(400).easing(Easing.inOut(Easing.cubic));

export const LayoutEnteringFadeInDown: BaseAnimationBuilder =
  FadeInDown.duration(600).easing(Easing.inOut(Easing.cubic));

export const LayoutEnteringLongerFadeInDown: BaseAnimationBuilder =
  FadeInDown.duration(800).easing(Easing.inOut(Easing.cubic));

type AnimatedViewProps = React.ComponentProps<typeof Animated.View> & {
  delay?: number;
  entering?: BaseAnimationBuilder;
};

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  delay = 0,
  entering = ElementEnteringFadeInDown,
  exiting,
  children,
  ...rest
}) => (
  <Animated.View entering={entering.delay(delay)} exiting={exiting} {...rest}>
    {children}
  </Animated.View>
);

type AnimatedViewListProps = React.ComponentProps<typeof Animated.View> & {
  entering?: BaseAnimationBuilder;
  childrenDelayStart?: number;
  childrenDelayIncrement?: number;
  childrenCssClasses?: string;
};

export const AnimatedViewList: React.FC<AnimatedViewListProps> = ({
  entering = ElementEnteringFadeInDown,
  childrenDelayStart = 0,
  childrenDelayIncrement = 100,
  childrenCssClasses,
  children,
}) => {
  const childArray = React.Children.toArray(children as React.ReactNode);

  return (
    <>
      {childArray.map((child, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown.duration(400)
            .easing(Easing.inOut(Easing.cubic))
            .delay(childrenDelayStart + index * childrenDelayIncrement)}
          className={childrenCssClasses}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
};
