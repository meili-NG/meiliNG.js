import { User, Client } from '.';

export async function getSanitizedUser(user: string): Promise<User.UserDetailedObject | undefined> {
  const userId = User.getUserId(user);
  const userData = await User.getDetailedInfo(userId);

  // fix any later
  if (userData?.authorizedApps) {
    for (let i = 0; i < userData.authorizedApps.length; i++) {
      userData.authorizedApps[i] = Client.sanitize(userData.authorizedApps[i]);
    }
  }

  if (userData?.ownedApps) {
    for (let i = 0; i < userData.ownedApps.length; i++) {
      userData.ownedApps[i] = Client.sanitize(userData.ownedApps[i]);
    }
  }

  if (userData?.metadata) {
    userData.metadata = User.sanitizeMetadata(userData.metadata);
  }

  return userData;
}
