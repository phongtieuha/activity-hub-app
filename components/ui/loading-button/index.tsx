import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { AnimatedView } from "@/constants/animation";
import React from "react";
import {
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
} from "react-native-reanimated";

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
  loadingCssClass?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  loadingCssClass,
  children,
  ...buttonProps
}) => {
  return (
    <Button {...buttonProps}>
      {loading ? (
        <AnimatedView
          key="loading"
          entering={FadeInDown.duration(400).easing(Easing.inOut(Easing.cubic))}
          exiting={FadeOutDown.duration(400).easing(Easing.inOut(Easing.cubic))}
          className="flex flex-row gap-2"
        >
          <ButtonText className="">{loadingText || children}</ButtonText>
          <ButtonSpinner className={loadingCssClass} />
        </AnimatedView>
      ) : (
        <AnimatedView
          key="idle"
          entering={FadeInUp.duration(400).easing(Easing.inOut(Easing.cubic))}
          exiting={FadeOutUp.duration(400).easing(Easing.inOut(Easing.cubic))}
        >
          <ButtonText className="">{children}</ButtonText>
        </AnimatedView>
      )}
    </Button>
  );
};
