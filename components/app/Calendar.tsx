import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

interface CalendarScreenProps {
  enabledDates?: string[];
  selectedDate?: string;
  onDateSelected?: (day: string) => void;
  minDate?: string; // Minimum date (format: YYYY-MM-DD)
  maxDate?: string; // Maximum date (format: YYYY-MM-DD)
  highAvailabilityDates?: string[]; // Dates with high availability (green background)
  lowAvailabilityDates?: string[]; // Dates with low availability (red background)
}

const CalendarScreen = ({
  enabledDates = [],
  onDateSelected,
  minDate,
  maxDate,
  highAvailabilityDates = [],
  lowAvailabilityDates = [],
}: CalendarScreenProps) => {
  const [selected, setSelected] = useState("");
  const today = new Date();
  const todayMonth = today.toISOString().slice(0, 7) + "-01";
  const [currentMonth, setCurrentMonth] = useState(todayMonth);

  const onDayPress = useCallback(
    (day: DateData) => {
      // Only allow selection of enabled dates
      if (enabledDates.includes(day.dateString)) {
        setSelected(day.dateString);
        if (typeof onDateSelected === "function") {
          onDateSelected(day.dateString);
        }
      }
    },
    [enabledDates, onDateSelected]
  );

  const onMonthChange = useCallback(
    (month: any) => {
      const monthStr = month.dateString;
      const newMonthKey = monthStr.substring(0, 7); // Extract YYYY-MM

      // Check if the new month is within allowed range
      if (minDate) {
        const minMonthKey = minDate.substring(0, 7);
        if (newMonthKey < minMonthKey) {
          return; // Don't allow navigation before minDate
        }
      }

      if (maxDate) {
        const maxMonthKey = maxDate.substring(0, 7);
        if (newMonthKey > maxMonthKey) {
          return; // Don't allow navigation after maxDate
        }
      }

      setCurrentMonth(monthStr);
    },
    [minDate, maxDate]
  );

  // Calculate if arrows should be disabled
  const shouldDisableLeftArrow = useMemo(() => {
    if (!minDate) return false;
    const currentMonthKey = currentMonth.substring(0, 7); // Extract YYYY-MM from current month
    const minMonthKey = minDate.substring(0, 7); // Extract YYYY-MM from minDate
    return currentMonthKey <= minMonthKey;
  }, [currentMonth, minDate]);

  const shouldDisableRightArrow = useMemo(() => {
    if (!maxDate) return false;
    const currentMonthKey = currentMonth.substring(0, 7); // Extract YYYY-MM from current month
    const maxMonthKey = maxDate.substring(0, 7); // Extract YYYY-MM from maxDate
    return currentMonthKey >= maxMonthKey;
  }, [currentMonth, maxDate]);

  // Generate markedDates with conditional availability colors
  const markedDates = useMemo(() => {
    const marked: any = {};

    // Add styling for enabled dates with availability-based colors
    enabledDates.forEach((dateString) => {
      const isHighAvailability = highAvailabilityDates.includes(dateString);
      const isLowAvailability = lowAvailabilityDates.includes(dateString);

      let backgroundColor = "#f9f9f9"; // Default light gray
      let borderColor = "#374151"; // Default gray border
      let textColor = "#374151"; // Default gray text

      if (isHighAvailability) {
        backgroundColor = "#f0fdf4"; // Green background (bg-green-50)
        borderColor = "#22c55e"; // Darker green border
        textColor = "#22c55e"; // text-green-500
      } else if (isLowAvailability) {
        backgroundColor = "#fef2f2"; // Red background
        borderColor = "#dc2626"; // Darker red border
        textColor = "#dc2626"; // White text on red
      }

      marked[dateString] = {
        disabled: false,
        customStyles: {
          container: {
            backgroundColor,
            borderWidth: 1,
            borderColor,
            borderRadius: 20, // Circular appearance
          },
          text: {
            color: textColor,
            fontWeight: "500",
          },
        },
      };
    });

    // Add selection styling - override colors for selected date
    if (selected && enabledDates.includes(selected)) {
      const isHighAvailability = highAvailabilityDates.includes(selected);
      const isLowAvailability = lowAvailabilityDates.includes(selected);

      let selectedBg = "#6b7280"; // Default selected gray
      let selectedBorder = "#4b5563";

      if (isHighAvailability) {
        selectedBg = "#15803d"; // Darker green for selection
        selectedBorder = "#166534";
      } else if (isLowAvailability) {
        selectedBg = "#dc2626"; // Darker red for selection
        selectedBorder = "#b91c1c";
      }

      marked[selected] = {
        ...marked[selected],
        selected: true,
        customStyles: {
          container: {
            backgroundColor: selectedBg,
            borderWidth: 1, // Thicker border for selection
            borderColor: selectedBorder,
            borderRadius: 20,
          },
          text: {
            color: "white",
            fontWeight: "600", // Bolder text for selection
          },
        },
      };
    }

    return marked;
  }, [selected, enabledDates, highAvailabilityDates, lowAvailabilityDates]);

  return (
    <VStack>
      <Calendar
        key={`${minDate}-${maxDate}-${currentMonth}`} // Force re-render when restrictions change
        enableSwipeMonths={true} // Enable swipe for smooth slide transitions
        style={styles.calendar}
        markingType="custom" // Enable custom styling
        minDate={minDate} // Restrict navigation to dates after this
        maxDate={maxDate} // Restrict navigation to dates before this
        current={currentMonth} // Control current month
        onMonthChange={onMonthChange} // Handle month changes
        theme={{
          arrowColor: "#4b5563", // text-gray-600
          monthTextColor: "#000000",
          textSectionTitleColor: "#000000",
          calendarBackground: "#ffffff",
          backgroundColor: "#ffffff",
          textDisabledColor: "#9ca3af", // Gray color for disabled days
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "bold",
          todayTextColor: "#dc2626", // Red color for today's date
        }}
        hideArrows={false}
        hideExtraDays={false}
        onDayPress={onDayPress}
        markedDates={markedDates}
        disableAllTouchEventsForDisabledDays={true}
        disableArrowLeft={shouldDisableLeftArrow}
        disableArrowRight={shouldDisableRightArrow}
      />

      {/* Availability Legend */}
      <HStack className="gap-6 px-4 pt-4">
        <HStack className="items-center gap-2">
          <Box className="h-3 w-3 rounded-full bg-green-500" />
          <Text className="text-sm text-green-500">High availability</Text>
        </HStack>
        <HStack className="items-center gap-2">
          <Box className="h-3 w-3 rounded-full bg-red-600" />
          <Text className="text-sm text-red-500">Low availability</Text>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  calendar: {
    borderWidth: 1,
    borderColor: "#d1d5db", // border-gray-300
    borderRadius: 24, // rounded-3xl in Tailwind is 1.5rem = 24px
    overflow: "hidden",
  },
});
