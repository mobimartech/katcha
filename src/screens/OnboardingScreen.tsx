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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { setOnboardingComplete } from '../utils/onboarding';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Track your Instagram &\nTikTok accounts in one place',
    description:
      'Connect your social profiles and monitor followers, followings, and activity — all from one dashboard.',
    image: require('../../assets/onboarding/slide1.png'),
  },
  {
    id: 2,
    title: 'See who unfollowed or\nfollowed you instantly',
    description:
      'Get real-time updates about new followers and people who unfollowed you — never miss a change again.',
    image: require('../../assets/onboarding/slide2.png'),
  },
  {
    id: 3,
    title: 'Stay notified about your\nsocial changes',
    description:
      'Receive smart notifications whenever something important happens — from lost followers to new activity.',
    image: require('../../assets/onboarding/slide3.png'),
  },
  {
    id: 4,
    title: 'Start growing your\naudience smarter',
    description:
      'Analyze trends, find your loyal fans, and optimize your content to grow faster than ever.',
    image: require('../../assets/onboarding/slide4.png'),
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (newIndex) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(newIndex);

      // Fade in
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
    } else {
      await setOnboardingComplete();
      // navigation.replace('Login');
      navigation.replace('MainTabs');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && currentIndex < slides.length - 1) {
          // Swipe left - next slide
          animateTransition(currentIndex + 1);
        } else if (gestureState.dx > 50 && currentIndex > 0) {
          // Swipe right - previous slide
          animateTransition(currentIndex - 1);
        }
      },
    })
  ).current;

  const currentSlide = slides[currentIndex];

  return (
    <LinearGradient colors={['#698eff', '#dc80ff']} style={styles.container}>
      {/* Image at the top - takes up more space */}
      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={currentSlide.image}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom white card - more compact */}
      <View style={styles.bottomCard}>
        {/* Page Indicators - Numbered Steps */}
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

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>{currentSlide.title}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </Animated.View>

        {/* Continue Button */}
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
    // paddingBottom: 20,
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
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    // fontFamily: 'Montserrat',
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
    // marginBottom: 24,
  },
  buttonWrapper: {
    marginTop: 'auto',
    alignItems: 'center',
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
