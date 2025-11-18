export const DUMMY_LOGIN_PAYLOAD = {
  action: 'google_login' as const,
  google_id: 'test_google_id_1',
  email: 'test@example.com',
  name: 'Test User',
  device_id: 'device_1',
  firebaseID: '',
};

export const DUMMY_TRACKED_USERS = [
  { id: '1', username: 'john_doe', platform: 'instagram' as const },
  { id: '2', username: 'creator_xyz', platform: 'tiktok' as const },
];


