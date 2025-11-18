import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ToastAndroid,
  Animated,
  SafeAreaView,
  Text,
} from "react-native";
import {
  useCameraDevices,
  Camera,
} from "react-native-vision-camera";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/Ionicons';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  PhotoQuality,
} from "react-native-image-picker";
import Theme from "../../constants/Theme";

const { width, height } = Dimensions.get("window");

const imageDimensions = {
  width: 500,
  height: 500,
  quality: 0.7,
};

export type CameraProps = {
  recognizeImage: (image: string) => void;
  onToggleTips?: () => void;
};

const CameraScreen = ({ recognizeImage, onToggleTips }: CameraProps) => {
  const navigation = useNavigation();
  const camera = useRef<Camera>(null);

  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  const [hasPermission, setHasPermission] = useState(false);
  const [buttonAnimation] = useState(new Animated.Value(1));
  const [focusAnimation] = useState(new Animated.Value(0));
  const [gridVisible, setGridVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        console.log('Requesting camera permission...');
        const status = await Camera.requestCameraPermission();
        console.log('Camera permission status:', status);

        const permissionGranted = status === "granted";
        setHasPermission(permissionGranted);

        if (permissionGranted) {
          setIsReady(true);
          console.log('Camera ready!');
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        setHasPermission(false);
        setIsReady(false);
      }
    };

    initializeCamera();
  }, []);

  const handleCameraButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => takePictureAsync());
  };

  const takePictureAsync = async () => {

    try {
      const photo = await camera.current?.takePhoto({
        flash: "off",
      });

      if (!photo?.path) {
        if (Platform.OS === 'android') {
          ToastAndroid.show("Unable to capture image!", ToastAndroid.SHORT);
        }
        return;
      }

      recognizeImage(`file://${photo.path}`);
    } catch (error) {
      console.error("Photo capture error:", error);
      if (Platform.OS === 'android') {
        ToastAndroid.show("Camera error occurred!", ToastAndroid.SHORT);
      }
    }
  };

  const pickImage = async () => {

    const options: ImageLibraryOptions = {
      mediaType: "photo",
      quality: imageDimensions.quality as PhotoQuality,
      maxHeight: imageDimensions.height,
      maxWidth: imageDimensions.width,
    };

    const result = await launchImageLibrary(options);
    if (!result.didCancel && result.assets?.[0]?.uri) {
      recognizeImage(result.assets[0].uri);
    }
  };

  const handleToggleTips = () => {
    onToggleTips?.();
  };

  if (!hasPermission) {
    return (
      <View style={styles.camera}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const status = await Camera.requestCameraPermission();
              setHasPermission(status === "granted");
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.camera}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>No camera available</Text>
        </View>
      </View>
    );
  }

  const toggleGrid = () => {
    setGridVisible(!gridVisible);
  };

  return (
    <View style={styles.camera}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Grid Lines */}
      { (
        <View style={styles.gridContainer}>
          <View style={[styles.gridLine, { left: '33.33%', width: 1, height: '100%' }]} />
          <View style={[styles.gridLine, { left: '66.66%', width: 1, height: '100%' }]} />
          <View style={[styles.gridLine, { top: '33.33%', height: 1, width: '100%' }]} />
          <View style={[styles.gridLine, { top: '66.66%', height: 1, width: '100%' }]} />
        </View>
      )}

 

      {/* Top Controls */}
      <SafeAreaView style={styles.topButtonsContainer}>
        <TouchableOpacity
          style={styles.modernButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.topCenterContainer}>
          <Text style={styles.instructionText}>Point camera at plant</Text>
        </View>

        <TouchableOpacity style={{marginRight:20}}>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomControlsContainer}>
        <TouchableOpacity style={{marginLeft:20}} >
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCameraButtonPress}
        >
          <View style={styles.captureButtonInner}>
            <Icon name="camera" size={32} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={{marginLeft:20}} >
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    backgroundColor: "#000"
  },

  // Grid Lines
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    left: '33.33%',
  },
  gridLineHorizontal1: {
    height: 1,
    width: '100%',
    top: '33.33%',
  },
  gridLineHorizontal2: {
    height: 1,
    width: '100%',
    top: '66.66%',
  },

  // Focus Guide
  focusGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 120,
    marginTop: -60,
    marginLeft: -60,
    zIndex: 2,
  },
  focusCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
    top: 0,
    left: 0,
  },
  focusCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  focusCornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  focusCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  // Top Controls
  topButtonsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    zIndex: 10,
  },
  modernButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft:10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Theme.SHADOWS.SMALL,
  },
  topCenterContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  instructionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Bottom Controls
  bottomControlsContainer: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    zIndex: 10,
  },
  sideButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Theme.SHADOWS.SMALL,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    ...Theme.SHADOWS.MEDIUM,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    ...Theme.SHADOWS.SMALL,
  },

  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    ...Theme.SHADOWS.SMALL,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CameraScreen;
