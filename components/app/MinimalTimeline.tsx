import { DateTime } from "luxon";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Types
interface TimelineEvent {
  start: string;
  end: string;
}

interface MinimalTimelineProps<T> {
  events: (T & TimelineEvent)[];
  renderEvent?: (event: T & TimelineEvent, index: number) => React.ReactNode;
}

interface TimeSlot {
  time: string;
  hour: number;
}

interface EventLayout {
  top: number;
  height: number;
}

// Constants
const HOUR_HEIGHT = 60;
const TIME_LABEL_WIDTH = 60;
const EVENT_MARGIN_RIGHT = 16;
const TIMELINE_PADDING = 0; // Hours before/after events (set to 0 to start exactly at first event)
const MIN_TIMELINE_HEIGHT = 300;

const MinimalTimeline = <T extends object>({
  events,
  renderEvent,
}: MinimalTimelineProps<T>) => {
  //   const scrollViewRef = useRef<ScrollView>(null);

  // Generate time slots dynamically based on events
  const timeSlots = useMemo((): TimeSlot[] => {
    if (events.length === 0) {
      // Default to full day if no events
      return Array.from({ length: 24 }, (_, hour) => ({
        time: `${hour.toString().padStart(2, "0")}:00`,
        hour,
      }));
    }

    // Find earliest and latest times
    let earliestHour = Infinity;
    let latestHour = -Infinity;

    events.forEach((event) => {
      const startDate = DateTime.fromISO(event.start)
        .setZone("Asia/Singapore")
        .toJSDate();
      const endDate = DateTime.fromISO(event.end)
        .setZone("Asia/Singapore")
        .toJSDate();
      console.log("startDate", startDate);

      const startHour = startDate.getHours();
      let endHour = endDate.getHours();

      // Handle cross-midnight events
      if (endDate.getDate() > startDate.getDate() && endHour === 0) {
        endHour = 24;
      }

      earliestHour = Math.min(earliestHour, startHour);
      latestHour = Math.max(latestHour, endHour);
    });

    // Add padding and ensure valid bounds
    earliestHour = Math.max(0, earliestHour - TIMELINE_PADDING);
    latestHour = Math.min(23, latestHour + TIMELINE_PADDING);

    // Generate slots from earliest to latest
    return Array.from({ length: latestHour - earliestHour + 1 }, (_, i) => {
      const hour = earliestHour + i;
      return {
        time: `${hour.toString().padStart(2, "0")}:00`,
        hour,
      };
    });
  }, [events]);

  // Calculate timeline dimensions
  const timelineHeight = Math.max(
    timeSlots.length * HOUR_HEIGHT,
    MIN_TIMELINE_HEIGHT
  );
  const minHour = timeSlots.length > 0 ? timeSlots[0].hour : 0;

  // Calculate event positioning with offset for dynamic start
  const getEventLayout = (event: TimelineEvent): EventLayout => {
    const startDate = DateTime.fromISO(event.start)
      .setZone("Asia/Singapore")
      .toJSDate();
    const endDate = DateTime.fromISO(event.end)
      .setZone("Asia/Singapore")
      .toJSDate();

    const startHour = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    let endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    // Handle cross-midnight events (end time is next day)
    if (endDate.getDate() > startDate.getDate()) {
      // If end is next day and hour is 0 (midnight), treat as hour 24 for calculation
      if (endHour === 0) {
        endHour = 24;
      }
      // For other hours on next day, add 24 to get correct position
      else {
        endHour += 24;
      }
    }

    // Calculate position from top with offset for dynamic start hour
    const top =
      (startHour - minHour) * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;

    // Calculate height based on total duration in minutes
    const startTotalMinutes = startHour * 60 + startMinutes;
    const endTotalMinutes = endHour * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    return { top, height };
  };

  return (
    <View style={[styles.timelineWrapper, { minHeight: timelineHeight }]}>
      {/* Timeline background */}
      <View style={[styles.timelineBackground, { height: timelineHeight }]}>
        {/* Time markers */}
        {timeSlots.map((slot) => (
          <View
            key={slot.time}
            style={[
              styles.timeMarker,
              { top: (slot.hour - minHour) * HOUR_HEIGHT },
            ]}
          >
            <View style={styles.timeMarkerLine} />
            <View style={styles.timeLabel}>
              <Text style={styles.timeText}>{slot.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Events overlay */}
      <View style={styles.eventsOverlay}>
        {events.map((event, index) => {
          const layout = getEventLayout(event);
          return (
            <View
              key={index}
              style={[
                styles.eventContainer,
                {
                  position: "absolute",
                  top: layout.top,
                  height: layout.height,
                  left: TIME_LABEL_WIDTH,
                  right: EVENT_MARGIN_RIGHT,
                },
              ]}
            >
              {renderEvent ? renderEvent(event, index) : null}
            </View>
          );
        })}
      </View>
    </View>
    // </ScrollView>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  timelineWrapper: {
    position: "relative",
  },
  timelineBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  timeMarker: {
    position: "absolute",
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 1,
  },
  timeMarkerLine: {
    height: 1,
    backgroundColor: "#e5e7eb",
    flex: 1,
  },
  timeLabel: {
    position: "absolute",
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    top: -8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    backgroundColor: "#fafafa",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  eventsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventContainer: {
    // Styles should be provided by renderEvent or parent
  },
});

export default MinimalTimeline;
export type { MinimalTimelineProps, TimelineEvent };
