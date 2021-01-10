import { User, OAuthClientAuthorization, OAuthClient, Email, Phone } from '@prisma/client';
import { prisma } from '../';
import { getAppInfoByClientId } from './client';

interface UserBaseObject extends User {
  emails: Email[];
  phones: Phone[];
}

interface UserAllObject extends UserBaseObject {
  authorizedApps: ClientAuthorizationObject[];
  createdApps: OAuthClient[];
}

interface ClientAuthorizationObject extends OAuthClientAuthorization {
  client: OAuthClient;
}

export function runUserAction(user: User | string) {
  let uuid;
  if (typeof user === 'string') {
    uuid = user;
  } else {
    uuid = user.id;
  }

  prisma.user.update({
    where: {
      id: uuid,
    },
    data: {
      lastAuthenticated: new Date(),
    },
  });
}

export async function getUserInfo(user: User | string): Promise<UserBaseObject | undefined> {
  let uuid;
  if (typeof user === 'string') {
    uuid = user;
  } else {
    uuid = user.id;
  }

  const userDatabase = await prisma.user.findFirst({
    where: {
      id: uuid,
    },
  });
  if (!userDatabase) return;

  const emails = await prisma.email.findMany({
    where: {
      User: userDatabase,
    },
  });

  const phones = await prisma.phone.findMany({
    where: {
      User: userDatabase,
    },
  });

  const userObj: UserBaseObject = {
    ...userDatabase,
    emails,
    phones,
  };
}

export async function getAllUserByID(user: User | string): Promise<UserBaseObject | undefined> {
  const baseUser = await getUserInfo(user);
  if (!baseUser) return;

  const authorizedAppsDatabase = await prisma.oAuthClientAuthorization.findMany({
    where: {
      userId: baseUser.id,
    },
  });

  const createdAppsDatabase = await prisma.oAuthClientAuthorization.findMany({
    where: {
      userId: baseUser.id,
    },
  });

  const authorizedApps = [];

  for (const authorizedApp of authorizedAppsDatabase) {
    const client = await getAppInfoByClientId(authorizedApp.userId);

    if (client) {
      authorizedApps.push({
        client,
        ...authorizedApp,
      });
    }
  }

  const createdApps = [];

  for (const createdApp of createdAppsDatabase) {
    const client = await getAppInfoByClientId(createdApp.userId);

    if (client) {
      createdApps.push(client);
    }
  }

  const userObj: UserAllObject = {
    ...baseUser,
    authorizedApps,
    createdApps,
  };

  return userObj;
}

export async function getAuthenticationMethods(user: User | string) {
  let uuid;
  if (typeof user === 'string') {
    uuid = user;
  } else {
    uuid = user.id;
  }

  const auths = await prisma.authorization.findMany({
    where: {
      userId: uuid,
    },
  });

  const authenticationMethods = [];
  for (const auth of auths) {
    authenticationMethods.push(auth.method);
  }

  return authenticationMethods;
}
