import {
  scanAndAttend,
  ScanAndAttendRequestDto,
  ScanAndAttendResponseDto,
} from "@/__generated-client/http-client-integration";
import QrScanPreview from "@/components/app/QrScanPreview";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { ChevronLeftIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatDate, formatTime } from "@/hooks/date-formatter";
import { useNotification } from "@/hooks/useNotification";
import { QrPayload } from "@/models/qr";
import { useRouter } from "expo-router";
import { CheckCircleIcon } from "lucide-react-native";
import React from "react";
import { Dimensions, KeyboardAvoidingView, Platform, View } from "react-native";

const ScanAttendance = () => {
  // 1) Navigation & utilities
  const router = useRouter();
  const { showNotification } = useNotification();

  // 2) State
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const [isScanningInProgress, setIsScanningInProgress] = React.useState(false);
  const [scanQrResponseDto, setScanQrResponseDto] =
    React.useState<ScanAndAttendResponseDto>();

  // 3) Handlers
  const handleCloseActionSheet = () => setShowActionsheet(false);

  // 5) QR scan handler
  const onQrScanned = async (data: string) => {
    if (isScanningInProgress) {
      return;
    }
    setIsScanningInProgress(true);
    const parsedData: QrPayload = JSON.parse(data);

    const payload: ScanAndAttendRequestDto = {
      token: data,
    };
    try {
      const result = await scanAndAttend(payload);

      setScanQrResponseDto(result);
      setShowActionsheet(true);
    } catch (error: any) {
      showNotification(error.message || "Error scanning QR", "error");
    }
    setIsScanningInProgress(false);
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
          <ActionsheetContent className="bg-green-600 border-0">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <Box className="w-full py-5" style={{ height: screenHeight * 0.7 }}>
              <Divider className="my-4 bg-transparent" />
              <Center>
                <Icon as={CheckCircleIcon} className="text-white !size-20" />
              </Center>
              <Divider className="my-4 bg-transparent" />
              <AnimatedCard delay={cardFadeDelay}>
                {/* <Heading size="xl" className="font-bold text-center text-white">
                  ALEXANDER GOH
                </Heading>
                <Heading size="xl" className="font-bold text-center text-white">
                  HUN HENG
                </Heading> */}
                <Text size="lg" className="text-center text-white">
                  Attendance has been taken
                </Text>
              </AnimatedCard>

              <AnimatedCard delay={cardFadeDelay * 2}>
                <Divider className="my-4 bg-transparent" />
                <Heading
                  size="xl"
                  className="font-semibold text-center text-white"
                >
                  {formatDate(scanQrResponseDto?.attendanceTakenAt!)},{" "}
                  {formatTime(scanQrResponseDto?.attendanceTakenAt!)}
                </Heading>
              </AnimatedCard>

              <Divider className="my-4 bg-transparent" />

              <Box className="mt-auto w-full">
                <AnimatedCard delay={cardFadeDelay * 4}>
                  <Button
                    onPress={() => router.back()}
                    size="lg"
                    variant="outline"
                    action="default"
                  >
                    <ButtonText className="text-white">Close</ButtonText>
                  </Button>
                </AnimatedCard>
              </Box>
            </Box>
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>
    </>
  );
};

export default ScanAttendance;

const screenHeight = Dimensions.get("window").height;
