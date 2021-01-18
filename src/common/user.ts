import {
  User,
  OAuthClientAuthorization,
  OAuthClient,
  Email,
  Phone,
  Authorization,
  JsonObject,
  AuthorizationMethod,
  Group,
} from '@prisma/client';
import { prisma } from '../';
import { getOAuth2ClientByClientId, getOAuth2AuthorizationInfo } from './client';
import bcrypt from 'bcrypt';
import { generateToken } from './token';
import { MeilingV1SigninType } from '../routes/v1/meiling/interfaces/query';

export interface UserBaseObject extends User {
  emails: Email[];
  phones: Phone[];
  groups: Group[];
}

export interface UserAllObject extends UserBaseObject {
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

export interface AuthorizationPGPSSHKeyObject {
  type: 'PGP_KEY' | 'SSH_KEY';
  data: {
    key: string;
  };
}

export interface AuthorizationOTPObject {
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

export async function getUserPlainInfo(user: User | string): Promise<User | undefined> {
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

  return userDatabase;
}

export async function getUserInfo(user: User | string): Promise<UserBaseObject | undefined> {
  const userDatabase = await getUserPlainInfo(user);
  if (!userDatabase) return;

  const emailsPromise = prisma.email.findMany({
    where: {
      User: userDatabase,
    },
  });

  const phonesPromise = prisma.phone.findMany({
    where: {
      User: userDatabase,
    },
  });

  const groupsPromise = prisma.group.findMany({
    where: {
      User: userDatabase,
    },
  });

  const [emails, phones, groups] = await Promise.all([emailsPromise, phonesPromise, groupsPromise]);

  const userObj: UserBaseObject = {
    ...userDatabase,
    emails,
    phones,
    groups,
  };

  return userObj;
}

export async function getAllUserInfo(user: User | string): Promise<UserBaseObject | undefined> {
  const baseUser = await getUserInfo(user);
  if (!baseUser) return;

  const [authorizedAppsDatabase, createdAppsDatabase] = await Promise.all([
    prisma.oAuthClientAuthorization.findMany({
      where: {
        userId: baseUser.id,
      },
    }),

    prisma.oAuthClientAuthorization.findMany({
      where: {
        userId: baseUser.id,
      },
    }),
  ]);

  const authorizedAppPromises: Promise<any>[] = [];
  const createdAppPromises: Promise<any>[] = [];

  authorizedAppsDatabase.map((n) => authorizedAppPromises.push(getOAuth2ClientByClientId(n.oAuthClientId)));
  createdAppsDatabase.map((n) => createdAppPromises.push(getOAuth2AuthorizationInfo(n)));

  const [authorizedAppsPromisesPromise, createdAppsPromisesPromise] = await Promise.all([
    Promise.all(authorizedAppPromises),
    Promise.all(createdAppPromises),
  ]);

  const authorizedApps = [];
  const createdApps = [];

  for (const authorizedApp of await authorizedAppsPromisesPromise) {
    authorizedApps.push(authorizedApp);
  }
  for (const cratedApp of await createdAppsPromisesPromise) {
    createdApps.push(cratedApp);
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
  const userIds = [];

  const usersByUsername = await prisma.user.findMany({
    where: {
      username,
    },
  });

  for (const user of usersByUsername) {
    userIds.push(user.id);
    auths.push(user);
  }

  const usersByEmail = await prisma.email.findMany({
    where: {
      email: username,
      verified: true,
      allowUse: true,
    },
  });

  const userPromisesByEmails = [];

  for (const email of usersByEmail) {
    if (email.userId) {
      if (!userIds.includes(email.userId)) {
        const userPromise = prisma.user.findFirst({
          where: {
            id: email.userId,
          },
        });

        userPromisesByEmails.push(userPromise);
      }
    }
  }

  const result = await Promise.all(userPromisesByEmails);
  for (const user of result) {
    if (user !== null) {
      auths.push(user);
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

        let passwordDatumJSON;

        if (typeof passwordDatum.data === 'string') {
          passwordDatumJSON = JSON.parse(passwordDatum.data as string) as AuthorizationJSONObject;
        } else {
          passwordDatumJSON = (passwordDatum.data as unknown) as AuthorizationJSONObject;
        }

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

export async function updateLastSignIn(userId: User | string) {
  const user = await getUserPlainInfo(userId);

  if (user) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastSignIn: new Date(),
      },
    });
  }
}

export async function updateLastAuth(userId: User | string) {
  const user = await getUserPlainInfo(userId);

  if (user) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastAuthenticated: new Date(),
      },
    });
  }
}
