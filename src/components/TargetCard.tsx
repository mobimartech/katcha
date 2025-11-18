import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';
import type { Target } from '../api/targets';

type TargetCardProps = {
  item: Target;
  delay?: number;
  onPress: () => void;
};

export default function TargetCard({ item, delay = 0, onPress }: TargetCardProps): React.ReactElement {
  const { colors, spacing, radius, shadows, typography } = useAppTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    // Start animations with delay based on index for staggered effect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateYAnim, delay]);

  // Platform-specific styling and icons
  const isPlatformInstagram = item.platform === 'instagram';
  const platformColor = isPlatformInstagram ? '#E1306C' : '#000000';
  const platformIcon = isPlatformInstagram ? 'logo-instagram' : 'logo-tiktok';
  
  return (
    <Animated.View
      style={[
        styles.container,
        { 
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ] 
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          { 
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            ...shadows.small,
          }
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {/* Platform badge */}
        <View style={[styles.platformBadge, { backgroundColor: platformColor }]}>
          <Icon name={platformIcon} size={14} color="#FFFFFF" />
        </View>
        
        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.header}>
            {item.profile_pic_url ? (
              <Image 
                source={{ uri: item.profile_pic_url }}
                style={styles.profileImage}
              />
            ) : (
              <Icon 
                name={platformIcon} 
                size={40} 
                color={platformColor} 
                style={styles.platformIcon} 
              />
            )}
            
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[typography.titleMedium, { color: colors.text }]}>
                  @{item.username}
                </Text>
                {item.is_verified && (
                  <Icon name="checkmark-circle" size={16} color="#1DA1F2" style={{ marginLeft: 4 }} />
                )}
              </View>
              {item.full_name && item.full_name !== item.username && (
                <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
                  {item.full_name}
                </Text>
              )}
              <Text style={[typography.labelSmall, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                {item.platform}
              </Text>
            </View>
          </View>
          
          <View style={[styles.statsContainer, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Icon name="people-outline" size={18} color={colors.primary} />
              <Text style={[typography.labelMedium, { color: colors.text, marginLeft: 6, fontWeight: '600' }]}>
                {item.followers !== undefined ? item.followers.toLocaleString() : '--'}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                followers
              </Text>
            </View>
            
            <View style={styles.stat}>
              <Icon name="person-add-outline" size={18} color={colors.secondary} />
              <Text style={[typography.labelMedium, { color: colors.text, marginLeft: 6, fontWeight: '600' }]}>
                {item.following !== undefined ? item.following.toLocaleString() : '--'}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                following
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  card: {
    overflow: 'hidden',
  },
  platformBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
