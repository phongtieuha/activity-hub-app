import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useRef } from "react";
import { Button, Text, View } from "react-native";

interface QrScreenshotProps {
  onBase64: (base64: string) => void;
}

export default function QrScreenshot({ onBase64 }: QrScreenshotProps) {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? null;
  const [hasCaptured, setHasCaptured] = React.useState(false);

  // When a QR code is detected, capture the image and call onBase64
  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (!hasCaptured && result?.data) {
      setHasCaptured(true);
      try {
        // Take a picture
        const photo = await cameraRef.current?.takePictureAsync({
          base64: false,
        });

        // Crop to QR bounds if available and valid
        let manipResult = photo;
        if (
          result.bounds &&
          photo?.uri &&
          result.bounds.origin &&
          result.bounds.size &&
          result.bounds.size.width > 0 &&
          result.bounds.size.height > 0
        ) {
          const { origin, size } = result.bounds;
          manipResult = await ImageManipulator.manipulateAsync(
            photo.uri,
            [
              {
                crop: {
                  originX: Math.max(0, origin.x),
                  originY: Math.max(0, origin.y),
                  width: size.width,
                  height: size.height,
                },
              },
            ],
            { base64: true }
          );
        } else if (photo?.uri) {
          manipResult = await ImageManipulator.manipulateAsync(photo.uri, [], {
            base64: true,
          });
        }

        if (manipResult.base64) {
          onBase64(manipResult.base64);
        }
      } catch (e) {
        console.log("Error capturing/cropping QR screenshot:", e);
      }
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No access to camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        ratio="16:9"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
}
