import {
  ActivityResponseDto,
  generateQr,
  getById,
} from "@/__generated-client/http-client-integration";
import DetailsCard from "@/components/app/DetailsCard";
import { useGlobalLoading } from "@/components/GlobalLoading";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { differenceInHours } from "@/hooks/date-formatter";
import { decodeQrFromBase64 } from "@/hooks/useQrDecode";
import { QrPayload } from "@/models/qr";
import * as Brightness from "expo-brightness";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeftIcon,
  FileIcon,
  LoaderIcon,
  QrCodeIcon,
  ScanQrCodeIcon,
  ScrollTextIcon,
  UserPenIcon,
} from "lucide-react-native";
import { DateTime } from "luxon";
import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet } from "react-native";

const ViewActivity = () => {
  // 1) Navigation & globals
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const loading = useGlobalLoading();

  // 2) Refs (device brightness)
  const originalBrightnessRef = React.useRef<number | null>(null);

  // 3) UI state
  const [refreshing, setRefreshing] = React.useState(false);
  const [showQRActionsheet, setShowQRActionsheet] = React.useState(false);

  // 4) Data state
  const [activityDetails, setActivityDetails] =
    React.useState<ActivityResponseDto>();

  // 5) QR-related state
  const [qrBase64String, setQrBase64String] = React.useState("");
  const [qrData, setQrData] = React.useState<QrPayload>();
  const [isQrRefreshing, setIsQrRefreshing] = React.useState(false);

  // 6) Derived state
  const qrExpiry = useMemo(() => {
    if (qrData) {
      const generated = DateTime.fromSeconds(qrData.generatedAt).setZone(
        "Asia/Singapore"
      );
      const validUntil = DateTime.fromSeconds(qrData.validUntil).setZone(
        "Asia/Singapore"
      );
      return differenceInHours(generated, validUntil);
    }
    return null;
  }, [qrData]);

  // 7) Callbacks/handlers
  const handleCloseQRActionsheet = () => setShowQRActionsheet(false);
  const handleRegisterAttendance = async () => {
    setIsQrRefreshing(true);
    try {
      const qrResp = await generateQr({
        type: "MANAGER",
        activityId: id as string,
      });

      setQrBase64String(`data:image/png;base64,${qrResp.imageStr}`);
      setShowQRActionsheet(true);

      const qrData = await decodeQrFromBase64(`${qrResp.imageStr}`);
      if (qrData) {
        const parsedData: QrPayload = JSON.parse(qrData);
        setQrData(parsedData);
      }
    } finally {
      setIsQrRefreshing(false);
    }
  };

  // Extract fetch logic for reuse
  const fetchData = React.useCallback(async () => {
    loading.show("Loading activity...");
    try {
      const detailResp = await getById(id as string);
      setActivityDetails(detailResp?.data);
    } finally {
      loading.hide();
    }
  }, [id, loading]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // 8) Effects
  // Set brightness to max when QR actionsheet opens, restore when closes
  React.useEffect(() => {
    const handleBrightness = async () => {
      if (showQRActionsheet) {
        try {
          // Save original brightness only once
          if (originalBrightnessRef.current === null) {
            originalBrightnessRef.current =
              await Brightness.getBrightnessAsync();
          }

          await Brightness.setBrightnessAsync(1);
        } catch {
          // handle error silently
        }
      } else if (originalBrightnessRef.current !== null) {
        try {
          await Brightness.setBrightnessAsync(originalBrightnessRef.current);
        } catch {
          // handle error silently
        }
        originalBrightnessRef.current = null;
      }
    };
    handleBrightness();
  }, [showQRActionsheet]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  return (
    <>
      <ParallaxScrollView
        className="bg-gray-900"
        contentContainerClassName="relative flex-1"
        headerImage={
          <Image
            source={require("@/assets/images/soliders-outdoor.png")}
            style={styles.reactLogo}
          />
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <Pressable
          className="absolute top-16 left-4"
          onPress={() => router.back()}
        >
          <Icon as={ChevronLeftIcon} className="!size-8 text-white" />
        </Pressable>
        {activityDetails && (
          <Box style={styles.contentCard}>
            <DetailsCard activityDetails={activityDetails} />
          </Box>
        )}
        <Divider className="my-4 bg-transparent" />
        <VStack space="4xl" className="px-4" style={styles.buttonSection}>
          <AnimatedCard delay={cardFadeDelay}>
            <HStack space="4xl" className=" justify-start">
              <Button
                size="sm"
                variant="link"
                action="secondary"
                className="flex flex-col h-fit"
                onPress={() => router.push(`../documents/${id}`)}
              >
                <Box className="rounded-full bg-gray-300/90 p-3">
                  <Icon as={FileIcon} className="size-10 text-gray-700" />
                </Box>

                <VStack className=" items-center">
                  <ButtonText className="text-gray-300">View</ButtonText>
                  <ButtonText className="text-gray-300">Documents</ButtonText>
                </VStack>
              </Button>
              <Button
                size="sm"
                variant="link"
                action="secondary"
                className="flex flex-col h-fit"
                onPress={() => router.push(`../manage-activity/${id}`)}
              >
                <Box className="rounded-full bg-gray-300/90 p-3">
                  <Icon as={ScrollTextIcon} className="size-10 text-gray-700" />
                </Box>
                <VStack className=" items-center">
                  <ButtonText className="text-gray-300">Manage</ButtonText>
                  <ButtonText className="text-gray-300">Activity</ButtonText>
                </VStack>
              </Button>
            </HStack>
          </AnimatedCard>
          <Divider />
          <AnimatedCard delay={cardFadeDelay * 2}>
            <HStack className="justify-start pl-4 gap-10">
              <Button
                size="sm"
                variant="link"
                action="secondary"
                className="flex flex-col h-fit"
                onPress={() => router.push(`../scan-attendance/${id}`)}
              >
                <Box className="rounded-full bg-gray-300/90 p-3">
                  <Icon as={ScanQrCodeIcon} className="size-10 text-gray-700" />
                </Box>
                <VStack className=" items-center">
                  <ButtonText className="text-gray-300">Scan</ButtonText>
                  <ButtonText className="text-gray-300">QR</ButtonText>
                </VStack>
              </Button>
              <Button
                size="sm"
                variant="link"
                action="secondary"
                className="flex flex-col h-fit"
                onPress={handleRegisterAttendance}
              >
                <Box className="rounded-full bg-gray-300/90 p-3">
                  <Icon as={QrCodeIcon} className="size-10 text-gray-700" />
                </Box>
                <VStack className=" items-center">
                  <ButtonText className="text-gray-300">Generate</ButtonText>
                  <ButtonText className="text-gray-300">QR</ButtonText>
                </VStack>
              </Button>
              <Button
                size="sm"
                variant="link"
                action="secondary"
                className="flex flex-col h-fit"
                onPress={() => router.push(`../update-attendance/${id}`)}
              >
                <Box className="rounded-full bg-gray-300/90 p-3">
                  <Icon as={UserPenIcon} className="size-10 text-gray-700" />
                </Box>

                <VStack className=" items-center">
                  <ButtonText className="text-gray-300">Update</ButtonText>
                  <ButtonText className="text-gray-300">Attendance</ButtonText>
                </VStack>
              </Button>
            </HStack>
          </AnimatedCard>
        </VStack>
      </ParallaxScrollView>

      <Actionsheet
        isOpen={showQRActionsheet}
        onClose={handleCloseQRActionsheet}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full py-5">
            <Heading size="xl" className="font-bold text-center">
              Attendance QR Code
            </Heading>
            <Text size="md" className="text-center">
              For participants to scan test
            </Text>
            <Divider className="my-4 bg-transparent" />
            <Box className="relative">
              <Image source={{ uri: qrBase64String }} style={styles.qrImage} />
              {qrExpiry?.includes("-") && (
                <>
                  <Box className="bg-white/90 absolute inset-0"></Box>
                  <Center className=" absolute inset-0">
                    <Button
                      onPress={handleRegisterAttendance}
                      size="lg"
                      className=""
                      variant="solid"
                      action="negative"
                      disabled={isQrRefreshing}
                    >
                      <ButtonText>REFRESH QR</ButtonText>

                      {isQrRefreshing ? (
                        <ButtonSpinner color="white" />
                      ) : (
                        <ButtonIcon as={LoaderIcon}></ButtonIcon>
                      )}
                    </Button>
                  </Center>
                </>
              )}
            </Box>
            <Text size="md" className="text-center mt-4">
              QR code will expire in {qrExpiry}
            </Text>
            <Divider className="my-4 bg-transparent" />
            <Button
              onPress={handleCloseQRActionsheet}
              size="lg"
              className=""
              variant="outline"
              action="secondary"
            >
              <ButtonText>CLOSE</ButtonText>
            </Button>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};

export default ViewActivity;

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  contentCard: {
    position: "absolute",
    width: screenWidth,
    top: screenHeight * (0.3 / 2),
    left: 0,
  },
  buttonSection: {
    marginTop: screenHeight * (0.3 / 2),
  },
  reactLogo: {
    height: screenHeight * 0.3,
    width: screenWidth,
  },
  qrImage: {
    height: screenHeight * 0.3,
    width: "100%",
  },
});
