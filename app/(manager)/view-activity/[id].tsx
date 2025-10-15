import {
  ActivityResponseDto,
  generateQr,
  getById,
} from "@/__generated-client/http-client-integration";
import DetailsCard from "@/components/app/DetailsCard";
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
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
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
  ScrollTextIcon,
} from "lucide-react-native";
import { DateTime } from "luxon";
import React, { useEffect, useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";

const ViewActivity = () => {
  // 1) Navigation & globals
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 2) Refs (device brightness)
  const originalBrightnessRef = React.useRef<number | null>(null);

  // 3) UI state
  const [refreshing, setRefreshing] = React.useState(false);
  const [isFetchingData, setIsFetchingData] = React.useState(false);
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
    setIsFetchingData(true);
    try {
      const detailResp = await getById(id as string);
      setActivityDetails(detailResp?.data);
    } finally {
      setIsFetchingData(false);
    }
  }, [id]);

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
        contentContainerClassName="relative flex-1"
        headerImage={
          <Image
            source={require("@/assets/images/soliders-outdoor-dark-2.png")}
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

        <Image
          source={require("@/assets/images/soliders-outdoor-dark-bg.png")}
          style={{
            width: screenWidth,
            height: screenHeight,
            position: "absolute",
            top: screenHeight * 0.3 - 50,
            left: 0,
          }}
        />

        {activityDetails && (
          <AnimatedCard
            style={styles.contentCard}
            className="rounded-3xl bg-white flex-1 pb-8 p-4"
          >
            <DetailsCard activityDetails={activityDetails} />

            <Divider className="h-8 bg-transparent" />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <AnimatedCard delay={cardFadeDelay}>
                <HStack space="xl" className=" justify-start">
                  <Pressable
                    onPress={handleRegisterAttendance}
                    className="min-w-[31.5%]"
                  >
                    <VStack className="py-4 px-6 border border-gray-200 items-center justify-center rounded-3xl gap-2">
                      <Center className="bg-red-100 p-2 rounded-full">
                        <Icon
                          as={QrCodeIcon}
                          className="text-red-600 !size-5"
                        />
                      </Center>
                      <Center>
                        <Text className="text-gray-900 font-semibold">
                          Generate
                        </Text>
                        <Text className="text-gray-900 font-semibold">QR</Text>
                      </Center>
                    </VStack>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(`../documents/${id}`)}
                    className="min-w-[31.5%]"
                  >
                    <VStack className="py-4 px-6 border border-gray-200 items-center justify-center rounded-3xl gap-2">
                      <Center className="bg-red-100 p-2 rounded-full">
                        <Icon as={FileIcon} className="text-red-600 !size-5" />
                      </Center>
                      <Center>
                        <Text className="text-gray-900 font-semibold">
                          View
                        </Text>
                        <Text className="text-gray-900 font-semibold">
                          Documents
                        </Text>
                      </Center>
                    </VStack>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(`../manage-activity/${id}`)}
                    className="min-w-[31.5%]"
                  >
                    <VStack className="py-4 px-6 border border-gray-200 items-center justify-center rounded-3xl gap-2">
                      <Center className="bg-red-100 p-2 rounded-full">
                        <Icon
                          as={ScrollTextIcon}
                          className="text-red-600 !size-5"
                        />
                      </Center>
                      <Center>
                        <Text className="text-gray-900 font-semibold">
                          Manage
                        </Text>
                        <Text className="text-gray-900 font-semibold">
                          Activity
                        </Text>
                      </Center>
                    </VStack>
                  </Pressable>
                </HStack>
              </AnimatedCard>
            </ScrollView>

            <AnimatedCard delay={cardFadeDelay} className="w-full mt-auto">
              <VStack space="xl">
                <Pressable
                  onPress={() => router.push(`../scan-attendance/${id}`)}
                >
                  <HStack className="border border-red-600 py-4 px-6 items-center justify-center rounded-3xl gap-2">
                    {/* <Icon
                      as={ScanQrCodeIcon}
                      className="text-red-600 !size-5"
                    /> */}
                    <Text className="text-red-600 font-semibold">Scan QR</Text>
                  </HStack>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`../update-attendance/${id}`)}
                >
                  <HStack className="bg-red-700/95 py-4 px-6 items-center justify-center rounded-3xl gap-2">
                    {/* <Icon as={UserPenIcon} className="text-white !size-5" /> */}
                    <Text className="text-white font-semibold">
                      Update Attendance
                    </Text>
                  </HStack>
                </Pressable>
              </VStack>
            </AnimatedCard>
          </AnimatedCard>
        )}

        {isFetchingData && (
          <AnimatedCard
            style={styles.contentCard}
            className="rounded-3xl bg-white flex-1 pb-8 gap-5 p-4"
          >
            <Skeleton className="h-[100px] rounded-3xl" />
            <SkeletonText _lines={10} className="h-5 rounded-3xl" />
          </AnimatedCard>
        )}
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
              For participants to scan
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
              variant="outline"
              action="secondary"
            >
              <ButtonText>Close</ButtonText>
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
    width: screenWidth,
    marginTop: -(screenHeight * 0.1),
  },
  buttonSection: {
    //marginTop: screenHeight * (0.3 / 2),
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
