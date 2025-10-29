import { HapticTab } from "@/components/HapticTab";
import { Icon } from "@/components/ui/icon";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBar } from "@/hooks/useTabBar";
import { Tabs } from "expo-router";
import {
  FolderIcon,
  HomeIcon,
  ListIcon,
  UserCogIcon,
} from "lucide-react-native";
import { Platform } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { tabBarBottom } = useTabBar();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
            width: "70%",
            height: 55,
            marginBottom: 20,
            marginLeft: "15%",
            borderColor: "transparent",
            bottom: tabBarBottom,

            shadowColor: "#222",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 12,
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Icon as={HomeIcon} color={color} />,
        }}
      />
      <Tabs.Screen
        name="page2"
        options={{
          title: "Page",
          tabBarIcon: ({ color }) => <Icon as={ListIcon} color={color} />,
        }}
      />
      <Tabs.Screen
        name="page3"
        options={{
          title: "Page",
          tabBarIcon: ({ color }) => <Icon as={FolderIcon} color={color} />,
        }}
      />
      <Tabs.Screen
        name="page4"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Icon as={UserCogIcon} color={color} />,
        }}
      />
    </Tabs>
  );
}
