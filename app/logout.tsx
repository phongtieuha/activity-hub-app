import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    const logout = async () => {
      await AsyncStorage.removeItem("AUTH_TOKEN");
      // Redirect to your desired initial route
      router.replace("/");
    };
    logout();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 40,
      }}
    ></View>
  );
}
