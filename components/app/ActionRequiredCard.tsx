import { ActivityListItemDto } from "@/__generated-client/http-client-integration";
import { formatDate } from "@/hooks/date-formatter";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  MapPinIcon,
} from "lucide-react-native";
import React from "react";
import { Box } from "../ui/box";
import { Button, ButtonIcon, ButtonText } from "../ui/button";
import { Card } from "../ui/card";
import { Divider } from "../ui/divider";
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
        className="rounded-3xl border border-red-600"
      >
        <VStack className="gap-[2px]">
          {/* <HStack space="sm" className="text-typography-500 items-center">
            <Icon as={ClockIcon} className="text-typography-500 !size-4 " />
            <Text size="sm" className="font-semibold">
              {formatTime(activity.startDate!)} -{" "}
              {formatTime(activity.endDate!)}
            </Text>
          </HStack> */}

          <Box>
            {/* <HStack space="sm" className="text-typography-300 items-center">
              <Box className="size-2 rounded-full bg-blue-600 mx-1" />
              <Text size="sm" className="font-bold text-blue-600 tracking-wide">
                {activity.timeline}
              </Text>
            </HStack> */}

            <Text size="md" className="font-extrabold text-typography-900">
              {activity.name}
            </Text>
          </Box>

          <HStack space="sm" className="items-center text-typography-500">
            <Icon
              as={CalendarDaysIcon}
              className="!size-4 text-typography-500"
            />
            <Text size="sm">
              {formatDate(activity.startDate!)}
              {formatDate(activity.endDate!) !== formatDate(activity.startDate!)
                ? ` - ${formatDate(activity.endDate!)}`
                : ""}
            </Text>
          </HStack>

          <HStack space="sm" className="items-center text-typography-500">
            <Icon className="!size-4 text-typography-500" as={MapPinIcon} />
            <Text size="sm">{activity.location}</Text>
          </HStack>

          <Divider className="h-2 bg-transparent" />

          <Button
            variant="outline"
            action="negative"
            className="pointer-events-none w-full justify-between rounded-3xl"
          >
            <ButtonText>{actionText}</ButtonText>
            <ButtonIcon as={ChevronRightIcon} className="size-4" />
          </Button>
        </VStack>
      </Card>
    </Pressable>
  );
};

export default ActionRequiredCard;
