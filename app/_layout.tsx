import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  GlobalLoadingProvider,
  GlobalLoadingRegistrar,
} from "@/components/GlobalLoading";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { useAxiosWithRouter } from "@/hooks/custom-axios";
import { useColorScheme } from "@/hooks/useColorScheme";
import { NotificationProvider } from "@/hooks/useNotification";
import { TabBarProvider } from "@/hooks/useTabBar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { StatusBar } from "react-native";

export const ColorModeContext = React.createContext({});

SplashScreen.setOptions({
  duration: 600,
  fade: true,
});

// Component to initialize axios with notification context
const AxiosInitializer = () => {
  useAxiosWithRouter();
  return null;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
                  <Stack.Screen
                    name="logout"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="+not-found"
                    options={{ headerShown: false }}
                  />

                  <Stack.Screen
                    name="(manager)"
                    options={{ headerShown: false }}
                  />

                  <Stack.Screen
                    name="(participant)"
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
