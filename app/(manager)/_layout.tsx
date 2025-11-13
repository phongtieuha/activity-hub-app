import { Icon } from "@/components/ui/icon";
import { Stack, useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { Image, Pressable } from "react-native";

const CustomBackButton = () => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        router.back();
      }}
      className="ios:ml-2 android:mr-4 web:ml-2"
    >
      <Icon as={ChevronLeftIcon} size="xl" />
    </Pressable>
  );
};

const getHeaderBackButton = () => ({
  headerShown: true,
  headerTitle: "",
  headerTransparent: true,
  //   headerStyle: {
  //     backgroundColor: "transparent",
  //   },
  // headerLeft: () => <CustomBackButton />,
});

const getHeaderOptions = (title: string) => ({
  ...getHeaderBackButton(),
  headerTitle: title,
  headerTintColor: "white",
  headerBackground: () => (
    <Image
      source={require("@/assets/images/bg-login.png")}
      style={{ width: "100%", height: "100%" }}
      resizeMode="cover"
    />
  ),
});

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={getHeaderBackButton()} />
      <Stack.Screen name="view-activity/[id]" options={getHeaderBackButton()} />
      <Stack.Screen
        name="scan-attendance/[id]"
        options={{
          animation: "fade_from_bottom",
          ...getHeaderBackButton(),
        }}
      />
      <Stack.Screen
        name="update-attendance/[id]"
        options={{
          ...getHeaderBackButton(),
          headerTitle: "Update Attendance",
          headerTintColor: "white",
        }}
      />
      <Stack.Screen
        name="documents/[id]"
        options={getHeaderOptions("Documents")}
      />
      <Stack.Screen
        name="manage-activity/[id]"
        options={getHeaderOptions("Manage Activity")}
      />
    </Stack>
  );
}
