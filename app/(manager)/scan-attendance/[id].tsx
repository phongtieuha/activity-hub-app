import {
  list2,
  scanQr,
  ScanQrRequestDto,
  ScanQrResponseDto,
  scanWalkInQr,
} from "@/__generated-client/http-client-integration";
import QrScanPreview from "@/components/app/QrScanPreview";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetFlatList,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ChevronLeftIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { formatDateTime } from "@/hooks/date-formatter";
import { useNotification } from "@/hooks/useNotification";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  View,
} from "react-native";

type AttendanceRecord = {
  id: string;
  name: string;
  attendAt: string;
};

const ScanAttendance = () => {
  // 1) Navigation & utilities
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showNotification } = useNotification();

  // 2) UI state
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = React.useState(false);
  const [attendanceSheetHeight, setAttendanceSheetHeight] = React.useState(
    screenHeight * 0.3
  );
  const [scannedQrString, setScannedQrString] = React.useState("");

  // 3) Data state
  const [attendanceRecords, setAttendanceRecords] = React.useState<
    AttendanceRecord[]
  >([]);
  const [scanQrResponseDto, setScanQrResponseDto] =
    React.useState<ScanQrResponseDto>();

  // 4) Flags
  const [isScanningInProgress, setIsScanningInProgress] = React.useState(false);

  // 5) Refs
  const panY = useRef(attendanceSheetHeight);

  // 6) Gestures - PanResponder for drag-to-resize (works on iOS/Android)
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (_) => {
          panY.current = attendanceSheetHeight;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            setAttendanceSheetHeight(screenHeight * 0.3);
          } else {
            // let newHeight = panY.current - gestureState.dy;
            // newHeight = Math.max(
            //   screenHeight * 0.2,
            //   Math.min(newHeight, screenHeight * 0.7)
            // );
            setAttendanceSheetHeight(screenHeight * 0.7);
          }
        },
      }),
    [attendanceSheetHeight]
  );

  // 7) Helpers
  const handleCloseActionSheet = () => setShowActionsheet(false);
  const handleCloseAttendanceSheet = () => setShowAttendanceSheet(false);

  // 8) Item renderer
  const Item = React.useCallback(
    ({ name, attendAt }: AttendanceRecord) => (
      <ActionsheetItem className="border-t border-gray-300 justify-between">
        <ActionsheetItemText className="font-bold text-lg">
          {name}
        </ActionsheetItemText>
        <ActionsheetItemText className="text-gray-700 text-lg">
          {formatDateTime(attendAt)}
        </ActionsheetItemText>
      </ActionsheetItem>
    ),
    []
  );

  // 9) Handlers
  const onQrScanned = async (data: string) => {
    setScannedQrString(data);
    if (isScanningInProgress) {
      return;
    }

    const payload: ScanQrRequestDto = {
      token: data,
    };

    setIsScanningInProgress(true);
    let result: ScanQrResponseDto | null = null;
    try {
      result = await scanQr(payload);

      const participantsResp = await list2(id as string, {
        pageNumber: 1,
        pageSize: 1000,
        attendanceStatus: "PRESENT",
      });
      setAttendanceRecords(
        participantsResp.data?.map((p) => ({
          id: p.userId!,
          name: p.name!,
          attendAt: p.addedAt!,
        })) ?? []
      );
      setShowAttendanceSheet(true);
    } catch (error: any) {
      if (error.message.includes("Invalid QR code type")) {
        setScanQrResponseDto(result!);
        setShowActionsheet(true);
      }
    }
    setIsScanningInProgress(false);
  };

  const handleAddNewParticipant = async () => {
    try {
      await scanWalkInQr({
        token: scannedQrString,
      });

      const participantsResp = await list2(id as string, {
        pageNumber: 1,
        pageSize: 1000,
        attendanceStatus: "PRESENT",
      });
      setAttendanceRecords(
        participantsResp.data?.map((p) => ({
          id: p.userId!,
          name: p.name!,
          attendAt: p.addedAt!,
        })) ?? []
      );
      setShowActionsheet(false);
      setShowAttendanceSheet(true);
    } catch (error: any) {
      showNotification(
        error.message || "Error adding new participant",
        "error"
      );
    }
  };

  return (
    <>
      <View className="relative" style={{ minHeight: screenHeight }}>
        <QrScanPreview onQrScanned={onQrScanned} />
        <Pressable
          className="absolute top-16 left-4"
          onPress={() => router.back()}
        >
          <Icon as={ChevronLeftIcon} className="!size-8 text-white" />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Actionsheet isOpen={showActionsheet} onClose={handleCloseActionSheet}>
          <ActionsheetBackdrop />
          <ActionsheetContent className="">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <VStack
              className="w-full py-5 justify-between"
              style={{ height: screenHeight * 0.3 }}
            >
              <Heading size="xl" className="font-bold">
                New participant
              </Heading>
              <Text size="lg" className="">
                {/* {scanQrResponseDto?.userName}  */}
                This participant is not in the list, do you want to add him/her?
              </Text>

              <Divider className="my-4 bg-transparent" />

              <VStack space="xl">
                <Button
                  size="lg"
                  variant="solid"
                  action="negative"
                  onPress={() => handleAddNewParticipant()}
                >
                  <ButtonText className="text-white">Confirm</ButtonText>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  action="default"
                  onPress={handleCloseActionSheet}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </VStack>
            </VStack>
          </ActionsheetContent>
        </Actionsheet>
        <Actionsheet
          isOpen={showAttendanceSheet}
          onClose={handleCloseAttendanceSheet}
        >
          <ActionsheetBackdrop />
          <ActionsheetContent className="">
            <ActionsheetDragIndicatorWrapper {...panResponder.panHandlers}>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <Box
              className="w-full py-5"
              style={{ height: attendanceSheetHeight }}
            >
              <Heading size="xl" className="font-bold">
                Registered attendance
              </Heading>
              <HStack className="items-center gap-2">
                <Text size="md" className="">
                  You have taken attendance of
                </Text>
                <Badge action="success">
                  <Text>{attendanceRecords.length} attendee(s)</Text>
                </Badge>
              </HStack>
              <Divider className="my-4 bg-transparent" />

              <ActionsheetFlatList
                data={attendanceRecords}
                renderItem={({ item }) => (
                  <Item {...(item as AttendanceRecord)} />
                )}
                keyExtractor={(item, _index) => (item as AttendanceRecord).id}
              />
            </Box>
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>
    </>
  );
};

export default ScanAttendance;

const screenHeight = Dimensions.get("window").height;
