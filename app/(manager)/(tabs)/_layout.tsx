import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={Colors[colorScheme ?? "light"].tint}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="page2">
        <Icon sf="list.bullet" drawable="custom_settings_drawable" />
        <Label>Page</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="page3">
        <Icon sf="folder" drawable="custom_settings_drawable" />
        <Label>Page</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="page4">
        <Icon sf="gear" drawable="custom_settings_drawable" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
