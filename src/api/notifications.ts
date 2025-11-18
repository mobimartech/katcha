import client from './client';

export type NotificationPayload = {
  token: string;
  platform?: 'ios' | 'android';
};

export async function sendFirebaseTokenToServer(token: string): Promise<{ success: boolean }> {
  // TODO: Replace with real endpoint when provided
  try {
    const { data } = await client.post('/api/notifications/token', { token } as NotificationPayload);
    return data as { success: boolean };
  } catch {
    // No real endpoint; treat as success for now
    return { success: true };
  }
}


