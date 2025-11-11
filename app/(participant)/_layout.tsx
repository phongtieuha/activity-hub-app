import { Stack } from "expo-router";
import { ParticipantProvider } from "./context";

const getHeaderBackButton = () => ({
  headerShown: true,
  headerTitle: "",
  headerTransparent: true,
  headerStyle: {
    backgroundColor: "transparent",
  },
});

export default function ParticipantLayout() {
  return (
    <ParticipantProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={getHeaderBackButton()} />
        <Stack.Screen
          name="view-activity/[id]"
          options={getHeaderBackButton()}
        />
        <Stack.Screen
          name="scan-attendance/[id]"
          options={{
            animation: "fade_from_bottom",
            ...getHeaderBackButton(),
          }}
        />
      </Stack>
    </ParticipantProvider>
  );
}
