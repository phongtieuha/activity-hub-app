import { MapPinIcon, NotebookTextIcon, ShirtIcon } from "lucide-react-native";
import React from "react";

import {
  ActivityResponseDto,
  ActivitySlotDto,
} from "@/__generated-client/http-client-integration";
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
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

interface IProps {
  activityDetails: ActivityResponseDto;
  slot: ActivitySlotDto;
}

const DetailsNowCardForManager: React.FC<React.PropsWithChildren<IProps>> = (
  props
) => {
  const bookedSlots = (props.activityDetails.slots ?? []).filter(
    (x) => x.bookedByMe
  );

  return (
    <>
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
            NOW
          </Text>
        </HStack>
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

            <Divider className="border border-dashed border-gray-200 bg-transparent" />
            <HStack className="justify-between" space="xl">
              <VStack className="flex-1 items-start justify-center text-typography-300">
                <Text>Date</Text>
                <Text className="text-base font-semibold text-typography-900">
                  {formatDayInWord(props.slot.startDate)},{" "}
                  {formatShortDate(props.slot.startDate)},{" "}
                </Text>
              </VStack>

              <VStack className="flex-1 items-start justify-center text-typography-300">
                <Text>Time</Text>
                <Text className="font-semibold text-typography-900">
                  {formatTime(props.slot.startDate)}
                  {" - "}
                  {formatTime(props.slot.endDate)}
                </Text>
              </VStack>
            </HStack>
          </Card>
        </>
      )}

      <Divider className="h-6 bg-transparent" />

      <VStack space="md">
        <HStack className="justify-between">
          <HStack space="sm" className="items-center text-typography-300">
            <Icon as={ShirtIcon} className="text-typography-400" />
            <Text>Attire</Text>
          </HStack>
          <Text className="font-semibold text-typography-900">
            {ServerAttireToDisplayMapping[props.activityDetails.attire!] || "-"}
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
    </>
  );
};

export default DetailsNowCardForManager;
