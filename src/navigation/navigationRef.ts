import { createNavigationContainerRef } from '@react-navigation/native';

// Keep 'any' here to avoid circular imports with types → api
export const navigationRef = createNavigationContainerRef<any>();

export function resetToLogin(): void {
  if (navigationRef.isReady()) {
    try {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' as never }] });
    } catch {}
  }
}


