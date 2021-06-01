import { Email, Group, OAuthTokenType, Phone, User as UserModel } from '@prisma/client';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { ClientAuthorization, User, Utils } from '.';
import config from '../resources/config';
import { getPrismaClient } from '../resources/prisma';
import { SanitizedClientModel } from './client';

export interface UserInfoObject extends UserModel {
  emails: Email[];
  phones: Phone[];
  groups: Group[];
}

export interface UserDetailedObject extends UserInfoObject {
  authorizedApps: SanitizedClientModel[];
  createdApps: SanitizedClientModel[];
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
  await getPrismaClient().user.update({
    where: {
      id: getUserId(user),
    },
    data: {
      lastAuthenticated: new Date(),
    },
  });
}
export async function updateLastSignIn(user: UserModel | string) {
  await getPrismaClient().user.update({
    where: {
      id: getUserId(user),
    },
    data: {
      lastSignIn: new Date(),
    },
  });
}
export async function getBasicInfo(user: UserModel | string): Promise<UserModel | undefined> {
  const userDatabase = await getPrismaClient().user.findFirst({
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

  const emailsPromise = getPrismaClient().email.findMany({
    where: {
      user: userDatabase,
    },
  });

  const phonesPromise = getPrismaClient().phone.findMany({
    where: {
      user: userDatabase,
    },
  });

  const groupsPromise = getPrismaClient().group.findMany({
    where: {
      users: {
        some: {
          id: userDatabase.id,
        },
      },
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
    getPrismaClient().oAuthClientAuthorization.findMany({
      where: {
        userId: baseUser.id,
      },
    }),

    getPrismaClient().oAuthClient.findMany({
      where: {
        owners: {
          some: {
            id: baseUser.id,
          },
        },
      },
    }),
  ]);

  const authorizedAppPromises: Promise<any>[] = [];
  const createdAppPromises: Promise<any>[] = [];

  authorizedAppsDatabase.map((n) => authorizedAppPromises.push(ClientAuthorization.getClient(n)));

  // TODO: remove this totally unnecessary async.
  createdAppsDatabase.map((n) => createdAppPromises.push((async () => n)()));

  const [authorizedAppsPromisesPromise, createdAppsPromisesPromise] = await Promise.all([
    Promise.all(authorizedAppPromises),
    Promise.all(createdAppPromises),
  ]);

  let authorizedApps = [];
  let createdApps = [];

  for (const authorizedApp of await authorizedAppsPromisesPromise) {
    authorizedApps.push(authorizedApp);
  }
  for (const cratedApp of await createdAppsPromisesPromise) {
    createdApps.push(cratedApp);
  }

  authorizedApps = Utils.getUnique(authorizedApps, (m, n) => m.id === n.id);
  createdApps = Utils.getUnique(createdApps, (m, n) => m.id === n.id);

  const userObj: UserDetailedObject = {
    ...baseUser,
    authorizedApps,
    createdApps,
  };

  return userObj;
}

export async function getAuthorizations(user: UserModel | string) {
  return await getPrismaClient().authorization.findMany({
    where: {
      userId: getUserId(user),
    },
  });
}

export async function getPasswords(user: UserModel | string) {
  return await getPrismaClient().authorization.findMany({
    where: {
      userId: getUserId(user),
      method: 'PASSWORD',
    },
  });
}

export async function addPassword(user: UserModel | string, password: string) {
  const salt = await bcrypt.genSalt(Utils.getCryptoSafeInteger(10) + 5);
  const hash = await bcrypt.hash(password, salt);

  const data: AuthorizationPasswordObject = {
    type: 'PASSWORD',
    data: {
      hash,
    },
  };

  const passwordData = await getPrismaClient().authorization.create({
    data: {
      user: {
        connect: {
          id: getUserId(user),
        },
      },
      data: data as any,
      method: 'PASSWORD',
      allowSingleFactor: false,
      allowTwoFactor: false,
      allowPasswordReset: false,
    },
  });

  return passwordData ? true : false;
}

export async function checkPassword(user: UserModel | string, password: string) {
  const passwords = await getPasswords(user);

  const passwordCheckPromise = passwords.map(async (passwordDB) => {
    const passwordData = Utils.convertJsonIfNot<AuthorizationPasswordObject>(passwordDB.data);

    const hash = passwordData.data.hash;
    const result = await bcrypt.compare(password, hash);

    if (result) {
      return passwordDB;
    } else {
      return undefined;
    }
  });

  return (await Promise.all(passwordCheckPromise)).filter((n) => n !== undefined);
}

export async function getTokens(user: UserModel | string, type: OAuthTokenType | undefined = undefined) {
  const authorizations = await getClientAuthorizations(user);
  if (!authorizations) return [];

  const authorizationsPromise = [];
  for (const authorization of authorizations) {
    authorizationsPromise.push(
      getPrismaClient().oAuthToken.findMany({
        where: {
          authorizationId: authorization.id,
          type,
        },
      }),
    );
  }

  const authorizationsData = [];

  for (const authorizationDatum of await Promise.all(authorizationsPromise)) {
    authorizationsData.push(...authorizationDatum);
  }

  return authorizationsData;
}

export async function hasAuthorizedClient(user: UserModel | string, clientId: string) {
  return (await getClientAuthorizations(user, clientId)) !== undefined;
}

export async function getClientAuthorizations(user: UserModel | string, clientId?: string) {
  let returnData;

  const authorizations = await getPrismaClient().oAuthClientAuthorization.findMany({
    where: {
      userId: getUserId(user),
    },
  });

  if (clientId) {
    returnData = authorizations.filter((n) => n.clientId === clientId);
  } else {
    returnData = authorizations;
  }

  return returnData.length > 0 ? returnData : undefined;
}

export async function getClientAuthorizedPermissions(user: UserModel | string, clientId?: string) {
  const permissions = [];

  let authorizations = await getPrismaClient().oAuthClientAuthorization.findMany({
    where: {
      userId: getUserId(user),
    },
  });

  if (clientId) {
    authorizations = authorizations.filter((n) => n.clientId === clientId);
  }

  for (const authorization of authorizations) {
    const authPermissions = await ClientAuthorization.getAuthorizedPermissions(authorization);
    permissions.push(...authPermissions);
  }

  return Utils.getUnique(permissions, (a, b) => a.name === b.name);
}

export async function findByUsername(username: string): Promise<UserModel[]> {
  return await getPrismaClient().user.findMany({
    where: {
      username: username.toLowerCase(),
    },
  });
}

export async function findByEmail(email: string, verified: boolean | undefined = true): Promise<UserModel[]> {
  const emails = await getPrismaClient().email.findMany({
    where: {
      email: email.toLowerCase(),
      allowUse: true,
      verified,
    },
  });

  const userPromises = emails
    .map((n) =>
      n.userId === undefined || n.userId === null
        ? undefined
        : getPrismaClient().user.findFirst({
            where: {
              id: n.userId,
            },
          }),
    )
    .filter((n) => n !== undefined && n !== null);

  const usersResult = await Promise.all(userPromises);

  const users = Utils.getUnique(await Promise.all(usersResult), (m, n) => m?.id === n?.id).filter(
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

export async function getPrimaryEmail(userId: string) {
  const email = await getPrismaClient().email.findFirst({
    where: {
      user: {
        id: userId,
      },
      isPrimary: true,
    },
  });

  if (!email) return undefined;
  return email;
}

export async function getEmails(userId: string) {
  const emails = await getPrismaClient().email.findMany({
    where: {
      user: {
        id: userId,
      },
    },
  });

  return emails;
}

export async function addEmail(userId: string, email: string, isPrimary = false) {
  const prevPrimaries = (await getEmails(userId)).filter((n) => n.isPrimary);

  await getPrismaClient().email.create({
    data: {
      email: email.toLowerCase(),
      user: {
        connect: {
          id: userId,
        },
      },
      verified: false,
      allowUse: false,
      isPrimary,
    },
  });

  if (isPrimary) {
    const prevPrimariesPromise = [];
    for (const prevPrimary of prevPrimaries) {
      prevPrimariesPromise.push(
        getPrismaClient().email.update({
          where: {
            id: prevPrimary.id,
          },
          data: {
            isPrimary: false,
          },
        }),
      );
    }
    await Promise.all(prevPrimariesPromise);
  }

  return true;
}

export async function removeEmail(userId: string, email: string) {
  await getPrismaClient().email.deleteMany({
    where: {
      userId,
      email: email.toLowerCase(),
    },
  });
}

export async function getPrimaryPhone(userId: string) {
  const phone = await getPrismaClient().phone.findFirst({
    where: {
      user: {
        id: userId,
      },
      isPrimary: true,
    },
  });

  if (!phone) return undefined;
  return phone;
}

export async function getPhones(userId: string) {
  const emails = await getPrismaClient().phone.findMany({
    where: {
      userId,
    },
  });

  return emails;
}

export async function addPhone(userId: string, phone: string, isPrimary = false) {
  const prevPrimaries = (await getPhones(userId)).filter((n) => n.isPrimary);

  await getPrismaClient().phone.create({
    data: {
      phone,
      user: {
        connect: {
          id: userId,
        },
      },
      isPrimary,
    },
  });

  if (isPrimary) {
    const prevPrimariesPromise = [];
    for (const prevPrimary of prevPrimaries) {
      prevPrimariesPromise.push(
        getPrismaClient().email.update({
          where: {
            id: prevPrimary.id,
          },
          data: {
            isPrimary: false,
          },
        }),
      );
    }
    await Promise.all(prevPrimariesPromise);
  }

  return true;
}

export async function removePhone(userId: string, phone: string) {
  await getPrismaClient().phone.deleteMany({
    where: {
      userId,
      phone,
    },
  });
}

export async function findByPasswordLogin(username: string, password: string): Promise<UserModel[]> {
  const resultsRaw = await findByCommonUsername(username);

  const queryResults = Utils.getUnique(resultsRaw, (m, n) => m.id === n.id);

  const matchingUsers = [];
  for (const query of queryResults) {
    const isMatch = (await checkPassword(query, password)).length > 0;

    if (isMatch) {
      matchingUsers.push(query);
    }
  }

  return matchingUsers;
}

export async function createIDToken(
  user: UserModel | string,
  clientId: string,
  permissions?: string[],
  nonce?: string,
) {
  if (permissions) {
    if (!permissions.includes('openid')) {
      return undefined;
    }
  }

  const data = await getDetailedInfo(user);
  if (!data) return undefined;

  const namePerm = permissions && permissions.includes('name');
  const nameDetail = {
    family_name: data.familyName,
    given_name: data.givenName,
    middle_name: data.middleName,
    nickname: data.name,
  };

  const emailPerm = permissions && permissions.includes('email');
  const email = await User.getPrimaryEmail(getUserId(user));

  const phonePerm = permissions && permissions.includes('phone');
  const phone = await User.getPrimaryPhone(getUserId(user));

  const jwtData = {
    sub: data.id,
    iss: config.openid.issuingAuthority,
    aud: clientId,
    nonce: nonce,
    auth_time: data.lastAuthenticated,
    iat: new Date().getUTCSeconds(),
    exp: new Date(new Date().getTime() + 1000 * config.token.invalidate.openid).getUTCSeconds(),
    name: data.name,
    ...(namePerm ? nameDetail : {}),
    preferred_username: data.username,
    picture: data.profileUrl,
    email: emailPerm && email ? email.email : undefined,
    email_verified: emailPerm && email ? email.verified : undefined,
    phone: phonePerm && phone ? phone.phone : undefined,
    phone_verified: phonePerm && phone ? true : undefined,
  };

  return JWT.sign(jwtData, config.openid.secretKey);
}
