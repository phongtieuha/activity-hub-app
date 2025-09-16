import { generateQr } from "@/__generated-client/http-client-integration";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetSectionHeaderText,
  ActionsheetSectionList,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { differenceInHours } from "@/hooks/date-formatter";
import { decodeQrFromBase64 } from "@/hooks/useQrDecode";
import { QrPayload } from "@/models/qr";
import * as Brightness from "expo-brightness";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useMemo } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SectionItem = {
  title: string;
  onPress: () => void;
};

type Section = {
  title: string;
  data: SectionItem[];
};

export default function TabFourScreen() {
  // --- Navigation & Utilities ---
  const router = useRouter();

  // --- State ---
  const [showQRActionsheet, setShowQRActionsheet] = React.useState(false);
  const [qrBase64String, setQrBase64String] = React.useState("");
  const [qrData, setQrData] = React.useState<QrPayload>();
  const originalBrightnessRef = React.useRef<number | null>(null);

  // --- Derived State ---
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

  // --- Handlers ---
  const handleShowMyQR = async () => {
    const qrResp = await generateQr({
      type: "WALK_IN",
    });
    setQrBase64String(`data:image/png;base64,${qrResp.imageStr}`);
    setShowQRActionsheet(true);
    const qrData = await decodeQrFromBase64(`${qrResp.imageStr}`);
    if (qrData) {
      const parsedData: QrPayload = JSON.parse(qrData);
      setQrData(parsedData);
    }
  };

  const handleCloseQRActionsheet = () => setShowQRActionsheet(false);

  // --- Data ---
  const DATA: Section[] = [
    {
      title: "General",
      data: [{ title: "My QR Code", onPress: handleShowMyQR }],
    },
    {
      title: "Settings",
      data: [{ title: "Log out", onPress: () => router.replace("/logout") }],
    },
  ];

  // --- Effects ---
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

  return (
    <>
      <SafeAreaView className="px-4">
        <Card>
          <ActionsheetSectionList
            sections={DATA}
            keyExtractor={(item, index) => (item as SectionItem).title + index}
            renderItem={({ item }) => {
              const sectionItem = item as SectionItem;
              return (
                <ActionsheetItem onPress={sectionItem.onPress}>
                  <ActionsheetItemText className="text-lg">
                    {sectionItem.title}
                  </ActionsheetItemText>
                </ActionsheetItem>
              );
            }}
            renderSectionHeader={({ section }) => {
              const sectionObj = section as Section;
              return (
                <ActionsheetSectionHeaderText className="text-lg">
                  {sectionObj.title}
                </ActionsheetSectionHeaderText>
              );
            }}
          />
        </Card>
      </SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
                For commanders/trainers to scan
              </Text>
              <Divider className="my-4 bg-transparent" />
              <Box className="relative">
                <Image
                  source={{
                    uri: qrBase64String,
                  }}
                  style={styles.qrImage}
                />
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
      </KeyboardAvoidingView>
    </>
  );
}

const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  qrImage: {
    height: screenHeight * 0.3,
    width: "100%",
  },
});
