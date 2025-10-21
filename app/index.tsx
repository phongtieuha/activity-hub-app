import {
  login,
  verifyLogin,
} from "@/__generated-client/http-client-integration";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
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
import {
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

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
  const [selectedOTP, setSelectedOTP] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState("");
  const [selectedManager, setSelectedManager] = React.useState("");
  const [loginAttemptId, setLoginAttemptId] = React.useState("");
  const [loggedInAs, setLoggedInAs] = React.useState<
    "participant" | "manager"
  >();
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
  const marginAnim = useRef(new Animated.Value(0)).current;

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

  // --- Handlers ---
  const handleParticipantPress = async () => {
    Keyboard.dismiss();
    // setLoggedInAs("participant");
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
  };

  const handleManagerPress = async () => {
    Keyboard.dismiss();
    // setLoggedInAs("manager");
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
  };

  const handleBack = () => {
    setIsOTPShown(false);
    setSelectedOTP("");
    setLoginAttemptId("");
    setLoggedInAs(undefined);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardWillShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(marginAnim, {
      toValue: isKeyboardVisible ? 30 : 60,
      duration: 250,
      useNativeDriver: false, // must be false for margin
    }).start();
  }, [isKeyboardVisible, marginAnim]);

  const screenHeight = Dimensions.get("window").height;
  const heroImageHeight = marginAnim.interpolate({
    inputRange: [30, 60],
    outputRange: [0.3 * screenHeight, 0.6 * screenHeight], // 30% to 60% of screen height
  });

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Animated.View
        style={{ height: heroImageHeight, width: "100%" }}
        className="rounded-tr-3xl rounded-tl-3xl overflow-hidden"
      >
        <Center style={{ flex: 1 }}>
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
                resizeMode="contain"
              />
            </Center>
          </ImageBackground>
        </Center>
      </Animated.View>

      <AnimatedCard
        key={"chooseLogin"}
        className="rounded-3xl p-4 gap-4 -mt-7 bg-white flex-1"
      >
        <Divider className="h-1 bg-transparent" />
        {!loggedInAs && (
          <>
            <Heading size="lg">OneNS. Supporting Your NS Experience.</Heading>
            <Text>
              Get practical support and reliable information to help you through
              every stage of your NS journey.
            </Text>

            <HStack space="xl" className="mt-auto">
              <Pressable
                onPress={() => setLoggedInAs("participant")}
                className="flex-1 border border-gray-300 rounded-3xl flex flex-col p-4 items-center justify-center gap-3"
              >
                <Center className="rounded-full bg-red-600 p-2">
                  <User2Icon color="white" />
                </Center>
                <Text className="font-semibold">Login as Participant</Text>
              </Pressable>
              <Pressable
                onPress={() => setLoggedInAs("manager")}
                className="flex-1 border border-gray-300 rounded-3xl flex flex-col p-4 items-center justify-center gap-3"
              >
                <Center className="rounded-full bg-red-600 p-2">
                  <SquareUserRoundIcon color="white" />
                </Center>
                <Text className="font-semibold">Login as Manager</Text>
              </Pressable>
            </HStack>
          </>
        )}

        {!isOTPShown && loggedInAs === "participant" && (
          <>
            <Heading size="lg">Login as Participant</Heading>
            <Text>Manage your national service matters.</Text>

            <Select
              selectedValue={selectedUser}
              onValueChange={(nric) => {
                setSelectedUser(nric);
              }}
              className="mt-auto"
            >
              <SelectTrigger variant="outline" size="md" className="bg-white">
                <SelectInput placeholder="Select option" />
                <SelectIcon className="ml-auto mr-2" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />

                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>

                  <SelectScrollView className="pt-12">
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

            <VStack space="xl" className="mt-auto">
              <Button
                variant="solid"
                action="negative"
                size="xl"
                onPress={handleParticipantPress}
              >
                <ButtonText className="text-center">Login</ButtonText>
              </Button>

              <Button
                variant="solid"
                action="default"
                size="xl"
                onPress={() => setLoggedInAs(undefined)}
              >
                <ButtonText>Back</ButtonText>
              </Button>
            </VStack>
          </>
        )}

        {!isOTPShown && loggedInAs === "manager" && (
          <>
            <Heading size="lg">Login as Manager</Heading>
            <Text>Manage your national service matters.</Text>

            <Select
              selectedValue={selectedManager}
              onValueChange={(nric) => setSelectedManager(nric)}
              className="mt-auto"
            >
              <SelectTrigger variant="outline" size="md" className="bg-white">
                <SelectInput placeholder="Select option" />
                <SelectIcon className="ml-auto mr-2" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />

                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>

                  <SelectScrollView className="pt-12">
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

            <VStack space="xl" className="mt-auto">
              <Button
                variant="solid"
                action="negative"
                size="xl"
                onPress={handleManagerPress}
              >
                <ButtonText>Login</ButtonText>
              </Button>

              <Button
                variant="solid"
                action="default"
                size="xl"
                onPress={() => setLoggedInAs(undefined)}
              >
                <ButtonText>Back</ButtonText>
              </Button>
            </VStack>
          </>
        )}

        {isOTPShown && loggedInAs === "participant" && (
          <>
            <Heading size="lg">Verify OTP</Heading>
            <Box>
              <Text className="m-0 p-0">
                We sent an OTP to{" "}
                <Text className="font-bold">{selectedUser}</Text>.
              </Text>
              <Text>Enter it below to continue.</Text>
            </Box>

            <OTPInput
              value={selectedOTP}
              onChangeText={setSelectedOTP}
              length={6}
              className="mt-auto"
            />

            <VStack space="xl" className="mt-auto">
              <Button
                variant="solid"
                action="negative"
                size="xl"
                onPress={handleParticipantPress}
              >
                <ButtonText>Verify</ButtonText>
              </Button>
              <Button
                variant="solid"
                action="default"
                size="xl"
                onPress={handleBack}
              >
                <ButtonText>Back</ButtonText>
              </Button>
            </VStack>
          </>
        )}
        {isOTPShown && loggedInAs === "manager" && (
          <>
            <Heading size="lg">Verify OTP</Heading>
            <Box>
              <Text className="m-0 p-0">
                We sent an OTP to{" "}
                <Text className="font-bold">{selectedManager}</Text>.
              </Text>
              <Text>Enter it below to continue.</Text>
            </Box>
            <OTPInput
              value={selectedOTP}
              onChangeText={setSelectedOTP}
              length={6}
              className="mt-auto"
            />
            <VStack space="xl" className="mt-auto">
              <Button
                variant="solid"
                action="negative"
                size="xl"
                onPress={handleManagerPress}
              >
                <ButtonText>Verify</ButtonText>
              </Button>
              <Button
                variant="solid"
                action="default"
                size="xl"
                onPress={handleBack}
              >
                <ButtonText>Back</ButtonText>
              </Button>
            </VStack>
          </>
        )}

        <Divider className="h-5 bg-transparent" />
      </AnimatedCard>

      {isKeyboardVisible && <Divider className="h-1/3 bg-transparent" />}
    </ScrollView>
  );
}
