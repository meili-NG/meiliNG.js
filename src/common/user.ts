import {
  User,
  OAuthClientAuthorization,
  OAuthClient,
  Email,
  Phone,
  Authorization,
  JsonObject,
  AuthorizationMethod,
} from '@prisma/client';
import { prisma } from '../';
import { getAppInfoByClientId } from './client';
import bcrypt from 'bcrypt';
import { generateToken } from './token';
import { MeilingV1SigninType } from '../routes/v1/meiling/interfaces/query';

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

export type AuthorizationJSONObject =
  | AuthorizationPasswordObject
  | AuthorizationPGPSSHKeyObject
  | AuthorizationOTPObject
  | AuthorizationEmailSMSObject;

interface AuthorizationPasswordObject {
  type: 'PASSWORD';
  data: {
    hash: string;
  };
}

interface AuthorizationPGPSSHKeyObject {
  type: 'PGP_KEY' | 'SSH_KEY';
  data: {
    key: string;
  };
}

interface AuthorizationOTPObject {
  type: 'OTP';
  data: {
    secret: string;
  };
}

interface AuthorizationEmailSMSObject {
  type: 'EMAIL' | 'SMS';
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

export async function findMatchingUsersByUsernameOrEmail(username: string, password?: string): Promise<User[]> {
  const auths = [];

  const userByUsername = await prisma.user.findMany({
    where: {
      username,
    },
  });

  auths.push(...userByUsername);

  const userByEmail = await prisma.email.findMany({
    where: {
      email: username,
    },
  });

  for (const email of userByEmail) {
    if (email.userId) {
      const user = await prisma.user.findMany({
        where: {
          id: email.userId,
        },
      });

      auths.push(...user);
    }
  }

  const matchingUsers = [];

  if (password !== undefined) {
    for (const user of auths) {
      const passwordData = await prisma.authorization.findMany({
        where: {
          userId: user.id,
          method: 'PASSWORD',
        },
      });

      for (const passwordDatum of passwordData) {
        if (passwordDatum.data === null) continue;
        const passwordDatumJSON = JSON.parse(passwordDatum.data as string) as AuthorizationJSONObject;

        if (passwordDatumJSON.type !== 'PASSWORD') continue;
        const result = await bcrypt.compare(password, passwordDatumJSON.data.hash);

        if (result) {
          matchingUsers.push(user);
          break;
        }
      }
    }
  } else {
    matchingUsers.push(...auths);
  }

  return matchingUsers;
}
