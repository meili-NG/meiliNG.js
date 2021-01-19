import { OAuthClient, OAuthClientAuthorization, User } from '@prisma/client';
import { prisma } from '..';
import { getUserInfo } from './user';

export async function getOAuth2ClientByClientId(clientId: string) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: clientId,
    },
  });

  return client;
}

export async function getOAuth2AuthorizationInfo(n: OAuthClientAuthorization) {
  const client = await prisma.oAuthClient.findFirst({
    where: {
      id: n.oAuthClientId,
    },
  });

  return {
    client,
    ...n,
  };
}

export async function isClientAccessible(clientId: string, user: User | string): Promise<boolean> {
  const userObject = await getUserInfo(user);
  if (!userObject) return false;

  const client = await getOAuth2ClientByClientId(clientId);
  if (!client) return false;

  if (client.type === 'PUBLIC') {
    return true;
  } else {
    if (!client.oAuthClientAccessControlsId) {
      return false;
    } else {
      const [users, groups] = await Promise.all([
        prisma.user.findMany({
          where: {
            oAuthClientAccessControlsId: client.oAuthClientAccessControlsId,
          },
        }),
        prisma.group.findMany({
          where: {
            oAuthClientAccessControlsId: client.oAuthClientAccessControlsId,
          },
        }),
      ]);

      const user = users.find((n) => n.id === userObject.id);
      if (user) return true;

      const group = groups.find((n) => userObject.groups.find((m) => m.id === n.id));
      if (group) return true;
    }
  }

  return false;
}

export function sanitizeClient(client: OAuthClient) {
  return {
    id: client.id,
    image: client.image,
    name: client.name,
    privacy: client.privacy,
    terms: client.terms,
  };
}
