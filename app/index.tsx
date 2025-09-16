import {
  login,
  verifyLoginMobile,
} from "@/__generated-client/http-client-integration";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
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
import { VStack } from "@/components/ui/vstack";
import { participantUsers } from "@/constants/loginUsers";
import { managerUsers } from "@/constants/loginUsers-managers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ChevronDownIcon } from "lucide-react-native";
import React, { useEffect } from "react";
import { Image, Keyboard, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    setLoggedInAs("participant");
    if (isOTPShown) {
      const result = await verifyLoginMobile({
        loginAttemptId: loginAttemptId,
        code: selectedOTP,
      });
      await AsyncStorage.setItem("AUTH_TOKEN", result?.token ?? "");
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
    setLoggedInAs("manager");
    if (isOTPShown) {
      const result = await verifyLoginMobile({
        loginAttemptId: loginAttemptId,
        code: selectedOTP,
      });
      await AsyncStorage.setItem("AUTH_TOKEN", result?.token ?? "");
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={{ width: "100%", height: 150 }}
          resizeMode="contain"
        />

        {isOTPShown && loggedInAs === "participant" && (
          <VStack space="4xl">
            <Input>
              <InputField
                keyboardType="numeric"
                value={selectedOTP}
                onChangeText={setSelectedOTP}
                placeholder="Enter OTP"
              />
            </Input>
            <Button
              variant="solid"
              action="primary"
              size="xl"
              onPress={handleParticipantPress}
            >
              <ButtonText>Login</ButtonText>
            </Button>
            <Button
              variant="solid"
              action="secondary"
              size="xl"
              onPress={handleBack}
            >
              <ButtonText>Back</ButtonText>
            </Button>
          </VStack>
        )}
        {isOTPShown && loggedInAs === "manager" && (
          <VStack space="4xl">
            <Input>
              <InputField
                keyboardType="numeric"
                value={selectedOTP}
                onChangeText={setSelectedOTP}
                placeholder="Enter OTP"
              />
            </Input>
            <Button
              variant="solid"
              action="primary"
              size="xl"
              onPress={handleManagerPress}
            >
              <ButtonText>Login</ButtonText>
            </Button>
            <Button
              variant="solid"
              action="secondary"
              size="xl"
              onPress={handleBack}
            >
              <ButtonText>Back</ButtonText>
            </Button>
          </VStack>
        )}

        {!isOTPShown && (
          <VStack space="4xl">
            <Select
              selectedValue={selectedUser}
              onValueChange={(nric) => {
                setSelectedUser(nric);
              }}
            >
              <SelectTrigger variant="outline" size="md">
                <SelectInput placeholder="Select option" />
                <SelectIcon className="ml-auto mr-2" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SafeAreaView>
                  <SelectContent>
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
                </SafeAreaView>
              </SelectPortal>
            </Select>
            <Button
              variant="solid"
              action="primary"
              size="xl"
              onPress={handleParticipantPress}
            >
              <ButtonText>Login as Participant</ButtonText>
            </Button>

            <Divider className="my-10" />

            <Select
              selectedValue={selectedManager}
              onValueChange={(nric) => setSelectedManager(nric)}
            >
              <SelectTrigger variant="outline" size="md">
                <SelectInput placeholder="Select option" />
                <SelectIcon className="ml-auto mr-2" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SafeAreaView>
                  <SelectContent>
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
                </SafeAreaView>
              </SelectPortal>
            </Select>

            <Button
              variant="solid"
              action="primary"
              size="xl"
              onPress={handleManagerPress}
            >
              <ButtonText>Login as Manager</ButtonText>
            </Button>
          </VStack>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
