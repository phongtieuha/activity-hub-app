import { ActivityListItemDto } from "@/__generated-client/http-client-integration";
import { formatDate, formatTime } from "@/hooks/date-formatter";
import {
  ArrowUpRight,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react-native";
import React from "react";
import { Box } from "../ui/box";
import { Card } from "../ui/card";
import { HStack } from "../ui/hstack";
import { Icon } from "../ui/icon";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

interface IProps {
  onPress: () => void;
  activity: ActivityListItemDto;
}

const ScheduledCard: React.FC<IProps> = ({ onPress, activity }) => {
  return (
    <Pressable onPress={onPress}>
      <Card
        size="md"
        variant="elevated"
        className="rounded-3xl bg-gray-50"
        style={{ position: "relative" }}
      >
        <ArrowUpRight
          color="#9ca3af"
          style={{ position: "absolute", right: 16, bottom: 16 }}
        />
        <VStack className="gap-[2px]">
          <HStack space="sm" className="text-typography-500 items-center">
            <Icon as={ClockIcon} className="text-typography-500 !size-4 " />
            <Text size="sm" className="font-semibold">
              {formatTime(activity.startDate!)} -{" "}
              {formatTime(activity.endDate!)}
            </Text>
          </HStack>

          <Box>
            <HStack space="sm" className="text-typography-300 items-center">
              <Box className="size-2 rounded-full bg-blue-600 mx-1" />
              <Text size="sm" className="font-bold text-blue-600 tracking-wide">
                {activity.timeline}
              </Text>
            </HStack>

            <Text size="md" className="font-extrabold text-typography-900">
              {activity.name}
            </Text>
          </Box>

          <HStack space="sm" className="text-typography-500 items-center">
            <Icon
              as={CalendarDaysIcon}
              className="text-typography-500 !size-4"
            />
            <Text size="sm">
              {formatDate(activity.startDate!)}
              {formatDate(activity.endDate!) !== formatDate(activity.startDate!)
                ? ` - ${formatDate(activity.endDate!)}`
                : ""}
            </Text>
          </HStack>

          <HStack space="sm" className="text-typography-500 items-center">
            <Icon className="text-typography-500 !size-4" as={MapPinIcon} />
            <Text size="sm">{activity.location}</Text>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );
};

export default ScheduledCard;
