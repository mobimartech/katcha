import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { setOnboardingComplete } from '../utils/onboarding';
import Rate, { AndroidMarket } from 'react-native-rate';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Track All Your Accounts',
    description:
      'Monitor Instagram & TikTok followers and activity in one place.',
    image: require('../../assets/onboarding/slide1.png'),
    type: 'normal',
  },
  {
    id: 2,
    title: 'Never Miss a Change',
    description: 'See who follows or unfollows you in real-time.',
    image: require('../../assets/onboarding/slide2.png'),
    type: 'normal',
  },
  {
    id: 3,
    title: 'Enjoying Katcha?',
    description: 'Rate us to help us grow!',
    image: require('../../assets/onboarding/slide3.png'),
    type: 'review',
  },
  {
    id: 4,
    title: 'Grow Your Audience',
    description: 'Analyze trends and find your loyal fans.',
    image: require('../../assets/onboarding/slide4.png'),
    type: 'normal',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (newIndex) => {
    fadeAnim.stopAnimation();

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(newIndex);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContinue = async () => {
    if (currentIndex < slides.length - 1) {
      animateTransition(currentIndex + 1);
      if (slides[currentIndex + 1].type === 'review') {
        showInAppReview();
      }
    } else {
      await setOnboardingComplete();

      Platform.OS === 'ios'
        ? navigation.replace('Subscription')
        : navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && currentIndex < slides.length - 1) {
          if (currentIndex === 2) {
            showInAppReview();
          } else {
            animateTransition(currentIndex + 1);
          }
        } else if (gestureState.dx > 50 && currentIndex > 0) {
          animateTransition(currentIndex - 1);
        }
      },
    })
  ).current;

  const currentSlide = slides[currentIndex];

  const showInAppReview = () => {
    const options = {
      AppleAppID: '6755113314', // Replace with your Apple App ID
      GooglePackageName: 'YOUR_PACKAGE_NAME', // Replace with your package name
      preferInApp: true,
      openAppStoreIfInAppFails: false,
    };

    Rate.rate(options, (success, errorMessage) => {
      if (success) {
        // Review flow finished successfully
        console.log('Review flow completed');
      } else {
        console.log(`Review ${errorMessage}`);
      }
      // Continue to the last slide regardless of success/failure
      // animateTransition(currentIndex + 1);
    });
  };

  return (
    <LinearGradient colors={['#698eff', '#dc80ff']} style={styles.container}>
      {/* Image at the top */}
      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={currentSlide.image}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom white card */}
      <View style={styles.bottomCard}>
        {/* Page Indicators */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                onPress={() => {
                  if (index !== currentIndex) {
                    animateTransition(index);
                  }
                }}
              >
                <View
                  style={[
                    styles.stepIndicator,
                    index === currentIndex && styles.activeStepIndicator,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      index === currentIndex && styles.activeStepNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              </TouchableOpacity>
              {index < slides.length - 1 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.title}>{currentSlide.title}</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.description}>{currentSlide.description}</Text>
          </Animated.View>

          {/* NO STARS - Completely removed for testing */}
        </View>

        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7A86FF', '#3C9DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: '50%',
    width: width,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  image: {
    width: width,
    height: '90%',
  },
  bottomCard: {
    flex: 1,
    height: '70%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
  },
  activeStepIndicator: {
    backgroundColor: '#698eff',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  activeStepNumber: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 12,
  },
  buttonWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    width: width * 0.6,
    height: 60,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    shadowColor: '#698eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
