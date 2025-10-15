import {
  ActivityResponseDto,
  ActivitySlotDto,
  book,
  change,
  generateQr,
  getById,
  listActivitiesAttended,
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
import { Pressable } from "@/components/ui/pressable";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
} from "@/components/ui/radio";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";

import { VStack } from "@/components/ui/vstack";
import {
  differenceInHours,
  formatDate,
  formatDayInWord,
  formatSlotTime,
  formatTime,
  groupActivitiesByDateRangeOrdered,
} from "@/hooks/date-formatter";
import { useNotification } from "@/hooks/useNotification";
import { decodeQrFromBase64 } from "@/hooks/useQrDecode";
import { QrPayload } from "@/models/qr";
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
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

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
  const [refreshing, setRefreshing] = React.useState(false);
  const [isFetchingData, setIsFetchingData] = React.useState(false);
  const [qrData, setQrData] = React.useState<QrPayload>();
  const [isQrRefreshing, setIsQrRefreshing] = React.useState(false);
  const originalBrightnessRef = React.useRef<number | null>(null);
  const [showBookingSheet, setShowBookingSheet] = React.useState(false);
  const [selectedSlots, setSelectedSlots] = React.useState<ActivitySlotDto>();
  const [selectedBookingDate, setSelectedBookingDate] =
    React.useState<string>();
  const [bookingStep, setBookingStep] = React.useState<
    "select" | "confirm" | "success"
  >();

  const bookingSlotsGroupedByDateOrderedByDateKey = React.useMemo(() => {
    if (activityDetails?.bookingWindowRequired) {
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
  const registrationRequired = React.useMemo(
    () => activityDetails?.bookingWindowRequired ?? false,
    [activityDetails]
  );
  const alreadyRegistered = React.useMemo(
    () => activityDetails?.slots?.find((slot) => slot.bookedByMe) ?? false,
    [activityDetails]
  );
  const showAttendanceButtons = React.useMemo(
    () => (registrationRequired && alreadyRegistered) || !registrationRequired,
    [registrationRequired, alreadyRegistered]
  );

  const handlepOpenBookingSheet = () => {
    setBookingStep("select");
    setShowBookingSheet(true);
  };

  const handlepCloseBookingSheet = () => {
    setSelectedSlots(undefined);
    setSelectedBookingDate(undefined);
    setShowBookingSheet(false);
    setBookingStep(undefined);
  };

  const handleBookBookingSheet = async () => {
    try {
      const existingBooking = activityDetails?.slots?.find(
        (slot) => slot.bookedByMe
      );
      if (!!existingBooking) {
        await change({
          activityId: id as string,
          activitySlotId: selectedSlots?.activitySlotId!,
          cancelActivityBookingId: existingBooking?.activitySlotId!,
          cancelOnly: false,
        });
      } else {
        await book({
          activityId: id as string,
          activitySlotId: selectedSlots?.activitySlotId!,
        });
      }

      setBookingStep("success");
      await fetchData();
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const handleCancelBookingSheet = async (slot: ActivitySlotDto) => {
    try {
      await change({
        activityId: id as string,
        cancelActivityBookingId: slot?.activitySlotId!,
        cancelOnly: true,
      });
      await fetchData();
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const handleSelectBookingSheet = () => {
    setBookingStep("confirm");
  };

  const onBookingDateSelected = (date: string) => {
    setSelectedBookingDate(date);
  };

  const handleSelectSlot = (slot: ActivitySlotDto) => {
    setSelectedSlots(slot);
  };

  // --- Derived State ---
  const qrExpiry = useMemo(() => {
    if (qrData) {
      const generated = DateTime.fromSeconds(qrData.generatedAt).setZone(
        "Asia/Singapore"
      );
      const validUntil = DateTime.fromSeconds(qrData.validUntil).setZone(
        "Asia/Singapore"
      );
      return differenceInHours(generated, validUntil);
    }
    return null;
  }, [qrData]);

  // --- Handlers ---
  const handleCloseQRActionsheet = () => setShowQRActionsheet(false);

  const handleRegisterAttendance = async () => {
    setIsQrRefreshing(true);
    try {
      const qrResp = await generateQr({
        type: "PARTICIPANT",
        activityId: id as string,
      });
      setQrBase64String(`data:image/png;base64,${qrResp.imageStr}`);
      setShowQRActionsheet(true);
      const qrData = await decodeQrFromBase64(`${qrResp.imageStr}`);
      if (qrData) {
        const parsedData: QrPayload = JSON.parse(qrData);
        setQrData(parsedData);
      }
    } finally {
      setIsQrRefreshing(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const detailResp = await getById(id as string);
      setActivityDetails(detailResp?.data);

      const attendanceRecordsResp = await listActivitiesAttended({
        activityType: "APS",
      });

      const hasAttendanceTaken = attendanceRecordsResp.data?.some(
        (x) => x.activityId === id && x.attendanceStatus === "PRESENT"
      );
      setHasAttendanceTaken(hasAttendanceTaken ?? false);
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
            <DetailsCard
              activityDetails={activityDetails}
              showBookNowButton={registrationRequired && !alreadyRegistered}
              showBookedSlots
              showCancelButton={!hasAttendanceTaken}
              onBookNowPress={handlepOpenBookingSheet}
              onCancelBookingPress={handleCancelBookingSheet}
            />

            {showAttendanceButtons && (
              <AnimatedCard delay={cardFadeDelay} className="w-full mt-auto">
                {!hasAttendanceTaken ? (
                  <VStack space="xl">
                    <Pressable
                      onPress={() => router.push(`../scan-attendance/${id}`)}
                    >
                      <HStack className="border border-red-600 py-4 px-6 items-center justify-center rounded-3xl gap-2">
                        {/* <Icon
                          as={ScanQrCodeIcon}
                          className="text-red-600 !size-5"
                        /> */}
                        <Text className="text-red-600 font-semibold">
                          Scan QR
                        </Text>
                      </HStack>
                    </Pressable>
                    <Pressable onPress={handleRegisterAttendance}>
                      <HStack className="bg-red-700/95 py-4 px-6 items-center justify-center rounded-3xl gap-2">
                        <Text className="text-white font-semibold">
                          Generate QR
                        </Text>
                      </HStack>
                    </Pressable>
                  </VStack>
                ) : (
                  <Badge action="success" className="py-3 px-4 gap-2 shadow-sm">
                    <BadgeIcon as={CheckCircleIcon} className="!size-6" />
                    <BadgeText className="text-lg">
                      Attendance has been taken.
                    </BadgeText>
                  </Badge>
                )}
              </AnimatedCard>
            )}
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
              <Heading size="xl" className="font-bold text-center">
                Attendance QR Code
              </Heading>
              <Text size="md" className="text-center">
                For commanders/trainers to scan
              </Text>
              <Divider className="my-4 bg-transparent" />
              <Box className="relative">
                <Image
                  source={{
                    uri: qrBase64String,
                  }}
                  style={styles.qrImage}
                />
                {qrExpiry?.includes("-") && (
                  <>
                    <Box className="bg-white/90 absolute inset-0"></Box>
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
              <Text size="md" className="text-center mt-4">
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
            <ActionsheetContent className="p-0">
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>

              <VStack
                className="w-full py-4 px-6"
                space="xl"
                style={{ height: screenHeight * 0.85 }}
              >
                {bookingStep === "select" && (
                  <>
                    <Heading size="xl" className="font-bold">
                      Select a date
                    </Heading>
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
                    <VStack space="md" className="mt-auto">
                      <Button
                        size="lg"
                        action={!selectedBookingDate ? "secondary" : "negative"}
                        onPress={handleSelectBookingSheet}
                        disabled={!selectedBookingDate}
                      >
                        <ButtonText className="">Continue</ButtonText>
                      </Button>
                      <Button
                        size="lg"
                        action="default"
                        onPress={handlepCloseBookingSheet}
                      >
                        <ButtonText>Cancel</ButtonText>
                      </Button>
                    </VStack>
                  </>
                )}

                {bookingStep === "confirm" && (
                  <>
                    <Heading size="xl" className="font-bold">
                      Select a slot
                    </Heading>

                    <ScrollView
                      className="w-full h-1/2"
                      stickyHeaderIndices={[0]}
                    >
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
                            start: slot.startDate.slice(0, -1),
                            end: slot.endDate.slice(0, -1),
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
                                onPress={() =>
                                  !slot.bookedByMe
                                    ? handleSelectSlot(slot)
                                    : undefined
                                }
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
                                      <Text className="text-red-600">
                                        Booked
                                      </Text>
                                    </HStack>
                                  )}
                                </HStack>
                              </Pressable>
                            </>
                          )}
                        />
                      </RadioGroup>
                    </ScrollView>

                    <VStack space="md" className="mt-auto">
                      <Button
                        size="lg"
                        variant="solid"
                        action={!selectedSlots ? "secondary" : "negative"}
                        onPress={handleBookBookingSheet}
                        disabled={!selectedSlots?.activitySlotId}
                      >
                        <ButtonText className="">Book</ButtonText>
                      </Button>
                      <Button
                        size="lg"
                        action="default"
                        onPress={handlepCloseBookingSheet}
                      >
                        <ButtonText>Cancel</ButtonText>
                      </Button>
                    </VStack>
                  </>
                )}
                <Divider className="h-4 bg-transparent" />
              </VStack>
            </ActionsheetContent>
          ) : (
            <ActionsheetContent className="bg-green-600 border-0">
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>
              <Box
                className="w-full py-4 px-6"
                style={{ height: screenHeight * 0.8 }}
              >
                <Divider className="my-4 bg-transparent" />
                <Center>
                  <Icon as={CheckCircleIcon} className="text-white !size-20" />
                </Center>
                <Divider className="my-4 bg-transparent" />
                <AnimatedCard delay={cardFadeDelay}>
                  <Text size="lg" className="text-center text-white">
                    Booking has been taken on
                  </Text>
                </AnimatedCard>

                <Heading
                  size="xl"
                  className="font-semibold text-center text-white"
                >
                  {formatDayInWord(selectedBookingDate!)},{" "}
                  {formatDate(selectedBookingDate!)}
                </Heading>

                <AnimatedCard delay={cardFadeDelay * 2}>
                  <Divider className="my-4 bg-transparent" />
                  {!!selectedSlots && (
                    <Heading
                      key={"bookedSlot" + selectedSlots.activitySlotId}
                      size="xl"
                      className="font-semibold text-center text-white"
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
