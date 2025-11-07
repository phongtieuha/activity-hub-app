import {
  ActivityListItemDto,
  getById,
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
import { AnimatedView } from "@/constants/animation";
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
  View,
} from "react-native";

type ActivityListItemDtoExtended = ActivityListItemDto & {
  bookedASlot?: boolean;
  timeUntilEventDisplay?: string[];
};

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
    React.useState<ActivityListItemDtoExtended[]>([]);
  const [scheduledActivities, setScheduledActivities] = React.useState<
    ActivityListItemDtoExtended[]
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

      let scheduledActivities: ActivityListItemDtoExtended[] = [];
      let actionsRequiredActivities: ActivityListItemDtoExtended[] = [];

      const startSoonActivitiesResp = await list1({
        status: "PUBLISHED",
        timeline: "STARTING_SOON",
        pageNumber: 1,
        pageSize: 100,
      });
      actionsRequiredActivities = [
        ...actionsRequiredActivities,
        ...(startSoonActivitiesResp?.data ?? []),
      ];

      const ongoingActivitiesResp = await list1({
        status: "PUBLISHED",
        timeline: "ONGOING",
        pageNumber: 1,
        pageSize: 100,
      });
      scheduledActivities = [
        ...scheduledActivities,
        ...(ongoingActivitiesResp?.data ?? []),
      ];

      const scheduledActivitiesResp = await list1({
        status: "PUBLISHED",
        timeline: "UPCOMING",
        pageNumber: 1,
        pageSize: 100,
      });
      scheduledActivities = [
        ...scheduledActivities,
        ...(scheduledActivitiesResp?.data ?? []),
      ];

      for (const activity of [
        ...actionsRequiredActivities,
        ...scheduledActivities,
      ]) {
        const timeUntilEventDisplay = getTimeUntilEvent(
          getSGTDate(activity.startDate!),
          getCurrentSGTDate()
        );
        activity.timeUntilEventDisplay = timeUntilEventDisplay;
      }

      const todayActivities = scheduledActivities.filter((x) =>
        x.timeUntilEventDisplay?.includes("NOW")
      );

      actionsRequiredActivities = [
        ...actionsRequiredActivities,
        ...todayActivities,
      ];

      for (const activity of scheduledActivities) {
        const result = await getById(activity.activityId!);
        activity.bookedASlot = result.data?.slots?.some((x) => x.bookedByMe);
      }

      const notBookedActivities = scheduledActivities.filter(
        (x) => x.bookingWindowRequired && !x.bookedASlot
      );

      actionsRequiredActivities = [
        ...actionsRequiredActivities,
        ...notBookedActivities,
      ];

      setActionRequiredActivities(actionsRequiredActivities);

      setScheduledActivities((data) => [
        ...data,
        ...scheduledActivities.filter(
          (x) => !actionsRequiredActivities.includes(x)
        ),
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
    <>
      <View className="absolute inset-0 bg-gray-100"></View>

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

        <Divider className={`h-16 bg-transparent`} />

        <HStack space="lg" className="items-center px-4">
          <AnimatedView>
            <Image
              source={require("@/assets/images/splash-icon.png")}
              style={{
                width: 100,
                height: 50,
              }}
              contentFit="cover"
            />
          </AnimatedView>

          <AnimatedView delay={100} className="ml-auto">
            <Button
              variant="link"
              action="secondary"
              className=" rounded-full bg-white/90 px-2"
            >
              <ButtonIcon
                size="xl"
                as={SearchIcon}
                className="!size-6"
              ></ButtonIcon>
            </Button>
          </AnimatedView>

          <AnimatedView delay={200}>
            <Button
              variant="link"
              action="secondary"
              className="rounded-full bg-white/90 px-2"
            >
              <Box className="relative">
                <ButtonIcon as={BellIcon} className="!size-6"></ButtonIcon>
                <Box className="absolute right-1 top-0 h-1/5 w-1/5 rounded-full bg-red-600"></Box>
              </Box>
            </Button>
          </AnimatedView>
        </HStack>

        <Divider className={`h-4 bg-transparent`} />

        <AnimatedView delay={300}>
          <Box className="relative mx-4 overflow-hidden rounded-3xl">
            <Image
              source={require("@/assets/images/solider-background.png")}
              style={styles.reactLogo}
            />
            <Box className="absolute inset-0 size-full bg-black/30"></Box>
            <Box className="absolute left-8 top-4">
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

            <HStack className=" absolute bottom-4 left-0 w-full justify-around">
              <Button
                size="sm"
                variant="link"
                action="secondary"
                className="flex h-full flex-col "
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
                className="flex h-full flex-col"
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
                className="flex h-full flex-col"
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
                className="flex h-full flex-col"
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
        </AnimatedView>

        <Divider className={`h-4 bg-transparent`} />

        {isFetchingData ? (
          <VStack space="lg">
            <Card className="mx-4 overflow-hidden rounded-3xl bg-white p-4">
              <SkeletonText _lines={7} className="h-5 rounded-3xl" />
            </Card>

            <Card className="mx-4 overflow-hidden rounded-3xl bg-white p-4">
              <SkeletonText _lines={7} className="h-5 rounded-3xl" />
            </Card>
          </VStack>
        ) : (
          <>
            <AnimatedView delay={400}>
              {actionRequiredActivities.length > 0 ? (
                <VStack
                  space="md"
                  className="mx-4 overflow-hidden rounded-3xl bg-white p-4"
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
                      delay={cardFadeDelay * index}
                    >
                      <HStack className="items-start" space="md">
                        <Center className="w-[60px] rounded-3xl bg-gray-50 py-2">
                          {activity.timeUntilEventDisplay &&
                          activity.timeUntilEventDisplay.length < 3 ? (
                            <Text className="text-base font-bold text-red-600">
                              {activity.timeUntilEventDisplay.join(" ")}
                            </Text>
                          ) : activity.timeUntilEventDisplay ? (
                            <>
                              <Text className="text-sm font-bold text-gray-900">
                                {activity.timeUntilEventDisplay[0]}
                              </Text>
                              <Text className="text-3xl font-extrabold text-red-600">
                                {activity.timeUntilEventDisplay[1]}
                              </Text>
                              <Text className="text-sm font-bold text-gray-900">
                                {activity.timeUntilEventDisplay[2]}
                              </Text>
                            </>
                          ) : null}
                        </Center>

                        {/* <DotIcon style={{ marginTop: 10 }} color="#4b5563" /> */}

                        <VStack space="xl" className="flex-1">
                          <ActionRequiredCard
                            actionText={
                              activity.bookedASlot
                                ? "Register attendance"
                                : "Book a Slot"
                            }
                            activity={activity}
                            onPress={() =>
                              router.push(
                                `../view-activity/${activity.activityId}`
                              )
                            }
                          />
                          {index ===
                          displayedActionRequiredActivities.length -
                            1 ? null : (
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
                  className="mx-4 overflow-hidden rounded-3xl bg-white p-4"
                >
                  <BadgeText>
                    No activities that require your attention!
                  </BadgeText>
                </Badge>
              )}
            </AnimatedView>

            <Divider className={`h-4 bg-transparent`} />

            <AnimatedView delay={500}>
              {!!scheduledActivities.length ? (
                <View>
                  <VStack
                    space="xl"
                    className="mx-4 overflow-hidden rounded-3xl bg-white p-4"
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

                            <DotIcon
                              style={{ marginTop: 18 }}
                              color="#4b5563"
                            />

                            <VStack space="xl" className="flex-1">
                              {activities.map((activity, index) => (
                                <ScheduledCard
                                  key={
                                    "scheduledcard" +
                                    activity.activityId +
                                    index
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
                </View>
              ) : (
                <Badge
                  action="muted"
                  size="lg"
                  className="mx-4 overflow-hidden rounded-3xl bg-white p-4"
                >
                  <BadgeText>No scheduled activities!</BadgeText>
                </Badge>
              )}
            </AnimatedView>
          </>
        )}

        <Divider className={`h-28 bg-transparent`} />
      </ScrollView>
    </>
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
