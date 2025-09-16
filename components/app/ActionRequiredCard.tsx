import { ActivityListItemDto } from "@/__generated-client/http-client-integration";
import {
  formatDate,
  formatDay,
  formatMonth,
  formatTime,
} from "@/hooks/date-formatter";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  MapPinIcon,
} from "lucide-react-native";
import React from "react";
import { Box } from "../ui/box";
import { Card } from "../ui/card";
import { Center } from "../ui/center";
import { Divider } from "../ui/divider";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Icon } from "../ui/icon";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

interface IProps {
  actionText: string;
  onPress: () => void;
  activity: ActivityListItemDto;
}

const ActionRequiredCard: React.FC<IProps> = ({
  actionText,
  onPress,
  activity,
}) => {
  return (
    <Pressable onPress={onPress}>
      <Card
        size="md"
        variant="elevated"
        className="shadow-sm p-0 overflow-hidden"
      >
        <HStack space="md">
          <Card
            size="sm"
            variant="filled"
            className="bg-gray-500 rounded-lg p-0 overflow-hidden"
          >
            <Center className="flex-1">
              <Text
                size="2xl"
                className="font-bold text-white tracking-wide text-center"
              >
                {formatDay(activity.startDate!)}
              </Text>
              <Text size="md" className="font-bold text-white tracking-wide">
                {formatMonth(activity.startDate!)}
              </Text>
            </Center>
            <Box className="bg-black mt-auto px-2 py-1 font-semibold">
              <Text size="sm" className="text-white">
                {formatTime(activity.startDate!)}
              </Text>
            </Box>
          </Card>
          <Box>
            <Text
              size="sm"
              className="font-bold text-typography-600 tracking-wide"
            >
              {activity.name}
            </Text>
            <Heading size="md" className="font-extrabold">
              {activity.timeline}
            </Heading>
            <Divider className="my-1 bg-transparent" />
            <VStack space="xs">
              <HStack space="sm" className="text-typography-500">
                <Icon as={CalendarDaysIcon} className="text-typography-500" />
                <Text size="sm">
                  {formatDate(activity.startDate!)} -{" "}
                  {formatDate(activity.endDate!)}
                </Text>
              </HStack>
              <HStack space="sm" className="text-typography-500">
                <Icon className="text-typography-500" as={MapPinIcon} />
                <Text size="sm">{activity.location}</Text>
              </HStack>
            </VStack>
          </Box>
        </HStack>

        <HStack className="border-t border-gray-300 px-4 py-2 items-center">
          <Text className="text-lg font-medium text-typography-900 mr-auto">
            {actionText}
          </Text>
          <Icon as={ChevronRightIcon} className="size-4" />
        </HStack>
      </Card>
    </Pressable>
  );
};

export default ActionRequiredCard;
