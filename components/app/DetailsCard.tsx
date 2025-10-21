import {
  BookCheckIcon,
  CalendarPlus,
  ChevronsRightIcon,
  MapPinIcon,
  NotebookTextIcon,
  ShirtIcon,
} from "lucide-react-native";
import React, { useState } from "react";

import {
  ActivityResponseDto,
  ActivitySlotDto,
} from "@/__generated-client/http-client-integration";
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
import { Badge, BadgeText } from "../ui/badge";
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
  showBookNowButton?: boolean;
  showBookedSlots?: boolean;
  showCancelButton?: boolean;
}

const DetailsCard: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlotToCancel, setSelectedSlotToCancel] =
    useState<ActivitySlotDto | null>(null);

  const isStartDateSameAsEndDate =
    props.activityDetails.startDate?.split("T")[0] ===
    props.activityDetails.endDate?.split("T")[0];

  const isBookingStartDateSameAsEndDate =
    props.activityDetails.bookingWindowStartDate?.split("T")[0] ===
    props.activityDetails.bookingWindowEndDate?.split("T")[0];

  const bookedSlots = (props.activityDetails.slots ?? []).filter(
    (x) => x.bookedByMe
  );

  const sameDatesBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="text-typography-300 items-start rounded-3xl bg-gray-100 justify-center px-6 py-3 flex-1">
        <Text className="">Start Date</Text>
        <Text className="text-typography-900 font-semibold text-base">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)}
        </Text>
      </VStack>

      <VStack className="text-typography-300 items-start rounded-3xl bg-gray-100 justify-center px-6 py-3 flex-1">
        <Text className="">Time</Text>
        <Text className="text-typography-900 font-semibold">
          {formatTime(startDate)} - {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
  );

  const dateRangeBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="text-typography-300 items-start rounded-3xl bg-gray-100 justify-center px-4 py-3 flex-1">
        <Text className="">Start Date</Text>
        <Text className="text-typography-900 font-semibold text-base">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)},{" "}
          {formatTime(startDate)}
        </Text>
      </VStack>

      <VStack className="text-typography-300 items-start rounded-3xl bg-gray-100 justify-center px-4 py-3 flex-1">
        <Text className="">End Date</Text>
        <Text className="text-typography-900 font-semibold">
          {formatDayInWord(endDate)}, {formatShortDate(endDate)},{" "}
          {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
  );

  const bookingSameDatesBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="text-typography-300 items-start justify-center flex-1">
        <Text className="">Available at</Text>
        <Text className="text-typography-900 font-semibold text-base">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)}
        </Text>
      </VStack>

      <VStack className="text-typography-300 items-start justify-center flex-1">
        <Text className="">Close at</Text>
        <Text className="text-typography-900 font-semibold">
          {formatTime(startDate)} - {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
  );

  const bookingDateRangeBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="text-typography-300 items-start justify-center flex-1">
        <Text>Available at</Text>
        <Text className="text-typography-900 font-semibold text-base">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)},{" "}
          {formatTime(startDate)}
        </Text>
      </VStack>

      <VStack className="text-typography-300 items-start justify-center flex-1">
        <Text>Close at</Text>
        <Text className="text-typography-900 font-semibold">
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
      <Badge action="error" size="lg" className="justify-center">
        <BadgeText className="text-center">
          This activity is {props.activityDetails.participationType}
        </BadgeText>
      </Badge>
      <Divider className="h-1 bg-transparent" />

      <HStack className="items-center justify-between">
        <HStack space="sm" className="text-typography-300 items-center">
          <Box className="size-2 rounded-full bg-blue-600 mx-1" />
          <Text size="md" className="font-bold text-blue-600 tracking-wide">
            {props.activityDetails.timeline}
          </Text>
        </HStack>

        <Pressable className="border border-gray-300 rounded-full p-2.5">
          <Icon as={CalendarPlus} className="text-gray-600"></Icon>
        </Pressable>
      </HStack>

      <Heading size="xl" className="font-extrabold">
        {props.activityDetails.name}
      </Heading>
      <Divider className="h-1 bg-transparent" />
      <HStack className="justify-between items-start">
        <HStack space="sm" className="text-typography-300 items-center">
          <Icon as={MapPinIcon} className="text-typography-400" />
          <Text>{props.activityDetails.location || "-"}</Text>
          <Badge variant="solid" action="success">
            <BadgeText>{props.activityDetails.zone || "-"}</BadgeText>
          </Badge>
        </HStack>
      </HStack>
      <Divider className="h-6 bg-transparent" />
      {isStartDateSameAsEndDate
        ? sameDatesBlock(
            props.activityDetails.startDate!,
            props.activityDetails.endDate!
          )
        : dateRangeBlock(
            props.activityDetails.startDate!,
            props.activityDetails.endDate!
          )}

      <Divider className="h-6 bg-transparent" />

      <VStack space="md">
        <HStack className="justify-between">
          <HStack space="sm" className="text-typography-300 items-center">
            <Icon as={ShirtIcon} className="text-typography-400" />
            <Text>Attire</Text>
          </HStack>
          <Text className="text-typography-900 font-semibold">
            {ServerAttireToDisplayMapping[props.activityDetails.attire!] || "-"}
          </Text>
        </HStack>
        <HStack className="justify-between">
          <HStack space="sm" className="text-typography-300 items-center">
            <Icon as={NotebookTextIcon} className="text-typography-400" />
            <Text>Remarks</Text>
          </HStack>
          <Text className="text-typography-900 font-semibold">
            {props.activityDetails.remarks || "-"}
          </Text>
        </HStack>

        <Divider className="h-2 bg-transparent" />

        <Card className="p-4 rounded-3xl border border-gray-200 gap-3">
          <HStack className="justify-between">
            <Heading className="font-semibold">Booking Required</Heading>

            {props.activityDetails.bookingWindowRequired && (
              <Badge action="error">
                <BadgeText>Yes</BadgeText>
              </Badge>
            )}
            {!props.activityDetails.bookingWindowRequired && (
              <Badge action="success">
                <BadgeText>No</BadgeText>
              </Badge>
            )}
          </HStack>

          {props.activityDetails.bookingWindowRequired && (
            <>
              <Divider className="border border-gray-200 border-dashed bg-transparent" />
              {props.activityDetails.bookingWindowRequired &&
                (isBookingStartDateSameAsEndDate
                  ? bookingSameDatesBlock(
                      props.activityDetails.bookingWindowStartDate!,
                      props.activityDetails.bookingWindowEndDate!
                    )
                  : bookingDateRangeBlock(
                      props.activityDetails.bookingWindowStartDate!,
                      props.activityDetails.bookingWindowEndDate!
                    ))}
            </>
          )}

          {props.showBookedSlots && (
            <>
              <Divider className="border border-gray-200 border-dashed bg-transparent" />
              <VStack className="text-typography-300 items-start justify-center">
                <Text className="">Booked slot</Text>
                {bookedSlots.map((slot) => (
                  <HStack
                    key={slot.activitySlotId}
                    className="justify-between items-center self-stretch"
                  >
                    <Text className="text-typography-900 font-semibold text-base">
                      {formatDayInWord(slot.startDate)},{" "}
                      {formatShortDate(slot.startDate)},{" "}
                      {formatSlotTime(slot.startDate)} -{" "}
                      {formatSlotTime(slot.endDate)}
                    </Text>
                    {props.showCancelButton && (
                      <Button
                        size="xs"
                        variant="outline"
                        action="negative"
                        onPress={() => handleCancelBooking(slot)}
                      >
                        <ButtonText>Cancel Booking</ButtonText>
                      </Button>
                    )}
                  </HStack>
                ))}
                {bookedSlots.length === 0 && (
                  <Text className="text-typography-900 font-semibold text-base">
                    -
                  </Text>
                )}
              </VStack>
            </>
          )}

          {props.showBookNowButton && (
            <>
              <Divider className="border border-gray-200 border-dashed bg-transparent" />
              <Pressable onPress={props.onBookNowPress}>
                <HStack className="bg-red-200 py-2 px-4 items-center justify-between rounded-3xl gap-2">
                  <Icon as={BookCheckIcon} className="text-gray-900 !size-4" />
                  <Text className="text-gray-900 font-semibold">Book now</Text>
                  <Icon
                    as={ChevronsRightIcon}
                    className="text-gray-900 !size-5"
                  />
                </HStack>
              </Pressable>
            </>
          )}
        </Card>

        {props.children}
      </VStack>

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
