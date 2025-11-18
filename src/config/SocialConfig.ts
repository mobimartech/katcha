// Virtual Try-On App Configuration
export const VirtualTryOnConfig = {
  // ImgBB Configuration
  IMGBB_API_KEY: '3954f5222ad049002c766e1f67dbbd4c', // Demo API key - replace with your actual ImgBB API key
  IMGBB_UPLOAD_URL: 'https://api.imgbb.com/1/upload',

  // AI API Configuration - Using MNI Tech model via Firebase Function
  AI_BACKGROUND_ERASER_API_URL: 'https://us-central1-remove-bg-2e6c4.cloudfunctions.net/removeBackground',
  // Model Information
      MODEL_NAME: 'mni-tech/virtual-tryon',
  MODEL_DESCRIPTION: 'Best-in-class clothing virtual try on in the wild (non-commercial use only)',
  // Processing Configuration
  PROCESSING_TIMEOUT: 60000, // 60 seconds timeout
  ESTIMATED_PROCESSING_TIME: 25000, // 25 seconds estimated time (updated based on new model)
  
  // Storage Configuration
  GALLERY_STORAGE_KEY: 'virtualTryOnGallery',
  MAX_GALLERY_ITEMS: 50, // Maximum items to store in gallery
  
  // Image Configuration
  IMAGE_QUALITY: 0.8, // Image compression quality (0-1)
  MAX_IMAGE_SIZE: 1024, // Maximum image dimension in pixels
  
  // UI Configuration
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Permissions
  REQUIRED_PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Please check your internet connection and try again.',
    PROCESSING_ERROR: 'Failed to process your request. Please try again.',
    UPLOAD_ERROR: 'Failed to upload image. Please try again.',
    PERMISSION_ERROR: 'Permission required to access photos.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    INVALID_IMAGE: 'Please select a valid image file.',
    STORAGE_ERROR: 'Failed to save to gallery. Please try again.',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    SAVED_TO_GALLERY: 'Your virtual try-on has been saved to your gallery.',
    PROCESSING_COMPLETE: 'Your virtual try-on is ready!',
    SHARED_SUCCESSFULLY: 'Image shared successfully.',
  },
  
  // Garment Types with detailed configurations (MNI Tech model)
  GARMENT_TYPES: {
    UPPER_BODY: {
      id: 'upper_body',
      label: '👕 Upper Body',
      icon: 'shirt-outline',
      description: 'T-shirts, shirts, blouses, sweaters, hoodies, jackets',
      supportedFormats: ['png', 'jpg', 'jpeg'],
      processingWeight: 1.0, // Processing complexity multiplier
      apiCategory: 'upper_body',
    },
    LOWER_BODY: {
      id: 'lower_body',
      label: '👖 Lower Body',
      icon: 'fitness-outline',
      description: 'Pants, jeans, shorts, skirts, trousers',
      supportedFormats: ['png', 'jpg', 'jpeg'],
      processingWeight: 1.2,
      apiCategory: 'lower_body',
    },
    DRESSES: {
      id: 'dresses',
      label: '👗 Dresses',
      icon: 'woman-outline',
      description: 'Full dresses, gowns, maxi dresses, formal wear',
      supportedFormats: ['png', 'jpg', 'jpeg'],
      processingWeight: 1.5,
      apiCategory: 'dresses',
      forceDC: true, // Enable DressCode version for dresses
    },
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_ANALYTICS: true,
    ENABLE_CRASH_REPORTING: true,
    ENABLE_SHARING: true,
    ENABLE_GALLERY_SYNC: false, // Cloud gallery sync
    ENABLE_BATCH_PROCESSING: false, // Multiple garments at once
    ENABLE_STYLE_RECOMMENDATIONS: false, // AI style suggestions
  },
  
  // Analytics Events
  ANALYTICS_EVENTS: {
    APP_OPENED: 'virtual_tryon_app_opened',
    IMAGE_UPLOADED: 'virtual_tryon_image_uploaded',
    GARMENT_SELECTED: 'virtual_tryon_garment_selected',
    PROCESSING_STARTED: 'virtual_tryon_processing_started',
    PROCESSING_COMPLETED: 'virtual_tryon_processing_completed',
    PROCESSING_FAILED: 'virtual_tryon_processing_failed',
    RESULT_SAVED: 'virtual_tryon_result_saved',
    RESULT_SHARED: 'virtual_tryon_result_shared',
    GALLERY_VIEWED: 'virtual_tryon_gallery_viewed',
  },
  
  // Rate Limiting
  RATE_LIMITS: {
    MAX_REQUESTS_PER_HOUR: 10, // For free tier
    MAX_REQUESTS_PER_DAY: 50,
    COOLDOWN_PERIOD: 5000, // 5 seconds between requests
  },
  
  // Debug Configuration
  DEBUG: {
    ENABLE_LOGS: true,
    ENABLE_MOCK_RESPONSES: false,
    MOCK_PROCESSING_TIME: 40000, // 40 seconds
  },

  // Ad Configuration
  ADS: {
    // Test Ad IDs (for development)
    TEST_IDS: {
      ANDROID: {
        BANNER: 'ca-app-pub-3940256099942544/6300978111',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
        REWARD: 'ca-app-pub-3940256099942544/5224354917',
      },
      IOS: {
        BANNER: 'ca-app-pub-3940256099942544/2934735716',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
        REWARD: 'ca-app-pub-3940256099942544/1712485313',
      }
    },
    
    // Ad Loading Configuration
    LOADING: {
      MAX_RETRIES: 3,
      RETRY_DELAY: 2000,
      LOAD_TIMEOUT: 30000,
      PRESENTATION_DELAY: 300,
    },

    // Reward System Configuration
    REWARDS: {
      POINTS_PER_GENERATION: 10,
      POINTS_PER_AD_WATCH: 0.5, // 2 ads = 1 point
      ADS_REQUIRED_FOR_REWARD: 2,
      DAILY_FREE_GENERATIONS: 0, // No free generations
      POINTS_FOR_FREE_GENERATION: 1,
      MAX_DAILY_AD_REWARDS: 20, // Changed from 0 to allow ad rewards
      REWARD_MULTIPLIER_WEEKENDS: 1.5,
    },

    // Keywords for better ad targeting
    KEYWORDS: ['fashion', 'style', 'virtual', 'tryon', 'ai', 'clothing'],
  },

  // AdMob Configuration
  ADMOB: {
    // Test IDs (for development)
    TEST_IDS: {
      ANDROID: {
        BANNER: 'ca-app-pub-3940256099942544/6300978111',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
        REWARD: 'ca-app-pub-3940256099942544/5224354917',
      },
      IOS: {
        BANNER: 'ca-app-pub-3940256099942544/2934735716',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
        REWARD: 'ca-app-pub-3940256099942544/1712485313',
      },
    },
    
    // Production IDs - Same for both platforms
    PRODUCTION_IDS: {
      ANDROID: {
        BANNER: 'ca-app-pub-3144169908690020/4284637971',
        INTERSTITIAL: 'ca-app-pub-3144169908690020/4589526784',
        REWARD: 'ca-app-pub-3144169908690020/3078818771',
      },
      IOS: {
        BANNER: 'ca-app-pub-3144169908690020/4284637971',
        INTERSTITIAL: 'ca-app-pub-3144169908690020/4589526784',
        REWARD: 'ca-app-pub-3144169908690020/3078818771',
      },
    },
    
    // Current environment setting
    USE_TEST_ADS: false, // Set to false for production
  },
};

// Helper functions
export const getGarmentTypeById = (id: string) => {
  return Object.values(VirtualTryOnConfig.GARMENT_TYPES).find(type => type.id === id);
};

export const getEstimatedProcessingTime = (garmentTypeId: string): number => {
  const garmentType = getGarmentTypeById(garmentTypeId);
  const baseTime = VirtualTryOnConfig.ESTIMATED_PROCESSING_TIME;
  const weight = garmentType?.processingWeight || 1.0;
  return Math.round(baseTime * weight);
};

export const isValidImageFormat = (filename: string): boolean => {
  const extension = filename.toLowerCase().split('.').pop();
  return ['png', 'jpg', 'jpeg'].includes(extension || '');
};

export const formatGarmentType = (garmentTypeId: string): string => {
  return garmentTypeId.replace('_', ' ').toUpperCase();
};

// Default export
export default VirtualTryOnConfig; 