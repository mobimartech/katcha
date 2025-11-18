// Placeholder API for users/tracking
export type TrackedUser = {
  id: string;
  username: string;
  platform: 'instagram' | 'tiktok';
};

export async function listTrackedUsers(): Promise<TrackedUser[]> {
  // TODO: GET from backend
  return [
    { id: '1', username: 'john_doe', platform: 'instagram' },
    { id: '2', username: 'creator_xyz', platform: 'tiktok' },
  ];
}

export async function addTrackedUser(username: string, platform: 'instagram' | 'tiktok'): Promise<void> {
  // TODO: POST to backend
  void username;
  void platform;
}


