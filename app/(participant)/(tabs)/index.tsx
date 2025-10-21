import {
  ActivityListItemDto,
  getMe,
  list1,
  UserDto,
} from "@/__generated-client/http-client-integration";
import ActionRequiredCard from "@/components/app/ActionRequiredCard";
import ScheduledCard from "@/components/app/ScheduledCard";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  formatDay,
  formatDayInWord,
  formatMonth,
  getCurrentSGTDate,
  getSGTDate,
  getTimeUntilEvent,
  groupActivitiesByDateRangeOrdered,
} from "@/hooks/date-formatter";
import { useScroll } from "@/hooks/useScroll";
import { useTabBar } from "@/hooks/useTabBar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  BellIcon,
  ChevronRightIcon,
  DotIcon,
  SearchIcon,
} from "lucide-react-native";
import React, { useDeferredValue, useRef } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";

export default function HomeScreen() {
  // 1) Navigation & utilities
  const router = useRouter();

  const { setTabBarBottom, tabBarBottom } = useTabBar();

  const { detectScroll } = useScroll();
  const lastOffsetY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    detectScroll(
      lastOffsetY,
      event,
      () => setTabBarBottom(0),
      () => setTabBarBottom(-100)
    );
  };

  // 2) UI & data state
  const [refreshing, setRefreshing] = React.useState(false);
  const [isFetchingData, setIsFetchingData] = React.useState(false);
  const [loggedInDetails, setLoggedInDetails] = React.useState<UserDto>();
  const [actionRequiredActivities, setActionRequiredActivities] =
    React.useState<ActivityListItemDto[]>([]);
  const [scheduledActivities, setScheduledActivities] = React.useState<
    ActivityListItemDto[]
  >([]);
  const [showAllActionRequired, setShowAllActionRequired] =
    React.useState(false);
  const [showAllScheduled, setShowAllScheduled] = React.useState(false);
  // Use useDeferredValue for smooth animations
  const deferredShowAll = useDeferredValue(showAllActionRequired);

  // Compute displayed activities based on deferred value
  const displayedActionRequiredActivities = React.useMemo(() => {
    return deferredShowAll
      ? actionRequiredActivities
      : actionRequiredActivities.slice(0, 2);
  }, [deferredShowAll, actionRequiredActivities]);

  const scheduledActivitesGroupedByDateOrderedByDateKey = React.useMemo(
    () =>
      groupActivitiesByDateRangeOrdered<ActivityListItemDto>(
        scheduledActivities
      ),
    [scheduledActivities]
  );

  const deferredShowAllScheduled = useDeferredValue(showAllScheduled);
  const displayedScheduledActivitiesGrouped = React.useMemo(() => {
    const entries = Object.entries(
      scheduledActivitesGroupedByDateOrderedByDateKey
    );
    const slicedEntries = deferredShowAllScheduled
      ? entries
      : entries.slice(0, 3);
    return Object.fromEntries(slicedEntries);
  }, [
    scheduledActivitesGroupedByDateOrderedByDateKey,
    deferredShowAllScheduled,
  ]);

  // 3) Data fetching
  const fetchData = React.useCallback(async () => {
    setIsFetchingData(true);
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
      setActionRequiredActivities((data) => [
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
      setIsFetchingData(false);
    }
  }, []);

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
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <StatusBar barStyle={"default"} backgroundColor="#fff" />

      <Divider className={`bg-transparent h-16`} />

      <HStack space="lg" className="px-4 items-center">
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={{
            width: 100,
            height: 50,
          }}
          contentFit="cover"
        />

        <Button
          variant="link"
          action="secondary"
          className="bg-white/90 rounded-full px-2 ml-auto"
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

      <Divider className={`bg-transparent h-4`} />

      <Box className="relative mx-4 rounded-3xl overflow-hidden">
        <Image
          source={require("@/assets/images/solider-background.png")}
          style={styles.reactLogo}
        />
        <Box className="bg-black/30 absolute inset-0 size-full"></Box>
        <Box className="absolute top-4 left-8">
          <Heading size="lg" className="text-red-600">
            HELLO!
          </Heading>
          <Heading size="xl" className="text-white">
            {loggedInDetails?.name?.split(" ")[0]},
          </Heading>
          <Heading size="xl" className="text-white">
            {loggedInDetails?.name?.split(" ").slice(1).join(" ")}
          </Heading>
        </Box>

        <HStack className=" justify-around absolute bottom-4 left-0 w-full">
          <Button
            size="sm"
            variant="link"
            action="secondary"
            className="flex flex-col h-full "
          >
            <Image
              source={require("@/assets/images/icon-helmet.png")}
              style={{
                height: 36,
                width: 36,
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
                height: 36,
                width: 36,
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
                height: 36,
                width: 36,
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
                height: 36,
                width: 36,
              }}
            />
            <ButtonText className="text-gray-300">eMart</ButtonText>
          </Button>
        </HStack>
      </Box>

      <Divider className={`bg-transparent h-4`} />

      {isFetchingData ? (
        <VStack space="lg">
          <Card className="bg-white mx-4 p-4 rounded-3xl overflow-hidden">
            <SkeletonText _lines={7} className="h-5 rounded-3xl" />
          </Card>

          <Card className="bg-white mx-4 p-4 rounded-3xl overflow-hidden">
            <SkeletonText _lines={7} className="h-5 rounded-3xl" />
          </Card>
        </VStack>
      ) : (
        <>
          {actionRequiredActivities.length > 0 ? (
            <VStack
              space="md"
              className="bg-white mx-4 p-4 rounded-3xl overflow-hidden"
            >
              <HStack space="md" className="items-center">
                <Heading size="lg">Actions required</Heading>
                <Badge action="error" size="lg" className="rounded-full">
                  <BadgeText>{actionRequiredActivities.length}</BadgeText>
                </Badge>
                <Button
                  action="negative"
                  variant="link"
                  className="ml-auto"
                  size="sm"
                  onPress={() =>
                    setShowAllActionRequired(!showAllActionRequired)
                  }
                >
                  <ButtonText>
                    {showAllActionRequired ? "Show Less" : "See All"}
                  </ButtonText>
                  <ButtonIcon as={ChevronRightIcon} />
                </Button>
              </HStack>

              {displayedActionRequiredActivities.map((activity, index) => (
                <AnimatedCard
                  key={"actioncard" + activity.activityId + index}
                  delay={cardFadeDelay}
                >
                  <HStack className="items-start" space="md">
                    <Center className="rounded-3xl w-[60px]  bg-gray-50 mt-3">
                      <Text className="text-base font-bold text-red-600">
                        {getTimeUntilEvent(
                          getSGTDate(activity.startDate!),
                          getCurrentSGTDate()
                        )}
                      </Text>
                    </Center>

                    {/* <DotIcon style={{ marginTop: 10 }} color="#4b5563" /> */}

                    <VStack space="xl" className="flex-1">
                      <ActionRequiredCard
                        actionText="Register attendance"
                        activity={activity}
                        onPress={() =>
                          router.push(`../view-activity/${activity.activityId}`)
                        }
                      />
                      {index ===
                      displayedActionRequiredActivities.length - 1 ? null : (
                        <Divider
                          className="bg-transparent"
                          style={{ height: 1 }}
                        />
                      )}
                    </VStack>
                  </HStack>

                  {index ===
                  displayedActionRequiredActivities.length - 1 ? null : (
                    <Divider className="" style={{ height: 1 }} />
                  )}
                </AnimatedCard>
              ))}
            </VStack>
          ) : (
            <Badge
              action="muted"
              size="lg"
              className="bg-white mx-4 p-4 rounded-3xl overflow-hidden"
            >
              <BadgeText>No activities that require your attention!</BadgeText>
            </Badge>
          )}

          <Divider className={`bg-transparent h-4`} />

          {!!scheduledActivities.length ? (
            <AnimatedCard delay={cardFadeDelay * 3}>
              <VStack
                space="xl"
                className="bg-white mx-4 p-4 rounded-3xl overflow-hidden"
              >
                <HStack space="md" className="items-center">
                  <Heading size="lg">Scheduled</Heading>
                  <Badge action="error" size="lg" className="rounded-full">
                    <BadgeText>{scheduledActivities.length}</BadgeText>
                  </Badge>
                  <Button
                    action="negative"
                    variant="link"
                    className="ml-auto"
                    size="sm"
                    onPress={() => setShowAllScheduled(!showAllScheduled)}
                  >
                    <ButtonText>
                      {showAllScheduled ? "Show Less" : "See All"}
                    </ButtonText>
                    <ButtonIcon as={ChevronRightIcon} />
                  </Button>
                </HStack>

                {Object.entries(displayedScheduledActivitiesGrouped).map(
                  ([date, activities], i) => (
                    <VStack space="xl" key={date}>
                      <HStack className="items-start">
                        <VStack space="xs">
                          <Box className="py-3">
                            <VStack className="items-start justify-start">
                              <Text className="text-base font-bold text-gray-900">
                                {formatDay(date)} {formatMonth(date)}
                              </Text>
                              <Text className="text-center text-gray-600">
                                {formatDayInWord(date)}
                              </Text>
                            </VStack>
                          </Box>
                        </VStack>

                        <DotIcon style={{ marginTop: 18 }} color="#4b5563" />

                        <VStack space="xl" className="flex-1">
                          {activities.map((activity, index) => (
                            <ScheduledCard
                              key={
                                "scheduledcard" + activity.activityId + index
                              }
                              activity={activity}
                              onPress={() =>
                                router.push(
                                  `../view-activity/${activity.activityId}`
                                )
                              }
                            ></ScheduledCard>
                          ))}
                        </VStack>
                      </HStack>

                      {i ===
                      Object.entries(displayedScheduledActivitiesGrouped)
                        .length -
                        1 ? null : (
                        <Divider className="" style={{ height: 1 }} />
                      )}
                    </VStack>
                  )
                )}
              </VStack>
            </AnimatedCard>
          ) : (
            <Badge
              action="muted"
              size="lg"
              className="bg-white mx-4 p-4 rounded-3xl overflow-hidden"
            >
              <BadgeText>No scheduled activities!</BadgeText>
            </Badge>
          )}
        </>
      )}

      <Divider
        className={`bg-transparent`}
        style={{ height: Math.abs(tabBarBottom) }}
      />
    </ScrollView>
  );
}

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  reactLogo: {
    height: screenHeight * 0.2,
    width: screenWidth,
  },
});
