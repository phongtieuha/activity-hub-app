import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface IQrScanPreviewProps {
  readonly onQrScanned: (qrData: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scanAreaSize = screenWidth * 0.7;

// Calculate scan area boundaries
const getScanAreaBounds = () => {
  const scanAreaLeft = (screenWidth - scanAreaSize) / 2;
  const scanAreaTop = (screenHeight - scanAreaSize) / 2;
  return {
    left: scanAreaLeft,
    right: scanAreaLeft + scanAreaSize,
    top: scanAreaTop,
    bottom: scanAreaTop + scanAreaSize,
  };
};

// Check if QR code is within scan area
const isQrInScanArea = (qrBounds: any) => {
  const scanBounds = getScanAreaBounds();
  const qrCenterX = qrBounds.origin.x + qrBounds.size.width / 2;
  const qrCenterY = qrBounds.origin.y + qrBounds.size.height / 2;

  return (
    qrCenterX >= scanBounds.left &&
    qrCenterX <= scanBounds.right &&
    qrCenterY >= scanBounds.top &&
    qrCenterY <= scanBounds.bottom
  );
};

export default function QrScanPreview(props: IQrScanPreviewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? null;
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const scanLock = useRef(false);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;

  const [qrDetected, setQrDetected] = useState(false);
  const [qrBox, setQrBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Animated scanning line
  useEffect(() => {
    if (!scanned) {
      const animateScanning = () => {
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (!scanned) {
            animateScanning();
          }
        });
      };
      animateScanning();
    }
  }, [scanned, scanLineAnimation]);
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLock.current) return;
    if (!scanned) {
      if (typeof result?.data === "string" && result.data.length > 0) {
        // Check if QR code is within the scan area
        if (result?.bounds && !isQrInScanArea(result.bounds)) {
          // QR code is outside scan area, ignore it
          setQrDetected(false);
          setQrBox(null);
          return;
        }

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
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        style={{ flex: 1 }}
        facing={"back"}
        ratio="16:9"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Dark overlay with cutout for scanning area */}
      <View style={styles.overlayContainer}>
        {/* Top overlay */}
        <View style={styles.overlayTop} />

        {/* Middle section with side overlays and scan area */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayLeft} />
          <View style={styles.scanArea}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animated scanning line */}
            {!scanned && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, scanAreaSize - 4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.overlayRight} />
        </View>

        {/* Bottom overlay */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Instructions and controls */}
      <View style={styles.instructionsContainer}>
        {!scanned ? (
          <View style={styles.instructionsBox}>
            <Text style={styles.scanCodeText}>Scan Code</Text>
            <Text style={styles.instructionText}>Point camera at QR code</Text>
          </View>
        ) : (
          <View style={styles.instructionsBox}>
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
  // Overlay styles for darkening areas outside scan zone
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayMiddle: {
    flexDirection: "row",
    height: scanAreaSize,
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayRight: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },

  // Scan area and corner brackets
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "white",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  // Animated scanning line
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FF0000",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },

  // Instructions and text
  instructionsContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsBox: {
    // backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  scanCodeText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    opacity: 0.8,
  },

  // Legacy styles (keeping for compatibility)
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
