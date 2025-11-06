import {
  BadgeAlertIcon,
  Calendar1Icon,
  CalendarPlus,
  ClockIcon,
  MapPinIcon,
  NotebookTextIcon,
  ShirtIcon,
} from "lucide-react-native";
import React, { useState } from "react";

import {
  ActivityResponseDto,
  ActivitySlotDto,
} from "@/__generated-client/http-client-integration";
import { AnimatedView } from "@/constants/animation";
import {
  formatDayInWord,
  formatShortDate,
  formatSlotTime,
  formatTime,
} from "@/hooks/date-formatter";
import { ServerAttireToDisplayMapping } from "@/models/activity";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "../ui/actionsheet";
import { Badge, BadgeIcon, BadgeText } from "../ui/badge";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import { Card } from "../ui/card";
import { Divider } from "../ui/divider";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Icon } from "../ui/icon";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

interface IProps {
  activityDetails: ActivityResponseDto;
  onBookNowPress?: () => void;
  onCancelBookingPress?: (slot: ActivitySlotDto) => void;
  showBookedSlots?: boolean;
  showCancelButton?: boolean;
}

const DetailsCard: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlotToCancel, setSelectedSlotToCancel] =
    useState<ActivitySlotDto | null>(null);

  const isBookingStartDateSameAsEndDate =
    props.activityDetails.bookingWindowStartDate?.split("T")[0] ===
    props.activityDetails.bookingWindowEndDate?.split("T")[0];

  const bookedSlots = (props.activityDetails.slots ?? []).filter(
    (x) => x.bookedByMe
  );

  const bookingSameDatesBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="flex-1 items-start justify-center text-typography-300">
        <Text className="">Available at</Text>
        <Text className="text-base font-semibold text-typography-900">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)}
        </Text>
      </VStack>

      <VStack className="flex-1 items-start justify-center text-typography-300">
        <Text className="">Close at</Text>
        <Text className="font-semibold text-typography-900">
          {formatTime(startDate)} - {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
  );

  const bookingDateRangeBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="flex-1 items-start justify-center text-typography-300">
        <Text>Available at</Text>
        <Text className="text-base font-semibold text-typography-900">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)},{" "}
          {formatTime(startDate)}
        </Text>
      </VStack>

      <VStack className="flex-1 items-start justify-center text-typography-300">
        <Text>Close at</Text>
        <Text className="font-semibold text-typography-900">
          {formatDayInWord(endDate)}, {formatShortDate(endDate)},{" "}
          {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
  );

  function handleCancelBooking(slot: ActivitySlotDto): void {
    setSelectedSlotToCancel(slot);
    setShowConfirmModal(true);
  }

  function handleConfirmCancel(): void {
    if (selectedSlotToCancel) {
      props.onCancelBookingPress?.(selectedSlotToCancel);
      setShowConfirmModal(false);
      setSelectedSlotToCancel(null);
    }
  }

  function handleCancelModal(): void {
    setShowConfirmModal(false);
    setSelectedSlotToCancel(null);
  }
  return (
    <>
      <AnimatedView>
        <Badge action="error" size="lg" className="justify-center">
          <BadgeText className="text-center">
            This activity is {props.activityDetails.participationType}
          </BadgeText>
        </Badge>
        <Divider className="h-1 bg-transparent" />

        <HStack className="items-center justify-between">
          <HStack space="sm" className="items-center text-typography-300">
            <Box className="mx-1 size-2 rounded-full bg-blue-600" />
            <Text size="md" className="font-bold tracking-wide text-blue-600">
              {props.activityDetails.timeline}
            </Text>
          </HStack>

          <Pressable className="rounded-full border border-gray-300 p-2.5">
            <Icon as={CalendarPlus} className="text-gray-600"></Icon>
          </Pressable>
        </HStack>

        <Heading size="xl" className="font-extrabold">
          {props.activityDetails.name}
        </Heading>
        <Divider className="h-1 bg-transparent" />
        <HStack className="items-start justify-between">
          <HStack space="sm" className="items-center text-typography-300">
            <Icon as={MapPinIcon} className="text-typography-400" />
            <Text>{props.activityDetails.location || "-"}</Text>
            <Badge variant="solid" action="success">
              <BadgeText>{props.activityDetails.zone || "-"}</BadgeText>
            </Badge>
          </HStack>
        </HStack>
        <Divider className="h-6 bg-transparent" />
      </AnimatedView>

      {bookedSlots.length === 0 && (
        <AnimatedView delay={100}>
          <VStack space="lg">
            {props.activityDetails.participationType === "ELECTIVE" && (
              <Badge action="warning" className="gap-2 py-3">
                <BadgeIcon as={BadgeAlertIcon} className="!size-6" />
                <BadgeText className="text-base">
                  You are required to book your slot during the booking window.
                </BadgeText>
              </Badge>
            )}

            <Card className="gap-3 rounded-3xl border border-gray-200 p-4">
              {props.activityDetails.participationType === "COMPULSORY" && (
                <>
                  <HStack className="justify-between">
                    <Text className="font-semibold">Booking Required</Text>
                    {props.activityDetails.participationType ===
                      "COMPULSORY" && (
                      <Badge action="success">
                        <BadgeText>No</BadgeText>
                      </Badge>
                    )}
                  </HStack>
                  <Divider className="border border-dashed border-gray-200 bg-transparent" />
                </>
              )}

              {props.activityDetails.participationType === "ELECTIVE" && (
                <>
                  {isBookingStartDateSameAsEndDate
                    ? bookingSameDatesBlock(
                        props.activityDetails.bookingWindowStartDate!,
                        props.activityDetails.bookingWindowEndDate!
                      )
                    : bookingDateRangeBlock(
                        props.activityDetails.bookingWindowStartDate!,
                        props.activityDetails.bookingWindowEndDate!
                      )}
                </>
              )}
            </Card>
          </VStack>
        </AnimatedView>
      )}

      {props.showBookedSlots && bookedSlots.length > 0 && (
        <AnimatedView delay={100}>
          <VStack space="lg">
            <Badge action="success" className="items-start gap-2 px-6 py-3">
              <VStack space="sm" className="w-full">
                <BadgeText className="mt-0.5 text-lg">
                  Your booking below has been confirmed.
                </BadgeText>
                {bookedSlots.map((slot) => (
                  <VStack space="xs" key={slot.activitySlotId}>
                    <HStack space="md" className="items-center">
                      <BadgeIcon as={Calendar1Icon} className="!size-5" />
                      <BadgeText className="text-xl font-bold">
                        {formatDayInWord(slot.startDate)},{" "}
                        {formatShortDate(slot.startDate)}
                      </BadgeText>
                    </HStack>

                    <HStack space="md" className="items-center">
                      <BadgeIcon as={ClockIcon} className="!size-5" />
                      <BadgeText className="text-xl font-bold">
                        {formatSlotTime(slot.startDate)} -{" "}
                        {formatSlotTime(slot.endDate)}
                      </BadgeText>
                    </HStack>

                    {props.showCancelButton && (
                      <Button
                        variant="outline"
                        action="negative"
                        className="mt-3 w-full"
                        onPress={() => handleCancelBooking(slot)}
                      >
                        <ButtonText>Cancel Booking</ButtonText>
                      </Button>
                    )}
                  </VStack>
                ))}
              </VStack>
            </Badge>
          </VStack>
        </AnimatedView>
      )}

      <Divider className="h-6 bg-transparent" />

      <AnimatedView delay={200}>
        <VStack space="md">
          <HStack className="justify-between">
            <HStack space="sm" className="items-center text-typography-300">
              <Icon as={ShirtIcon} className="text-typography-400" />
              <Text>Attire</Text>
            </HStack>
            <Text className="font-semibold text-typography-900">
              {ServerAttireToDisplayMapping[props.activityDetails.attire!] ||
                "-"}
            </Text>
          </HStack>
          <HStack className="justify-between">
            <HStack space="sm" className="items-center text-typography-300">
              <Icon as={NotebookTextIcon} className="text-typography-400" />
              <Text>Remarks</Text>
            </HStack>
            <Text className="font-semibold text-typography-900">
              {props.activityDetails.remarks || "-"}
            </Text>
          </HStack>

          {props.children}
        </VStack>
      </AnimatedView>

      {/* Confirmation Modal */}
      <Actionsheet isOpen={showConfirmModal} onClose={handleCancelModal}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack space="lg" className="w-full p-4">
            <Heading className="text-center">
              Are you sure you want to cancel your booking ?
            </Heading>

            <Badge size="lg" className="justify-center">
              <BadgeText>This action cannot be undone!</BadgeText>
            </Badge>

            <HStack space="xl">
              <Button
                size="lg"
                action="negative"
                className="flex-1"
                onPress={handleCancelModal}
              >
                <ButtonText className="">Keep Booking</ButtonText>
              </Button>
              <Button size="lg" action="default" onPress={handleConfirmCancel}>
                <ButtonText>Yes, Cancel Booking</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};

export default DetailsCard;
