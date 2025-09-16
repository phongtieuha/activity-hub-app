import {
  CalendarDaysIcon,
  CalendarPlus,
  ClockIcon,
  MapPinIcon,
  ShirtIcon,
} from "lucide-react-native";
import React from "react";

import { ActivityResponseDto } from "@/__generated-client/http-client-integration";
import {
  formatDate,
  formatDayInWord,
  formatTime,
} from "@/hooks/date-formatter";
import { ServerAttireToDisplayMapping } from "@/models/activity";
import { Badge, BadgeText } from "../ui/badge";
import { Button, ButtonIcon } from "../ui/button";
import { Card } from "../ui/card";
import { Divider } from "../ui/divider";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

interface IProps {
  activityDetails: ActivityResponseDto;
}

const DetailsCard: React.FC<IProps> = (props) => {
  return (
    <Card className="mx-4">
      <HStack className="items-center justify-between">
        <Text size="md" className="font-bold text-blue-600 tracking-wide">
          {props.activityDetails.timeline}
        </Text>
        <Button variant="link" action="secondary">
          <ButtonIcon as={CalendarPlus} className=""></ButtonIcon>
        </Button>
      </HStack>
      <Heading size="xl" className="font-extrabold">
        {props.activityDetails.name}
      </Heading>
      <Divider className="my-2 bg-transparent" />
      <VStack space="md">
        <HStack className="justify-between">
          <HStack space="sm" className="text-typography-300 items-center">
            <Icon as={CalendarDaysIcon} className="text-typography-400" />
            <Text>Start</Text>
          </HStack>
          <Text className="text-typography-900 font-semibold">
            {formatDayInWord(props.activityDetails.startDate!)},{" "}
            {formatDate(props.activityDetails.startDate!)}
          </Text>
        </HStack>
        <HStack className="justify-between">
          <HStack space="sm" className="text-typography-300 items-center">
            <Icon as={ClockIcon} className="text-typography-400" />
            <Text>Time</Text>
          </HStack>
          <Text className="text-typography-900 font-semibold">
            {formatTime(props.activityDetails.startDate!)} -{" "}
            {formatTime(props.activityDetails.endDate!)}
          </Text>
        </HStack>
        <HStack className="justify-between items-start">
          <HStack space="sm" className="text-typography-300 items-center">
            <Icon as={MapPinIcon} className="text-typography-400" />
            <Text>Venue</Text>
          </HStack>
          <VStack className="items-end">
            <Text className="text-typography-900 font-semibold">
              {props.activityDetails.location}
            </Text>
            <Badge variant="solid" action="success">
              <BadgeText>{props.activityDetails.zone}</BadgeText>
            </Badge>
          </VStack>
        </HStack>
        <HStack className="justify-between">
          <HStack space="sm" className="text-typography-300 items-center">
            <Icon as={ShirtIcon} className="text-typography-400" />
            <Text>Attire</Text>
          </HStack>
          <Text className="text-typography-900 font-semibold">
            {ServerAttireToDisplayMapping[props.activityDetails.attire!]}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
};

export default DetailsCard;
