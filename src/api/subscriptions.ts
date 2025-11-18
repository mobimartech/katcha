import client from './client';

export type SubscriptionInfo = {
  type: string;
  end: string;
  active: boolean;
};

export async function getSubscriptions(): Promise<SubscriptionInfo> {
  try {
    const { data } = await client.get('/api/subscription');
    return data as SubscriptionInfo;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[Subscriptions][getSubscriptions][Error] returning dummy', e);
    return { type: 'weekly', end: '2025-10-09 12:19:49', active: true };
  }
}
