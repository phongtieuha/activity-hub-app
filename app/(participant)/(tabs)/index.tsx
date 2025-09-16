import {
  ActivityListItemDto,
  getMe,
  list1,
  UserDto,
} from "@/__generated-client/http-client-integration";
import ActionRequiredCard from "@/components/app/ActionRequiredCard";
import ScheduledCard from "@/components/app/ScheduledCard";
import { useGlobalLoading } from "@/components/GlobalLoading";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BellIcon, SearchIcon } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";

export default function HomeScreen() {
  // 1) Navigation & utilities
  const router = useRouter();
  const tabbarHeight = useBottomTabOverflow();
  const loading = useGlobalLoading();

  // 2) UI & data state
  const [refreshing, setRefreshing] = React.useState(false);
  const [loggedInDetails, setLoggedInDetails] = React.useState<UserDto>();
  const [actionRequiredActivities, setActionRequiredActivities] =
    React.useState<ActivityListItemDto[]>([]);
  const [scheduledActivities, setScheduledActivities] = React.useState<
    ActivityListItemDto[]
  >([]);

  // 3) Data fetching
  const fetchData = React.useCallback(async () => {
    loading.show("Loading activities...");
    try {
      const loginDetails = await getMe();
      setLoggedInDetails(loginDetails);

      setActionRequiredActivities([]);
      setScheduledActivities([]);

      const startSoonActivitiesResp = await list1({
        status: "PUBLISHED",
        timeline: "STARTING_SOON",
        pageNumber: 1,
        pageSize: 100,
      });
      setActionRequiredActivities(startSoonActivitiesResp?.data ?? []);

      const ongoingActivitiesResp = await list1({
        status: "PUBLISHED",
        timeline: "ONGOING",
        pageNumber: 1,
        pageSize: 100,
      });
      setScheduledActivities((data) => [
        ...data,
        ...(ongoingActivitiesResp?.data ?? []),
      ]);

      const scheduledActivitiesResp = await list1({
        status: "PUBLISHED",
        timeline: "UPCOMING",
        pageNumber: 1,
        pageSize: 100,
      });
      setScheduledActivities((data) => [
        ...data,
        ...(scheduledActivitiesResp?.data ?? []),
      ]);
    } finally {
      loading.hide();
    }
  }, [loading]);

  // 4) Effects
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 5) Refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#e11d48"
          colors={["#e11d48", "#fff"]}
          progressBackgroundColor="#222"
        />
      }
    >
      <StatusBar barStyle={"default"} backgroundColor="#fff" />
      <Box className="relative">
        <Image
          source={require("@/assets/images/solider-background.png")}
          style={styles.reactLogo}
        />
        <Box className="bg-black/30 absolute inset-0 size-full"></Box>
        <Box className="absolute top-14 left-4">
          <Heading size="lg" className="text-red-600">
            HELLO!
          </Heading>
          <Heading size="xl" className="text-white">
            {loggedInDetails?.name.split(" ")[0]},
          </Heading>
          <Heading size="xl" className="text-white">
            {loggedInDetails?.name.split(" ").slice(1).join(" ")}
          </Heading>
        </Box>
        <HStack space="2xl" className="absolute top-12 right-4">
          <Button
            variant="link"
            action="secondary"
            className="bg-white/90 rounded-full px-2"
          >
            <ButtonIcon
              size="xl"
              as={SearchIcon}
              className="!size-6"
            ></ButtonIcon>
          </Button>

          <Button
            variant="link"
            action="secondary"
            className="bg-white/90 rounded-full px-2"
          >
            <Box className="relative">
              <ButtonIcon as={BellIcon} className="!size-6"></ButtonIcon>
              <Box className="rounded-full bg-red-600 w-1/5 h-1/5 absolute right-1 top-0"></Box>
            </Box>
          </Button>
        </HStack>
        <HStack className=" justify-around absolute bottom-0 left-0 w-full h-1/3">
          <Button
            size="sm"
            variant="link"
            action="secondary"
            className="flex flex-col h-full "
          >
            <Image
              source={require("@/assets/images/icon-helmet.png")}
              style={{
                height: 48,
                width: 48,
              }}
            />
            <ButtonText className="text-gray-300">ICT</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="link"
            action="secondary"
            className="flex flex-col h-full"
          >
            <Image
              source={require("@/assets/images/icon-running.png")}
              style={{
                height: 48,
                width: 48,
              }}
            />
            <ButtonText className="text-gray-300">IPPT/NS FIT</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="link"
            action="secondary"
            className="flex flex-col h-full"
          >
            <Image
              source={require("@/assets/images/icon-gun.png")}
              style={{
                height: 48,
                width: 48,
              }}
            />
            <ButtonText className="text-gray-300">Manning</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="link"
            action="secondary"
            className="flex flex-col h-full"
          >
            <Image
              source={require("@/assets/images/icon-sockets.png")}
              style={{
                height: 48,
                width: 48,
              }}
            />
            <ButtonText className="text-gray-300">eMart</ButtonText>
          </Button>
        </HStack>
      </Box>

      <VStack space="md" className="bg-red-500 p-4">
        <HStack space="md">
          <Heading size="lg" className="text-white">
            Actions required
          </Heading>
          <Badge className="rounded-lg px-3">
            <Text>{actionRequiredActivities.length}</Text>
          </Badge>
        </HStack>
        {/* AnimatedCard wrapper for progressive fade-in animation */}
        {actionRequiredActivities.map((activity) => (
          <AnimatedCard key={activity.activityId} delay={cardFadeDelay}>
            <ActionRequiredCard
              actionText="Register my attendance"
              key={activity.activityId}
              activity={activity}
              onPress={() =>
                router.push(`../view-activity/${activity.activityId}`)
              }
            />
          </AnimatedCard>
        ))}
      </VStack>

      <AnimatedCard delay={cardFadeDelay * 3}>
        <VStack space="md" className="p-4">
          <Heading size="lg">Scheduled ({scheduledActivities.length})</Heading>
          {scheduledActivities.map((activity) => (
            <ScheduledCard
              key={activity.activityId}
              activity={activity}
              onPress={() =>
                router.push(`../view-activity/${activity.activityId}`)
              }
            ></ScheduledCard>
          ))}
        </VStack>
      </AnimatedCard>

      <Divider className={`bg-transparent`} style={{ height: tabbarHeight }} />
    </ScrollView>
  );
}

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  reactLogo: {
    height: screenHeight * 0.3,
    width: screenWidth,
  },
});
