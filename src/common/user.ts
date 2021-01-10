import { User, OAuthClientAuthorization, OAuthClient, Email, Phone } from '@prisma/client';
import { prisma } from '../';
import { getAppInfoByClientId } from './client';

interface UserObject extends User {
  emails: Email[];
  phones: Phone[];
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

export async function getUserByID(uuid: string) {
  const userDatabase = await prisma.user.findFirst({
    where: {
      id: uuid,
    },
  });
  if (!userDatabase) return;

  const emailDatabase = await prisma.email.findMany({
    where: {
      User: userDatabase,
    },
  });

  const phoneDatabase = await prisma.phone.findMany({
    where: {
      User: userDatabase,
    },
  });

  const authorizedAppsDatabase = await prisma.oAuthClientAuthorization.findMany({
    where: {
      user: userDatabase,
    },
  });

  const createdAppsDatabase = await prisma.oAuthClientAuthorization.findMany({
    where: {
      user: userDatabase,
    },
  });

  const emails = [];

  for (const email of emailDatabase) {
    if (email.verified && !email.isPrimary) {
      emails.push(email);
    }
  }

  const phones = [];

  for (const phone of phoneDatabase) {
    phones.push(phone);
  }

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

  const user: UserObject = {
    ...userDatabase,
    authorizedApps,
    createdApps,
    emails,
    phones,
  };

  return user;
}
