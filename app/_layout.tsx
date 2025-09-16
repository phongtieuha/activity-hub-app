import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  GlobalLoadingProvider,
  GlobalLoadingRegistrar,
} from "@/components/GlobalLoading";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { ChevronLeftIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import "@/global.css";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Image, Platform, StatusBar, StyleSheet } from "react-native";
import "react-native-reanimated";

export const ColorModeContext = React.createContext({});

const CustomBackButton = () => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        router.back();
      }}
      className="web:ml-2 ios:-ml-2 android:mr-4"
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
        source={require("@/assets/images/bg-header.jpg")}
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
      <ColorModeContext.Provider value={{ colorScheme }}>
        <GlobalLoadingProvider>
          <GlobalLoadingRegistrar />
          <GluestackUIProvider
            mode={colorScheme === "light" ? "light" : "dark"}
          >
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
          </GluestackUIProvider>
        </GlobalLoadingProvider>
      </ColorModeContext.Provider>
    </ErrorBoundary>
  );
}
