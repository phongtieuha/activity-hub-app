import {
  ActivityAttendedDtoAttendanceStatus,
  ActivityResponseDto,
  ActivitySlotDto,
  bookForSelf,
  cancelBooking,
  changeBooking,
  generateQr,
  getById,
  getMe,
  listActivitiesAttended,
  UserDto,
} from "@/__generated-client/http-client-integration";
import CalendarScreen from "@/components/app/Calendar";
import DetailsCard from "@/components/app/DetailsCardForParticipant";
import MinimalTimeline, {
  TimelineEvent,
} from "@/components/app/MinimalTimeline";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
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
import { LoadingButton } from "@/components/ui/loading-button";
import { Pressable } from "@/components/ui/pressable";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
} from "@/components/ui/radio";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";

import { VStack } from "@/components/ui/vstack";
import {
  AnimatedView,
  AnimatedViewList,
  ElementEnteringFadeInLeft,
  ElementExitingFadeOutDown,
} from "@/constants/animation";
import {
  DATEPICKER_FORMAT,
  differenceInMinutes,
  formatDate,
  formatDayInWord,
  formatSlotTime,
  formatTime,
  getCurrentSGTDate,
  getSGTDate,
  groupActivitiesByDateRangeOrdered,
} from "@/hooks/date-formatter";
import { useNotification } from "@/hooks/useNotification";
import * as Brightness from "expo-brightness";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  CircleIcon,
  LoaderIcon,
} from "lucide-react-native";
import { DateTime } from "luxon";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LayoutAnimationConfig } from "react-native-reanimated";

const ViewActivity = () => {
  // --- Navigation & Utilities ---
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showNotification } = useNotification();

  // --- State ---
  const [showQRActionsheet, setShowQRActionsheet] = React.useState(false);
  const [qrBase64String, setQrBase64String] = React.useState("");
  const [activityDetails, setActivityDetails] =
    React.useState<ActivityResponseDto>();
  const [userDetails, setUserDetails] = React.useState<UserDto>();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isFetchingData, setIsFetchingData] = React.useState(false);
  const [qrExpiry, setQrExpiry] = React.useState<string | null>(null);
  const [isQrRefreshing, setIsQrRefreshing] = React.useState(false);
  const originalBrightnessRef = React.useRef<number | null>(null);
  const [showBookingSheet, setShowBookingSheet] = React.useState(false);
  const [selectedSlots, setSelectedSlots] = React.useState<ActivitySlotDto>();
  const [selectedBookingDate, setSelectedBookingDate] =
    React.useState<string>();
  const [bookingStep, setBookingStep] = React.useState<"select" | "success">();
  const [bookingMode, setBookingMode] = React.useState<"slot" | "qr">("slot");
  const [isActionInProgress, setIsActionInProgress] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const bookingSlotsGroupedByDateOrderedByDateKey = React.useMemo(() => {
    if (activityDetails?.participationType === "ELECTIVE") {
      return groupActivitiesByDateRangeOrdered<ActivitySlotDto>(
        activityDetails.slots || []
      );
    }
    return {};
  }, [activityDetails]);

  const enabledDates = React.useMemo(() => {
    return Object.keys(bookingSlotsGroupedByDateOrderedByDateKey);
  }, [bookingSlotsGroupedByDateOrderedByDateKey]);

  const [hasAttendanceTaken, setHasAttendanceTaken] = React.useState(false);

  const alreadyRegistered = React.useMemo(
    () => activityDetails?.slots?.find((slot) => slot.bookedByMe) ?? false,
    [activityDetails]
  );

  const isBookingDateToday = React.useMemo(() => {
    const bookedSlot = activityDetails?.slots?.find((slot) => slot.bookedByMe);
    if (!bookedSlot) return false;

    const eventDate = getSGTDate(bookedSlot.startDate).toFormat(
      DATEPICKER_FORMAT
    );
    const currentDate = getCurrentSGTDate().toFormat(DATEPICKER_FORMAT);

    return eventDate === currentDate;
  }, [activityDetails]);

  const handlepOpenBookingSheet = () => {
    setBookingStep("select");
    setBookingMode("slot");
    setShowBookingSheet(true);
  };

  const handlepGenerateQROpenBookingSheet = () => {
    setBookingStep("select");
    setBookingMode("qr");
    setShowBookingSheet(true);
  };

  const handlepCloseBookingSheet = () => {
    setSelectedSlots(undefined);
    setSelectedBookingDate(undefined);
    setShowBookingSheet(false);
    setBookingStep(undefined);
  };

  const handleGenerateQRBookingSheet = async () => {
    setIsQrRefreshing(true);
    setShowBookingSheet(false);
    setShowQRActionsheet(true);

    try {
      const qrResp = await generateQr({
        type: "WALK_IN_REGISTRATION",
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

      // const qrData = await decodeQrFromBase64(`${qrResp.imageStr}`);

      // if (qrData) {
      //   const parsedData: QrPayload = JSON.parse(qrData);
      //   setQrData(parsedData);
      // }
    } finally {
      setIsQrRefreshing(false);
    }
  };

  const handleBookBookingSheet = async () => {
    setIsActionInProgress(true);
    try {
      const existingBooking = activityDetails?.slots?.find(
        (slot) => slot.bookedByMe
      );
      if (!!existingBooking) {
        await changeBooking(existingBooking?.myBookingId!, {
          newActivitySlotId: selectedSlots?.activitySlotId!,
          userId: userDetails?.userId!,
        });
      } else {
        await bookForSelf({
          activityId: id as string,
          activitySlotId: selectedSlots?.activitySlotId!,
        });
      }

      setBookingStep("success");
      await fetchData();
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleCancelBookingSheet = async (slot: ActivitySlotDto) => {
    setIsCancelling(true);
    try {
      await cancelBooking(slot?.myBookingId!);
      await fetchData();
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const onBookingDateSelected = (date: string) => {
    setSelectedBookingDate(date);
  };

  const handleSelectSlot = (slot: ActivitySlotDto) => {
    setSelectedSlots(slot);
  };

  // --- Handlers ---
  const handleCloseQRActionsheet = () => setShowQRActionsheet(false);

  const handleRegisterAttendance = async () => {
    setIsQrRefreshing(true);
    setShowQRActionsheet(true);

    try {
      const qrResp = await generateQr({
        type: "PARTICIPANT",
        activityId: id as string,
        activitySlotId: activityDetails?.slots?.find((x) => x.bookedByMe)
          ?.activitySlotId!,
      });
      setQrBase64String(`data:image/png;base64,${qrResp.imageStr}`);
      setQrExpiry(
        differenceInMinutes(
          getCurrentSGTDate(),
          getSGTDate(qrResp.expiryDateTime!)
        ) + "M"
      );
    } finally {
      setIsQrRefreshing(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const detailResp = await getById(id as string);
      setActivityDetails(detailResp?.data);

      const attendanceRecordsResp = await listActivitiesAttended();

      const hasAttendanceTaken = attendanceRecordsResp.data?.some(
        (x) =>
          x.activityId === id &&
          (x.attendanceStatus === ActivityAttendedDtoAttendanceStatus.PRESENT ||
            x.attendanceStatus === ActivityAttendedDtoAttendanceStatus.LATE)
      );
      setHasAttendanceTaken(hasAttendanceTaken ?? false);

      const userResp = await getMe();
      setUserDetails(userResp);
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

  // --- Effects ---
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
    fetchData();
  }, [fetchData]);

  const renderBookingSlot = (
    slot: ActivitySlotDto & TimelineEvent,
    index: number,
    isFullHeight: boolean = false
  ) => (
    <Pressable
      key={selectedBookingDate! + slot.activitySlotId + index}
      onPress={() => (!slot.bookedByMe ? handleSelectSlot(slot) : undefined)}
      className={`${isFullHeight ? "h-full" : ""} `}
    >
      <HStack
        className={`${
          isFullHeight ? "h-full" : ""
        } items-center justify-between rounded-3xl border p-4 ${
          selectedSlots?.activitySlotId === slot.activitySlotId
            ? "border-red-600 bg-red-50"
            : `border-transparent ${
                slot.bookedByMe ? "bg-gray-50 opacity-60" : "bg-gray-50"
              }`
        }`}
      >
        <VStack className="items-start">
          <Text className="font-semibold text-typography-900">
            {formatSlotTime(slot.startDate)} - {formatSlotTime(slot.endDate)}
          </Text>
          <HStack space="sm">
            <Text className=" text-green-600">
              {slot.remainingSlots} Remaining
            </Text>
            <Text className="text-typography-900">/</Text>
            <Text className="text-typography-900">{slot.vacancy} Vacancy</Text>
          </HStack>
        </VStack>
        {!slot.bookedByMe ? (
          <Radio
            size="md"
            value={slot.activitySlotId!}
            className="pointer-events-none"
          >
            <RadioIndicator className="">
              <RadioIcon as={CircleIcon} />
            </RadioIndicator>
          </Radio>
        ) : (
          <HStack space="sm">
            <Text className="text-red-600">Booked</Text>
          </HStack>
        )}
      </HStack>
    </Pressable>
  );

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
        <AnimatedView
          entering={ElementEnteringFadeInLeft}
          delay={200}
          className="absolute left-4 top-16"
        >
          <Pressable onPress={() => router.back()}>
            <Icon as={ChevronLeftIcon} className="!size-8 text-white" />
          </Pressable>
        </AnimatedView>

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

        {!isFetchingData && activityDetails && (
          <AnimatedView
            style={styles.contentCard}
            className="flex-1 rounded-3xl bg-white p-4 pb-8"
          >
            <DetailsCard
              activityDetails={activityDetails}
              showBookedSlots
              showCancelButton={
                activityDetails.participationType === "ELECTIVE" &&
                !hasAttendanceTaken
              }
              onCancelBookingPress={handleCancelBookingSheet}
              isCancelling={isCancelling}
            />

            {!alreadyRegistered && (
              <AnimatedView delay={cardFadeDelay} className="mt-auto w-full">
                <VStack space="xl">
                  {isBookingDateToday && (
                    <Pressable onPress={handlepGenerateQROpenBookingSheet}>
                      <HStack className="items-center justify-center gap-2 rounded-3xl border border-red-600 px-6 py-4">
                        <Text className="font-semibold text-red-600">
                          Generate QR
                        </Text>
                      </HStack>
                    </Pressable>
                  )}
                  <Pressable onPress={handlepOpenBookingSheet}>
                    <HStack className="items-center justify-center gap-2 rounded-3xl bg-red-700/95 px-6 py-4">
                      <Text className="font-semibold text-white">
                        Book a Slot
                      </Text>
                    </HStack>
                  </Pressable>
                </VStack>
              </AnimatedView>
            )}

            {hasAttendanceTaken && (
              <AnimatedView delay={cardFadeDelay} className="mt-auto w-full">
                <Badge action="success" className="gap-2 px-4 py-3 shadow-sm">
                  <BadgeIcon as={CheckCircleIcon} className="!size-6" />
                  <BadgeText className="text-lg">
                    Attendance has been taken.
                  </BadgeText>
                </Badge>
              </AnimatedView>
            )}

            {alreadyRegistered && !hasAttendanceTaken && (
              <AnimatedView delay={cardFadeDelay} className="mt-auto w-full">
                {isBookingDateToday ? (
                  <VStack space="xl">
                    <Pressable
                      onPress={() => router.push(`../scan-attendance/${id}`)}
                    >
                      <HStack className="items-center justify-center gap-2 rounded-3xl border border-red-600 px-6 py-4">
                        <Text className="font-semibold text-red-600">
                          Scan QR
                        </Text>
                      </HStack>
                    </Pressable>
                    <Pressable onPress={handleRegisterAttendance}>
                      <HStack className="items-center justify-center gap-2 rounded-3xl bg-red-700/95 px-6 py-4">
                        <Text className="font-semibold text-white">
                          Generate QR
                        </Text>
                      </HStack>
                    </Pressable>
                  </VStack>
                ) : (
                  <VStack space="xl">
                    <Pressable onPress={handlepOpenBookingSheet}>
                      <HStack className="items-center justify-center gap-2 rounded-3xl bg-red-700/95 px-6 py-4">
                        <Text className="font-semibold text-white">
                          Select another Slot
                        </Text>
                      </HStack>
                    </Pressable>
                  </VStack>
                )}
              </AnimatedView>
            )}
          </AnimatedView>
        )}

        {isFetchingData && (
          <AnimatedView
            exiting={ElementExitingFadeOutDown}
            style={styles.contentCard}
            className="flex flex-1 items-center justify-center gap-5 rounded-3xl bg-white p-4 pb-8"
          >
            <ActivityIndicator size={Platform.OS === "ios" ? "large" : 48} />
            {/* <Skeleton className="h-[100px] rounded-3xl" />
            <SkeletonText _lines={10} className="h-5 rounded-3xl" /> */}
          </AnimatedView>
        )}
      </ParallaxScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
              <Heading size="xl" className="text-center font-bold">
                Attendance QR Code
              </Heading>
              <Text size="md" className="text-center">
                For commanders/trainers to scan
              </Text>
              <Divider className="my-4 bg-transparent" />
              <Box className="relative">
                {isQrRefreshing ? (
                  <VStack space="md" style={styles.qrImage}>
                    <AnimatedViewList>
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <HStack space="md" className="flex-1">
                        <Skeleton className="h-full flex-1 rounded-lg" />
                        <Skeleton className="h-full flex-1 rounded-lg" />
                      </HStack>
                      <HStack space="md">
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                      </HStack>
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </AnimatedViewList>
                  </VStack>
                ) : (
                  <AnimatedView>
                    <Image
                      source={{
                        uri: qrBase64String,
                      }}
                      style={styles.qrImage}
                      className=""
                    />
                  </AnimatedView>
                )}

                {qrExpiry?.includes("-") && (
                  <>
                    <Box className="absolute inset-0 bg-white/90"></Box>
                    <Center className=" absolute inset-0">
                      <Button
                        onPress={handleRegisterAttendance}
                        size="lg"
                        variant="solid"
                        action="negative"
                        disabled={isQrRefreshing}
                      >
                        <ButtonText>Refresh QR</ButtonText>

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
              <Text size="md" className="mt-4 text-center">
                QR code will expire in {qrExpiry}
              </Text>
              <Divider className="my-4 bg-transparent" />
              <Button
                onPress={handleCloseQRActionsheet}
                size="lg"
                variant="outline"
                action="default"
              >
                <ButtonText>Close</ButtonText>
              </Button>
            </VStack>
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>

      <KeyboardAvoidingView>
        <Actionsheet
          isOpen={showBookingSheet}
          onClose={handlepCloseBookingSheet}
        >
          <ActionsheetBackdrop />

          {bookingStep !== "success" ? (
            <LayoutAnimationConfig skipExiting>
              <ActionsheetContent className="p-0">
                <ActionsheetDragIndicatorWrapper>
                  <ActionsheetDragIndicator />
                </ActionsheetDragIndicatorWrapper>

                <VStack
                  className="w-full px-6 py-4"
                  space="xl"
                  style={{ height: screenHeight * 0.85 }}
                >
                  <Heading size="xl" className="font-bold">
                    Select a Slot
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
                          DateTime.fromISO(lastDate)
                            .endOf("month")
                            .toISODate() || undefined
                        );
                      })()}
                    />
                    {selectedBookingDate && (
                      <AnimatedView>
                        <Divider className="h-4 bg-transparent" />
                        <Text size="md" className="bg-white py-2 font-bold ">
                          {formatDayInWord(selectedBookingDate!)},{" "}
                          {formatDate(selectedBookingDate!)}
                        </Text>

                        <Divider className="h-4 bg-transparent" />
                        {bookingSlotsGroupedByDateOrderedByDateKey[
                          selectedBookingDate!
                        ].length === 1 && (
                          <RadioGroup value={selectedSlots?.activitySlotId}>
                            {bookingSlotsGroupedByDateOrderedByDateKey[
                              selectedBookingDate!
                            ]
                              .map((slot) => ({
                                start: slot.startDate,
                                end: slot.endDate,
                                ...slot,
                              }))
                              .map((slot, index) =>
                                renderBookingSlot(slot, index)
                              )}
                          </RadioGroup>
                        )}

                        {bookingSlotsGroupedByDateOrderedByDateKey[
                          selectedBookingDate!
                        ].length > 1 && (
                          <RadioGroup value={selectedSlots?.activitySlotId}>
                            <MinimalTimeline<ActivitySlotDto>
                              events={bookingSlotsGroupedByDateOrderedByDateKey[
                                selectedBookingDate!
                              ].map((slot) => ({
                                start: slot.startDate,
                                end: slot.endDate,
                                ...slot,
                              }))}
                              renderEvent={(slot, index) =>
                                renderBookingSlot(slot, index, true)
                              }
                            />
                          </RadioGroup>
                        )}
                      </AnimatedView>
                    )}
                  </ScrollView>

                  <VStack space="md" className="mt-auto">
                    {bookingMode === "slot" && (
                      <LoadingButton
                        size="lg"
                        variant="solid"
                        action={!selectedSlots ? "secondary" : "negative"}
                        onPress={handleBookBookingSheet}
                        disabled={!selectedSlots?.activitySlotId}
                        loading={isActionInProgress}
                        loadingText="Booking"
                        loadingCssClass="text-white"
                      >
                        Book
                      </LoadingButton>
                    )}
                    {bookingMode === "qr" && (
                      <Button
                        size="lg"
                        variant="solid"
                        action={!selectedSlots ? "secondary" : "negative"}
                        onPress={handleGenerateQRBookingSheet}
                        disabled={!selectedSlots?.activitySlotId}
                      >
                        <ButtonText className="">Generate QR</ButtonText>
                      </Button>
                    )}
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
            </LayoutAnimationConfig>
          ) : (
            <ActionsheetContent className="border-0 bg-green-600">
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>
              <Box
                className="w-full px-6 py-4"
                style={{ height: screenHeight * 0.8 }}
              >
                <Divider className="my-4 bg-transparent" />
                <Center>
                  <Icon as={CheckCircleIcon} className="!size-20 text-white" />
                </Center>
                <Divider className="my-4 bg-transparent" />
                <AnimatedCard delay={cardFadeDelay}>
                  <Text size="lg" className="text-center text-white">
                    Your booking below has been confirmed.
                  </Text>
                  <Divider className="my-4 bg-transparent" />
                </AnimatedCard>

                <Heading
                  size="xl"
                  className="text-center font-semibold text-white"
                >
                  {formatDayInWord(selectedBookingDate!)},{" "}
                  {formatDate(selectedBookingDate!)}
                </Heading>

                <AnimatedCard delay={cardFadeDelay * 2}>
                  {!!selectedSlots && (
                    <Heading
                      key={"bookedSlot" + selectedSlots.activitySlotId}
                      size="xl"
                      className="text-center font-semibold text-white"
                    >
                      {formatTime(selectedSlots.startDate)} -{" "}
                      {formatTime(selectedSlots.endDate)}
                    </Heading>
                  )}
                </AnimatedCard>

                <Divider className="my-4 bg-transparent" />

                <Box className="mt-auto w-full">
                  <AnimatedCard delay={cardFadeDelay * 4}>
                    <Button
                      size="lg"
                      action="default"
                      onPress={handlepCloseBookingSheet}
                    >
                      <ButtonText>Close</ButtonText>
                    </Button>
                  </AnimatedCard>
                </Box>
              </Box>
            </ActionsheetContent>
          )}
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
