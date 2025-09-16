import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

interface IQrScanPreviewProps {
  readonly onQrScanned: (qrData: string) => void;
}

export default function QrScanPreview(props: IQrScanPreviewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? null;
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const scanLock = useRef(false);

  const [qrDetected, setQrDetected] = useState(false);
  const [qrBox, setQrBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLock.current) return;
    if (!scanned) {
      if (typeof result?.data === "string" && result.data.length > 0) {
        setQrDetected(true);
        // Try to get bounding box info from result
        if (result?.bounds) {
          // Expo CameraView may provide bounds: { origin: {x, y}, size: {width, height} }
          setQrBox({
            x: result.bounds.origin.x - 10,
            y: result.bounds.origin.y - 10,
            width: result.bounds.size.width + 20,
            height: result.bounds.size.height + 20,
          });
        } else {
          setQrBox(null);
        }
        // Lock before any state updates to prevent race
        scanLock.current = true;
        setScanned(true);
        setData(result.data);
        props.onQrScanned(result.data);
      } else {
        setQrDetected(false);
        setQrBox(null);
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
        style={{ flex: 1 }}
        facing={"back"}
        ratio="16:9"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      {/* Dashed square overlay when QR detected and not scanned */}
      {qrDetected &&
        !scanned &&
        (qrBox ? (
          <View
            style={{
              position: "absolute",
              left: qrBox.x,
              top: qrBox.y,
              width: qrBox.width,
              height: qrBox.height,
              borderWidth: 2,
              borderColor: "#fff",
              borderStyle: "dashed",
              borderRadius: 16,
              zIndex: 10,
            }}
          />
        ) : (
          <View style={styles.dashedSquare} />
        ))}
      <View style={styles.overlay}>
        {!scanned ? (
          <Text style={{ color: "white" }}>Point camera at QR code</Text>
        ) : (
          <View style={{ alignItems: "center" }}>
            {/* {data && (
              <Text
                style={{
                  color: "white",
                  backgroundColor: "#222",
                  padding: 8,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                Scanned: {data}
              </Text>
            )} */}
            <Button
              title={"Scan Again"}
              onPress={() => {
                setScanned(false);
                setData(null);
                setQrDetected(false);
                scanLock.current = false;
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
  },
  dashedSquare: {
    position: "absolute",
    top: "40%",
    left: "20%",
    width: "60%",
    height: 200,
    borderWidth: 2,
    borderColor: "#fff",
    borderStyle: "dashed",
    borderRadius: 16,
    zIndex: 10,
  },
});
