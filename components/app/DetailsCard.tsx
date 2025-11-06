import {
  CalendarPlus,
  MapPinIcon,
  NotebookTextIcon,
  ShirtIcon,
} from "lucide-react-native";
import React from "react";

import { ActivityResponseDto } from "@/__generated-client/http-client-integration";
import { AnimatedView } from "@/constants/animation";
import {
  formatDayInWord,
  formatShortDate,
  formatTime,
} from "@/hooks/date-formatter";
import { ServerAttireToDisplayMapping } from "@/models/activity";
import { Badge, BadgeText } from "../ui/badge";
import { Box } from "../ui/box";
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
}

const DetailsCard: React.FC<React.PropsWithChildren<IProps>> = (props) => {
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
      <VStack className="flex-1 items-start justify-center rounded-3xl bg-gray-100 px-6 py-3 text-typography-300">
        <Text className="">Start Date</Text>
        <Text className="text-base font-semibold text-typography-900">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)}
        </Text>
      </VStack>

      <VStack className="flex-1 items-start justify-center rounded-3xl bg-gray-100 px-6 py-3 text-typography-300">
        <Text className="">Time</Text>
        <Text className="font-semibold text-typography-900">
          {formatTime(startDate)} - {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
  );

  const dateRangeBlock = (startDate: string, endDate: string) => (
    <HStack className="justify-between" space="xl">
      <VStack className="flex-1 items-start justify-center rounded-3xl bg-gray-100 px-4 py-3 text-typography-300">
        <Text className="">Start Date</Text>
        <Text className="text-base font-semibold text-typography-900">
          {formatDayInWord(startDate)}, {formatShortDate(startDate)},{" "}
          {formatTime(startDate)}
        </Text>
      </VStack>

      <VStack className="flex-1 items-start justify-center rounded-3xl bg-gray-100 px-4 py-3 text-typography-300">
        <Text className="">End Date</Text>
        <Text className="font-semibold text-typography-900">
          {formatDayInWord(endDate)}, {formatShortDate(endDate)},{" "}
          {formatTime(endDate)}
        </Text>
      </VStack>
    </HStack>
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

      <AnimatedView delay={100}>
        {isStartDateSameAsEndDate
          ? sameDatesBlock(
              props.activityDetails.startDate!,
              props.activityDetails.endDate!
            )
          : dateRangeBlock(
              props.activityDetails.startDate!,
              props.activityDetails.endDate!
            )}
      </AnimatedView>

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

          {bookedSlots.length === 0 && (
            <>
              <Divider className="h-2 bg-transparent" />
              <Card className="gap-3 rounded-3xl border border-gray-200 p-4">
                <HStack className="justify-between">
                  <Text className="font-semibold">Booking Required</Text>

                  {props.activityDetails.participationType === "ELECTIVE" && (
                    <Badge action="error">
                      <BadgeText>Yes</BadgeText>
                    </Badge>
                  )}
                  {props.activityDetails.participationType === "COMPULSORY" && (
                    <Badge action="success">
                      <BadgeText>No</BadgeText>
                    </Badge>
                  )}
                </HStack>

                {props.activityDetails.participationType === "ELECTIVE" && (
                  <>
                    <Divider className="border border-dashed border-gray-200 bg-transparent" />
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
            </>
          )}

          {props.children}
        </VStack>
      </AnimatedView>
    </>
  );
};

export default DetailsCard;
