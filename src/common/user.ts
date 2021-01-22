import { Email, Group, OAuthClient, OAuthClientAuthorization, Phone, User as UserModel } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ClientAuthorization, getUnique } from '.';
import { prisma } from '../';

export interface UserInfoObject extends UserModel {
  emails: Email[];
  phones: Phone[];
  groups: Group[];
}

export interface UserDetailedObject extends UserInfoObject {
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

export function getUserId(user: UserModel | string) {
  return typeof user === 'string' ? user : user.id;
}
export async function updateLastAuthenticated(user: UserModel | string) {
  await prisma.user.update({
    where: {
      id: getUserId(user),
    },
    data: {
      lastAuthenticated: new Date(),
    },
  });
}
export async function updateLastSignIn(user: UserModel | string) {
  await prisma.user.update({
    where: {
      id: getUserId(user),
    },
    data: {
      lastSignIn: new Date(),
    },
  });
}
export async function getBasicInfo(user: UserModel | string): Promise<UserModel | undefined> {
  const userDatabase = await prisma.user.findFirst({
    where: {
      id: getUserId(user),
    },
  });
  if (!userDatabase) return;

  return userDatabase;
}
export async function getInfo(user: UserModel | string): Promise<UserInfoObject | undefined> {
  const userDatabase = await getBasicInfo(user);
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

  const userObj: UserInfoObject = {
    ...userDatabase,
    emails,
    phones,
    groups,
  };

  return userObj;
}

export async function getDetailedInfo(user: UserModel | string): Promise<UserDetailedObject | undefined> {
  const baseUser = await getInfo(user);
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

  authorizedAppsDatabase.map((n) => authorizedAppPromises.push(ClientAuthorization.getClient(n)));
  createdAppsDatabase.map((n) => createdAppPromises.push(ClientAuthorization.getClient(n)));

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

  const userObj: UserDetailedObject = {
    ...baseUser,
    authorizedApps,
    createdApps,
  };

  return userObj;
}

export async function getAuthorizations(user: UserModel | string) {
  return await prisma.authorization.findMany({
    where: {
      userId: getUserId(user),
    },
  });
}

export async function getClientAuthorizations(user: UserModel | string, clientId?: string) {
  let returnData;

  const authorizations = await prisma.oAuthClientAuthorization.findMany({
    where: {
      userId: getUserId(user),
    },
  });

  if (clientId) {
    returnData = authorizations.filter((n) => n.oAuthClientId === clientId);
  } else {
    returnData = authorizations;
  }

  return returnData.length > 0 ? returnData : undefined;
}

export async function getClientAuthorizedPermissions(user: UserModel | string, clientId?: string) {
  const permissions = [];

  let authorizations = await prisma.oAuthClientAuthorization.findMany({
    where: {
      userId: getUserId(user),
    },
  });

  if (clientId) {
    authorizations = authorizations.filter((n) => n.oAuthClientId === clientId);
  }

  for (const authorization of authorizations) {
    const authPermissions = await ClientAuthorization.getAuthorizedPermissions(authorization);
    permissions.push(...authPermissions);
  }

  return getUnique(permissions, (a, b) => a.name === b.name);
}

export async function findByUsername(username: string): Promise<UserModel[]> {
  return await prisma.user.findMany({
    where: {
      username,
    },
  });
}

export async function findByEmail(email: string, verified: boolean | undefined = true): Promise<UserModel[]> {
  const emails = await prisma.email.findMany({
    where: {
      email: email,
      allowUse: true,
      verified,
    },
  });

  const userPromises = emails
    .map((n) =>
      n.userId === undefined || n.userId === null
        ? undefined
        : prisma.user.findFirst({
            where: {
              id: n.userId,
            },
          }),
    )
    .filter((n) => n !== undefined && n !== null);

  const usersResult = await Promise.all(userPromises);

  const users = getUnique(await Promise.all(usersResult), (m, n) => m?.id === n?.id).filter(
    (n) => n !== undefined && n !== null,
  ) as UserModel[];

  return users;
}

export async function findByCommonUsername(username: string): Promise<UserModel[]> {
  const [resultUsername, resultEmail] = await Promise.all([findByUsername(username), findByEmail(username)]);
  const users = [];

  users.push(...resultUsername);
  users.push(...resultEmail);

  return users;
}

export async function findByPasswordLogin(username: string, password: string): Promise<UserModel[]> {
  const resultsRaw = await findByCommonUsername(username);

  const queryResults = getUnique(resultsRaw, (m, n) => m.id === n.id);

  const matchingUsers = [];
  for (const query of queryResults) {
    const authorizations = await getAuthorizations(query);
    const passwordAuthorizations = authorizations.filter((n) => n.method === 'PASSWORD');

    let isMatch = false;
    for (const passwordAuthorization of passwordAuthorizations) {
      let passwordData = (passwordAuthorization.data as unknown) as AuthorizationPasswordObject;
      if (typeof passwordData === 'string') {
        passwordData = JSON.parse(passwordData) as AuthorizationPasswordObject;
      }

      const hash = passwordData.data.hash;
      const result = await bcrypt.compare(password, hash);

      if (result) {
        isMatch = true;
      }
    }

    if (isMatch) {
      matchingUsers.push(query);
    }
  }

  return matchingUsers;
}
