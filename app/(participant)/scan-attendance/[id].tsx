import {
  getById,
  scanAndAttend,
  ScanAndAttendRequestDto,
  ScanAndAttendResponseDto,
} from "@/__generated-client/http-client-integration";
import QrScanPreview from "@/components/app/QrScanPreview";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
} from "@/components/ui/actionsheet";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatDate, formatTime } from "@/hooks/date-formatter";
import { useNotification } from "@/hooks/useNotification";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircleIcon } from "lucide-react-native";
import React from "react";
import { Dimensions, KeyboardAvoidingView, Platform, View } from "react-native";
import { useParticipantContext } from "../context";

const ScanAttendance = () => {
  // 1) Navigation & utilities
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showNotification } = useNotification();
  const { setActivityDetails } = useParticipantContext();

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

    const payload: ScanAndAttendRequestDto = {
      token: data,
    };

    setIsScanningInProgress(true);
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
        {/* <AnimatedView
          entering={ElementEnteringFadeInLeft}
          delay={200}
          className="absolute left-4 top-16"
        >
          <Pressable onPress={() => router.back()}>
            <Icon as={ChevronLeftIcon} className="!size-8 text-white" />
          </Pressable>
        </AnimatedView> */}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Actionsheet
          isOpen={showActionsheet}
          onClose={handleCloseActionSheet}
          closeOnOverlayClick={false}
        >
          <ActionsheetBackdrop />
          <ActionsheetContent className="border-0 bg-green-600">
            {/* <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper> */}
            <Box className="w-full py-5" style={{ height: screenHeight * 0.7 }}>
              <Divider className="my-4 bg-transparent" />
              <Center>
                <Icon as={CheckCircleIcon} className="!size-20 text-white" />
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
                  className="text-center font-semibold text-white"
                >
                  {formatDate(scanQrResponseDto?.attendanceTakenAt!)},{" "}
                  {formatTime(scanQrResponseDto?.attendanceTakenAt!)}
                </Heading>
              </AnimatedCard>

              <Divider className="my-4 bg-transparent" />

              <Box className="mt-auto w-full">
                <AnimatedCard delay={cardFadeDelay * 4}>
                  <Button
                    onPress={async () => {
                      const detailResp = await getById(id as string);
                      setActivityDetails(detailResp?.data);
                      router.back();
                    }}
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
