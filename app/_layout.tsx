import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  GlobalLoadingProvider,
  GlobalLoadingRegistrar,
} from "@/components/GlobalLoading";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { ChevronLeftIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import "@/global.css";
import { useAxiosWithRouter } from "@/hooks/custom-axios";
import { useColorScheme } from "@/hooks/useColorScheme";
import { NotificationProvider } from "@/hooks/useNotification";
import { TabBarProvider } from "@/hooks/useTabBar";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Image, Platform, StatusBar, StyleSheet } from "react-native";

export const ColorModeContext = React.createContext({});

// Component to initialize axios with notification context
const AxiosInitializer = () => {
  useAxiosWithRouter();
  return null;
};

const CustomBackButton = () => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        router.back();
      }}
      className="ios:ml-2 android:mr-4 web:ml-2"
    >
      <Icon as={ChevronLeftIcon} size="xl" className="text-white" />
    </Pressable>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    header: {
      backgroundColor: "transparent",
      color: "#fff",
    },
  });

  const getHeaderOptions = (title: string) => ({
    headerTitle: title,
    headerTintColor: "#fff",
    headerStyle: styles.header,
    headerBackground: () => (
      <Image
        source={require("@/assets/images/bg-login.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    ),
    ...(Platform.OS !== "android" && {
      headerLeft: () => <CustomBackButton />,
    }),
  });

  return (
    <ErrorBoundary>
      <StatusBar barStyle={"default"} backgroundColor="#fff" />
      <TabBarProvider>
        <ColorModeContext.Provider value={{ colorScheme }}>
          <GlobalLoadingProvider>
            <GlobalLoadingRegistrar />
            <GluestackUIProvider
              mode={colorScheme === "light" ? "light" : "dark"}
            >
              <NotificationProvider>
                <AxiosInitializer />
                <Stack screenOptions={{ animation: "slide_from_right" }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />

                  <Stack.Screen
                    name="(manager)/(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(manager)/view-activity/[id]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(manager)/scan-attendance/[id]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(manager)/update-attendance/[id]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(manager)/documents/[id]"
                    options={getHeaderOptions("Documents")}
                  />
                  <Stack.Screen
                    name="(manager)/manage-activity/[id]"
                    options={getHeaderOptions("Manage Activity")}
                  />

                  <Stack.Screen
                    name="(participant)/(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(participant)/view-activity/[id]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(participant)/scan-attendance/[id]"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </NotificationProvider>
            </GluestackUIProvider>
          </GlobalLoadingProvider>
        </ColorModeContext.Provider>
      </TabBarProvider>
    </ErrorBoundary>
  );
}
