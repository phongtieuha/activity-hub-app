import {
  ActivityResponseDto,
  ActivitySlotDto,
  generateQr,
  getById,
} from "@/__generated-client/http-client-integration";
import CalendarScreen from "@/components/app/Calendar";
import DetailsCard from "@/components/app/DetailsCard";
import MinimalTimeline from "@/components/app/MinimalTimeline";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { RadioGroup } from "@/components/ui/radio";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  differenceInMinutes,
  formatDate,
  formatDayInWord,
  formatSlotTime,
  getCurrentSGTDate,
  getSGTDate,
  groupActivitiesByDateRangeOrdered,
} from "@/hooks/date-formatter";
import * as Brightness from "expo-brightness";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeftIcon,
  FileIcon,
  LoaderIcon,
  PencilLineIcon,
  ScrollTextIcon,
} from "lucide-react-native";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
} from "react-native";

const ViewActivity = () => {
  // 1) Navigation & globals
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 2) Refs (device brightness)
  const originalBrightnessRef = React.useRef<number | null>(null);

  // 3) UI state
  const [refreshing, setRefreshing] = React.useState(false);
  const [isFetchingData, setIsFetchingData] = React.useState(false);
  const [showQRActionsheet, setShowQRActionsheet] = React.useState(false);

  // 4) Data state
  const [activityDetails, setActivityDetails] =
    React.useState<ActivityResponseDto>();

  // 5) QR-related state
  const [qrBase64String, setQrBase64String] = React.useState("");
  const [qrExpiry, setQrExpiry] = React.useState<string | null>(null);
  const [isQrRefreshing, setIsQrRefreshing] = React.useState(false);

  const [showBookingSheet, setShowBookingSheet] = React.useState(false);
  const [selectedSlots, setSelectedSlots] = React.useState<ActivitySlotDto>();
  const [selectedBookingDate, setSelectedBookingDate] =
    React.useState<string>();

  const bookingSlotsGroupedByDateOrderedByDateKey = React.useMemo(() => {
    return groupActivitiesByDateRangeOrdered<ActivitySlotDto>(
      activityDetails?.slots || []
    );
  }, [activityDetails]);

  const enabledDates = React.useMemo(() => {
    return Object.keys(bookingSlotsGroupedByDateOrderedByDateKey);
  }, [bookingSlotsGroupedByDateOrderedByDateKey]);

  const handlepOpenBookingSheet = () => {
    setShowBookingSheet(true);
  };

  const handlepCloseBookingSheet = () => {
    setSelectedSlots(undefined);
    setSelectedBookingDate(undefined);
    setShowBookingSheet(false);
  };

  const handleBookBookingSheet = async () => {
    handleRegisterAttendance();
  };

  const onBookingDateSelected = (date: string) => {
    setSelectedBookingDate(date);
  };

  const handleSelectSlot = (slot: ActivitySlotDto) => {
    setSelectedSlots(slot);
  };

  // 7) Callbacks/handlers
  const handleCloseQRActionsheet = () => setShowQRActionsheet(false);
  const handleRegisterAttendance = async () => {
    setIsQrRefreshing(true);
    try {
      const qrResp = await generateQr({
        type: "MANAGER",
        activityId: id as string,
        activitySlotId: selectedSlots?.activitySlotId!,
      });

      setQrBase64String(`data:image/png;base64,${qrResp.imageStr}`);
      setQrExpiry(
        differenceInMinutes(
          getCurrentSGTDate(),
          getSGTDate(qrResp.expiryDateTime!)
        ) + "M"
      );
      setShowBookingSheet(false);
      setShowQRActionsheet(true);
    } finally {
      setIsQrRefreshing(false);
    }
  };

  // Extract fetch logic for reuse
  const fetchData = React.useCallback(async () => {
    setIsFetchingData(true);
    try {
      const detailResp = await getById(id as string);
      setActivityDetails(detailResp?.data);
    } finally {
      setIsFetchingData(false);
    }
  }, [id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // 8) Effects
  // Set brightness to max when QR actionsheet opens, restore when closes
  React.useEffect(() => {
    const handleBrightness = async () => {
      if (showQRActionsheet) {
        try {
          // Save original brightness only once
          if (originalBrightnessRef.current === null) {
            originalBrightnessRef.current =
              await Brightness.getBrightnessAsync();
          }

          await Brightness.setBrightnessAsync(1);
        } catch {
          // handle error silently
        }
      } else if (originalBrightnessRef.current !== null) {
        try {
          await Brightness.setBrightnessAsync(originalBrightnessRef.current);
        } catch {
          // handle error silently
        }
        originalBrightnessRef.current = null;
      }
    };
    handleBrightness();
  }, [showQRActionsheet]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  return (
    <>
      <ParallaxScrollView
        contentContainerClassName="relative flex-1"
        headerImage={
          <Image
            source={require("@/assets/images/soliders-outdoor-dark-2.png")}
            style={styles.reactLogo}
          />
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <Pressable
          className="absolute top-16 left-4"
          onPress={() => router.back()}
        >
          <Icon as={ChevronLeftIcon} className="!size-8 text-white" />
        </Pressable>

        <Image
          source={require("@/assets/images/soliders-outdoor-dark-bg.png")}
          style={{
            width: screenWidth,
            height: screenHeight,
            position: "absolute",
            top: screenHeight * 0.3 - 50,
            left: 0,
          }}
        />

        {activityDetails && (
          <AnimatedCard
            style={styles.contentCard}
            className="rounded-3xl bg-white flex-1 pb-8 p-4"
          >
            <DetailsCard activityDetails={activityDetails} />

            <Divider className="h-8 bg-transparent" />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <AnimatedCard delay={cardFadeDelay}>
                <HStack space="xl" className=" justify-start">
                  <Pressable
                    onPress={() => router.push(`../update-attendance/${id}`)}
                    className="min-w-[31.5%]"
                  >
                    <VStack className="py-4 px-6 border border-gray-200 items-center justify-center rounded-3xl gap-2">
                      <Center className="bg-red-100 p-2 rounded-full">
                        <Icon
                          as={PencilLineIcon}
                          className="text-red-600 !size-5"
                        />
                      </Center>
                      <Center>
                        <Text className="text-gray-900 font-semibold">
                          Update
                        </Text>
                        <Text className="text-gray-900 font-semibold">
                          Attendance
                        </Text>
                      </Center>
                    </VStack>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(`../documents/${id}`)}
                    className="min-w-[31.5%]"
                  >
                    <VStack className="py-4 px-6 border border-gray-200 items-center justify-center rounded-3xl gap-2">
                      <Center className="bg-red-100 p-2 rounded-full">
                        <Icon as={FileIcon} className="text-red-600 !size-5" />
                      </Center>
                      <Center>
                        <Text className="text-gray-900 font-semibold">
                          View
                        </Text>
                        <Text className="text-gray-900 font-semibold">
                          Documents
                        </Text>
                      </Center>
                    </VStack>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(`../manage-activity/${id}`)}
                    className="min-w-[31.5%]"
                  >
                    <VStack className="py-4 px-6 border border-gray-200 items-center justify-center rounded-3xl gap-2">
                      <Center className="bg-red-100 p-2 rounded-full">
                        <Icon
                          as={ScrollTextIcon}
                          className="text-red-600 !size-5"
                        />
                      </Center>
                      <Center>
                        <Text className="text-gray-900 font-semibold">
                          Manage
                        </Text>
                        <Text className="text-gray-900 font-semibold">
                          Activity
                        </Text>
                      </Center>
                    </VStack>
                  </Pressable>
                </HStack>
              </AnimatedCard>
            </ScrollView>

            <AnimatedCard delay={cardFadeDelay} className="w-full mt-auto">
              <VStack space="xl">
                <Pressable
                  onPress={() => router.push(`../scan-attendance/${id}`)}
                >
                  <HStack className="border border-red-600 py-4 px-6 items-center justify-center rounded-3xl gap-2">
                    {/* <Icon
                      as={ScanQrCodeIcon}
                      className="text-red-600 !size-5"
                    /> */}
                    <Text className="text-red-600 font-semibold">Scan QR</Text>
                  </HStack>
                </Pressable>
                <Pressable onPress={handlepOpenBookingSheet}>
                  <HStack className="bg-red-700/95 py-4 px-6 items-center justify-center rounded-3xl gap-2">
                    {/* <Icon as={UserPenIcon} className="text-white !size-5" /> */}
                    <Text className="text-white font-semibold">
                      Generate QR
                    </Text>
                  </HStack>
                </Pressable>
              </VStack>
            </AnimatedCard>
          </AnimatedCard>
        )}

        {isFetchingData && (
          <AnimatedCard
            style={styles.contentCard}
            className="rounded-3xl bg-white flex-1 pb-8 gap-5 p-4"
          >
            <Skeleton className="h-[100px] rounded-3xl" />
            <SkeletonText _lines={10} className="h-5 rounded-3xl" />
          </AnimatedCard>
        )}
      </ParallaxScrollView>

      <Actionsheet
        isOpen={showQRActionsheet}
        onClose={handleCloseQRActionsheet}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full py-5">
            <Heading size="xl" className="font-bold text-center">
              Attendance QR Code
            </Heading>
            <Text size="md" className="text-center">
              For participants to scan
            </Text>
            <Divider className="my-4 bg-transparent" />
            <Box className="relative">
              <Image source={{ uri: qrBase64String }} style={styles.qrImage} />
              {qrExpiry?.includes("-") && (
                <>
                  <Box className="bg-white/90 absolute inset-0"></Box>
                  <Center className=" absolute inset-0">
                    <Button
                      onPress={handleRegisterAttendance}
                      size="lg"
                      className=""
                      variant="solid"
                      action="negative"
                      disabled={isQrRefreshing}
                    >
                      <ButtonText>REFRESH QR</ButtonText>

                      {isQrRefreshing ? (
                        <ButtonSpinner color="white" />
                      ) : (
                        <ButtonIcon as={LoaderIcon}></ButtonIcon>
                      )}
                    </Button>
                  </Center>
                </>
              )}
            </Box>
            <Text size="md" className="text-center mt-4">
              QR code will expire in {qrExpiry}
            </Text>
            <Divider className="my-4 bg-transparent" />
            <Button
              onPress={handleCloseQRActionsheet}
              size="lg"
              variant="outline"
              action="secondary"
            >
              <ButtonText>Close</ButtonText>
            </Button>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      <KeyboardAvoidingView>
        <Actionsheet
          isOpen={showBookingSheet}
          onClose={handlepCloseBookingSheet}
        >
          <ActionsheetBackdrop />

          <ActionsheetContent className="p-0">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>

            <VStack
              className="w-full py-4 px-6"
              space="xl"
              style={{ height: screenHeight * 0.85 }}
            >
              <Heading size="xl" className="font-bold">
                Select a slot
              </Heading>
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={true}
              >
                <CalendarScreen
                  enabledDates={enabledDates}
                  selectedDate={selectedBookingDate}
                  onDateSelected={onBookingDateSelected}
                  highAvailabilityDates={[enabledDates[0]]}
                  lowAvailabilityDates={[enabledDates[1]]}
                  minDate={(() => {
                    const keys = Object.keys(
                      bookingSlotsGroupedByDateOrderedByDateKey
                    );
                    if (keys.length === 0) return undefined;
                    const firstDate = keys[0];
                    return (
                      DateTime.fromISO(firstDate)
                        .startOf("month")
                        .toISODate() || undefined
                    );
                  })()}
                  maxDate={(() => {
                    const keys = Object.keys(
                      bookingSlotsGroupedByDateOrderedByDateKey
                    );
                    if (keys.length === 0) return undefined;
                    const lastDate = keys[keys.length - 1];
                    return (
                      DateTime.fromISO(lastDate).endOf("month").toISODate() ||
                      undefined
                    );
                  })()}
                />
                {selectedBookingDate && (
                  <>
                    <Divider className="h-4 bg-transparent" />
                    <Text size="md" className="font-bold bg-white py-2 ">
                      {formatDayInWord(selectedBookingDate!)},{" "}
                      {formatDate(selectedBookingDate!)}
                    </Text>

                    <Divider className="h-4 bg-transparent" />

                    <RadioGroup value={selectedSlots?.activitySlotId}>
                      <MinimalTimeline<ActivitySlotDto>
                        events={bookingSlotsGroupedByDateOrderedByDateKey[
                          selectedBookingDate!
                        ].map((slot) => ({
                          start: slot.startDate,
                          end: slot.endDate,
                          ...slot,
                        }))}
                        renderEvent={(slot, index) => (
                          <>
                            <Pressable
                              key={
                                selectedBookingDate! +
                                slot.activitySlotId +
                                index
                              }
                              onPress={() => handleSelectSlot(slot)}
                              className={`h-full  `}
                            >
                              <HStack
                                className={`h-full justify-between items-center border p-4 rounded-3xl ${
                                  selectedSlots?.activitySlotId ===
                                  slot.activitySlotId
                                    ? "bg-red-50 border-red-600"
                                    : `border-transparent ${
                                        slot.bookedByMe
                                          ? "bg-gray-50 opacity-60"
                                          : "bg-gray-50"
                                      }`
                                }`}
                              >
                                <VStack className="items-start">
                                  <Text className="font-semibold text-typography-900">
                                    {formatSlotTime(slot.startDate)} -{" "}
                                    {formatSlotTime(slot.endDate)}
                                  </Text>
                                  <HStack space="sm">
                                    <Text className=" text-green-600">
                                      {slot.remainingSlots} Remaining
                                    </Text>
                                    <Text className="text-typography-900">
                                      /
                                    </Text>
                                    <Text className="text-typography-900">
                                      {slot.vacancy} Vacancy
                                    </Text>
                                  </HStack>
                                </VStack>
                              </HStack>
                            </Pressable>
                          </>
                        )}
                      />
                    </RadioGroup>
                  </>
                )}
              </ScrollView>

              <VStack space="md" className="mt-auto">
                <Button
                  size="lg"
                  variant="solid"
                  action={!selectedSlots ? "secondary" : "negative"}
                  onPress={handleBookBookingSheet}
                  disabled={!selectedSlots?.activitySlotId}
                >
                  <ButtonText className="">Generate QR</ButtonText>
                </Button>
                <Button
                  size="lg"
                  action="default"
                  onPress={handlepCloseBookingSheet}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </VStack>
            </VStack>
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>
    </>
  );
};

export default ViewActivity;

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  contentCard: {
    width: screenWidth,
    marginTop: -(screenHeight * 0.1),
  },
  buttonSection: {
    //marginTop: screenHeight * (0.3 / 2),
  },
  reactLogo: {
    height: screenHeight * 0.3,
    width: screenWidth,
  },
  qrImage: {
    height: screenHeight * 0.3,
    width: "100%",
  },
});
