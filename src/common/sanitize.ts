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

  if (userData?.createdApps) {
    for (let i = 0; i < userData.createdApps.length; i++) {
      userData.createdApps[i] = Client.sanitize(userData.createdApps[i]);
    }
  }

  return userData;
}
