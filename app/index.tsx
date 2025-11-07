import {
  login,
  verifyLogin,
} from "@/__generated-client/http-client-integration";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { LoadingButton } from "@/components/ui/loading-button";
import { Pressable } from "@/components/ui/pressable";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectScrollView,
  SelectTrigger,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  AnimatedView,
  LayoutEnteringLongerFadeInDown,
} from "@/constants/animation";
import { participantUsers } from "@/constants/loginUsers";
import { managerUsers } from "@/constants/loginUsers-managers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronDownIcon,
  SquareUserRoundIcon,
  User2Icon,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  Easing,
  LayoutAnimationConfig,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// OTP Input Component
const OTPInput = ({
  value,
  onChangeText,
  length = 6,
  className,
}: {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  className?: string;
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [otpDigits, setOtpDigits] = React.useState<string[]>(
    Array(length).fill("")
  );

  // Update otpDigits when value prop changes
  React.useEffect(() => {
    const digits = value.split("").slice(0, length);
    const paddedDigits = [...digits, ...Array(length - digits.length).fill("")];
    setOtpDigits(paddedDigits);
  }, [value, length]);

  const handleChangeText = (text: string, index: number) => {
    const newDigits = [...otpDigits];

    if (text.length > 1) {
      // Handle paste or multiple character input
      const pastedDigits = text
        .replace(/[^0-9]/g, "")
        .split("")
        .slice(0, length);
      for (let i = 0; i < length; i++) {
        newDigits[i] = pastedDigits[i] || "";
      }
      setOtpDigits(newDigits);
      onChangeText(newDigits.join(""));

      // Focus on the last filled input or next empty one
      const nextIndex = Math.min(pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single character input
      newDigits[index] = text.replace(/[^0-9]/g, "");
      setOtpDigits(newDigits);
      onChangeText(newDigits.join(""));

      // Auto-focus next input
      if (text && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <HStack space="sm" className={`justify-center ${className}`}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={otpStyles.otpBox}
            value={otpDigits[index]}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            selectionColor="#ef4444"
            cursorColor="#ef4444"
          />
        ))}
    </HStack>
  );
};

const otpStyles = StyleSheet.create({
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    backgroundColor: "#e5e7eb", // bg-gray-200
    textAlign: "center",
  },
});

export default function Index() {
  // --- Navigation & Utilities ---
  const router = useRouter();

  // --- State ---
  const [isOTPShown, setIsOTPShown] = React.useState(false);
  const [isActionInProgress, setIsActionInProgress] = React.useState(false);
  const [selectedOTP, setSelectedOTP] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState("");
  const [selectedManager, setSelectedManager] = React.useState("");
  const [loginAttemptId, setLoginAttemptId] = React.useState("");
  const [loggedInAs, setLoggedInAs] = React.useState<
    "participant" | "manager"
  >();
  const containerTranslateY = useSharedValue(0);
  const imageScale = useSharedValue(1.3);

  // Scale animation for background image
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageScale.value }],
    };
  });

  // --- Handlers ---
  const handleParticipantPress = async () => {
    Keyboard.dismiss();
    containerTranslateY.value = withSpring(0);
    setIsActionInProgress(true);
    // setLoggedInAs("participant");
    try {
      if (isOTPShown) {
        const result = await verifyLogin({
          loginAttemptId: loginAttemptId,
          code: selectedOTP,
        });
        await AsyncStorage.setItem("AUTH_TOKEN", result?.accessToken ?? "");
        await AsyncStorage.setItem("LOGGED_IN_AS", "participant");
        router.replace("./(participant)/(tabs)");
      } else {
        const result = await login({
          nric: selectedUser,
          clientType: "MOBILE",
        });
        setLoginAttemptId(result?.loginAttemptId ?? "");
        setIsOTPShown(true);
      }
    } catch (error) {}
    setIsActionInProgress(false);
  };

  const handleManagerPress = async () => {
    Keyboard.dismiss();
    containerTranslateY.value = withSpring(0);

    setIsActionInProgress(true);
    try {
      if (isOTPShown) {
        const result = await verifyLogin({
          loginAttemptId: loginAttemptId,
          code: selectedOTP,
        });
        await AsyncStorage.setItem("AUTH_TOKEN", result?.accessToken ?? "");
        await AsyncStorage.setItem("LOGGED_IN_AS", "manager");
        router.replace("./(manager)/(tabs)");
      } else {
        const result = await login({
          nric: selectedManager,
          clientType: "MOBILE",
        });
        setLoginAttemptId(result?.loginAttemptId ?? "");
        setIsOTPShown(true);
      }
    } catch (error) {}
    setIsActionInProgress(false);
  };

  const handleBack = () => {
    setIsOTPShown(false);
    setSelectedOTP("");
    setLoginAttemptId("");
    setLoggedInAs(undefined);
  };

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      "keyboardWillShow",
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        containerTranslateY.value = withSpring(-keyboardHeight);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => {
        containerTranslateY.value = withSpring(0);
      }
    );
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [containerTranslateY]);

  React.useEffect(() => {
    imageScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [imageScale]);

  // --- Effects ---
  useEffect(() => {
    // Redirect to your desired initial route
    // router.replace("/(tabs)");
    const navIfLoggedIn = async () => {
      const token = await AsyncStorage.getItem("AUTH_TOKEN");
      const loggedInAs = await AsyncStorage.getItem("LOGGED_IN_AS");
      if (token && loggedInAs === "participant") {
        router.replace("./(participant)/(tabs)");
      } else if (token && loggedInAs === "manager") {
        router.replace("./(manager)/(tabs)");
      }
    };
    navIfLoggedIn();
  }, [router]);

  return (
    <Animated.ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="flex-grow"
      style={{ transform: [{ translateY: containerTranslateY }] }}
    >
      <View className="w-full flex-1 overflow-hidden rounded-tl-3xl rounded-tr-3xl">
        <Center style={{ flex: 1 }}>
          <Animated.View style={[imageAnimatedStyle]} className="h-full w-full">
            <ImageBackground
              source={require("@/assets/images/bg-login.png")}
              style={{
                width: "100%",
                height: "100%",
              }}
              className="h-2/3"
              contentFit="cover"
            >
              <Center className="flex-1">
                <Image
                  source={require("@/assets/images/full_logo_white.svg")}
                  style={{
                    width: 160,
                    height: 160,
                    marginBottom: 0,
                  }}
                  contentFit="contain"
                />
              </Center>
            </ImageBackground>
          </Animated.View>
        </Center>
      </View>

      <Animated.View
        entering={LayoutEnteringLongerFadeInDown}
        className="-mt-8 h-2/5 rounded-3xl bg-white px-4 py-8"
      >
        {!loggedInAs && (
          <AnimatedCard className="flex-1 gap-4">
            <AnimatedView>
              <Heading size="lg">OneNS. Supporting Your NS Experience.</Heading>
              <Text>
                Get practical support and reliable information to help you
                through every stage of your NS journey.
              </Text>
            </AnimatedView>

            <HStack space="xl" className="mt-auto">
              <AnimatedView delay={100} className="flex-1">
                <Pressable
                  onPress={() => setLoggedInAs("participant")}
                  className="flex  flex-col items-center justify-center gap-3 rounded-3xl border border-gray-300 p-4"
                >
                  <Center className="rounded-full bg-red-600 p-2">
                    <User2Icon color="white" />
                  </Center>
                  <Text className="font-semibold">Login as Participant</Text>
                </Pressable>
              </AnimatedView>
              <AnimatedView delay={200} className="flex-1">
                <Pressable
                  onPress={() => setLoggedInAs("manager")}
                  className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-gray-300 p-4"
                >
                  <Center className="rounded-full bg-red-600 p-2">
                    <SquareUserRoundIcon color="white" />
                  </Center>
                  <Text className="font-semibold">Login as Manager</Text>
                </Pressable>
              </AnimatedView>
            </HStack>
          </AnimatedCard>
        )}

        {!isOTPShown && loggedInAs === "participant" && (
          <LayoutAnimationConfig skipExiting>
            <AnimatedCard className="flex-1 gap-4">
              <AnimatedView>
                <Heading size="lg">Login as Participant</Heading>
                <Text>Manage your national service matters.</Text>
              </AnimatedView>

              <AnimatedView className="mt-auto" delay={100}>
                <Select
                  selectedValue={selectedUser}
                  onValueChange={(nric) => {
                    setSelectedUser(nric);
                  }}
                >
                  <SelectTrigger
                    variant="outline"
                    size="md"
                    className="bg-white"
                  >
                    <SelectInput placeholder="Select option" />
                    <SelectIcon className="ml-auto mr-2" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />

                    <SelectContent className="max-h-[75%]">
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>

                      <SelectScrollView>
                        {participantUsers.map((user) => (
                          <SelectItem
                            key={user.nric}
                            label={`${user.email} (${user.nric})`}
                            value={user.nric}
                          />
                        ))}
                      </SelectScrollView>
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </AnimatedView>

              <VStack space="xl" className="mt-auto">
                <AnimatedView delay={200}>
                  <LoadingButton
                    variant="solid"
                    action={selectedUser ? "negative" : "secondary"}
                    size="xl"
                    onPress={handleParticipantPress}
                    disabled={!selectedUser}
                    loading={isActionInProgress}
                    loadingText="Logging in"
                    loadingCssClass="text-white"
                  >
                    <ButtonText className="text-center">Login</ButtonText>
                  </LoadingButton>
                </AnimatedView>
                <AnimatedView delay={300}>
                  <Button
                    variant="solid"
                    action="default"
                    size="xl"
                    onPress={() => setLoggedInAs(undefined)}
                  >
                    <ButtonText>Back</ButtonText>
                  </Button>
                </AnimatedView>
              </VStack>
            </AnimatedCard>
          </LayoutAnimationConfig>
        )}

        {!isOTPShown && loggedInAs === "manager" && (
          <LayoutAnimationConfig skipExiting>
            <AnimatedCard className="flex-1 gap-4">
              <AnimatedView>
                <Heading size="lg">Login as Manager</Heading>
                <Text>Manage your national service matters.</Text>
              </AnimatedView>

              <AnimatedView className="mt-auto" delay={100}>
                <Select
                  selectedValue={selectedManager}
                  onValueChange={(nric) => setSelectedManager(nric)}
                >
                  <SelectTrigger
                    variant="outline"
                    size="md"
                    className="bg-white"
                  >
                    <SelectInput placeholder="Select option" />
                    <SelectIcon className="ml-auto mr-2" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />

                    <SelectContent className="max-h-[75%]">
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>

                      <SelectScrollView>
                        {managerUsers.map((user) => (
                          <SelectItem
                            key={user.nric}
                            label={`${user.email} (${user.nric})`}
                            value={user.nric}
                          />
                        ))}
                      </SelectScrollView>
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </AnimatedView>

              <VStack space="xl" className="mt-auto">
                <AnimatedView delay={200}>
                  <LoadingButton
                    variant="solid"
                    action={selectedManager ? "negative" : "secondary"}
                    size="xl"
                    onPress={handleManagerPress}
                    disabled={!selectedManager}
                    loading={isActionInProgress}
                    loadingText="Logging in"
                    loadingCssClass="text-white"
                  >
                    <ButtonText>Login</ButtonText>
                  </LoadingButton>
                </AnimatedView>

                <AnimatedView delay={300}>
                  <Button
                    variant="solid"
                    action="default"
                    size="xl"
                    onPress={() => setLoggedInAs(undefined)}
                  >
                    <ButtonText>Back</ButtonText>
                  </Button>
                </AnimatedView>
              </VStack>
            </AnimatedCard>
          </LayoutAnimationConfig>
        )}

        {isOTPShown && loggedInAs === "participant" && (
          <LayoutAnimationConfig skipExiting>
            <AnimatedCard className="flex-1 gap-4">
              <AnimatedView>
                <Heading size="lg">Verify OTP</Heading>
              </AnimatedView>

              <AnimatedView delay={100}>
                <Box>
                  <Text className="m-0 p-0">
                    We sent an OTP to{" "}
                    <Text className="font-bold">{selectedUser}</Text>.
                  </Text>
                  <Text>Enter it below to continue.</Text>
                </Box>
              </AnimatedView>

              <AnimatedView delay={200} className="mt-auto">
                <OTPInput
                  value={selectedOTP}
                  onChangeText={setSelectedOTP}
                  length={6}
                />
              </AnimatedView>

              <VStack space="xl" className="mt-auto">
                <AnimatedView delay={300}>
                  <LoadingButton
                    variant="solid"
                    action="negative"
                    size="xl"
                    onPress={handleParticipantPress}
                    loading={isActionInProgress}
                    loadingText="Verifying"
                    loadingCssClass="text-white"
                  >
                    <ButtonText>Verify</ButtonText>
                  </LoadingButton>
                </AnimatedView>

                <AnimatedView delay={400}>
                  <Button
                    variant="solid"
                    action="default"
                    size="xl"
                    onPress={handleBack}
                  >
                    <ButtonText>Back</ButtonText>
                  </Button>
                </AnimatedView>
              </VStack>
            </AnimatedCard>
          </LayoutAnimationConfig>
        )}

        {isOTPShown && loggedInAs === "manager" && (
          <LayoutAnimationConfig skipExiting>
            <AnimatedCard className="flex-1 gap-4">
              <AnimatedView>
                <Heading size="lg">Verify OTP</Heading>
              </AnimatedView>

              <AnimatedView delay={100}>
                <Box>
                  <Text className="m-0 p-0">
                    We sent an OTP to{" "}
                    <Text className="font-bold">{selectedManager}</Text>.
                  </Text>
                  <Text>Enter it below to continue.</Text>
                </Box>
              </AnimatedView>

              <AnimatedView className="mt-auto" delay={200}>
                <OTPInput
                  value={selectedOTP}
                  onChangeText={setSelectedOTP}
                  length={6}
                />
              </AnimatedView>

              <VStack space="xl" className="mt-auto">
                <AnimatedView delay={300}>
                  <LoadingButton
                    variant="solid"
                    action="negative"
                    size="xl"
                    onPress={handleManagerPress}
                    loading={isActionInProgress}
                    loadingText="Verifying"
                    loadingCssClass="text-white"
                  >
                    <ButtonText>Verify</ButtonText>
                  </LoadingButton>
                </AnimatedView>

                <AnimatedView delay={400}>
                  <Button
                    variant="solid"
                    action="default"
                    size="xl"
                    onPress={handleBack}
                  >
                    <ButtonText>Back</ButtonText>
                  </Button>
                </AnimatedView>
              </VStack>
            </AnimatedCard>
          </LayoutAnimationConfig>
        )}
      </Animated.View>
    </Animated.ScrollView>
  );
}
