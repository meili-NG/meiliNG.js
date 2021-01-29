import { User as UserModel } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import fs from 'fs';
import { config, prisma } from '../../../..';
import { Token, User } from '../../../../common';
import { MeilingV1Session, MeilingV1SessionExtendedAuthentication } from '../interfaces';
import { MeilingV1ExtendedAuthMethods } from '../interfaces/query';

interface MeilingV1TokenDataFile {
  issuedTokens: MeilingV1TokenData[];
}

type MeilingV1TokenData = {
  token: string;
  ip: string;
  firstIssued: Date;
  lastUsed: Date;
  expiresAt: Date;
  session: MeilingV1Session;
};

let tokenSessions: MeilingV1TokenDataFile = {
  issuedTokens: [],
};

export function loadSessionSaveFiles() {
  if (config.session.v1.storage) {
    if (config.session.v1.storage.type === 'file') {
      if (fs.existsSync(config.session.v1.storage.path)) {
        tokenSessions = JSON.parse(
          fs.readFileSync(config.session.v1.storage.path, { encoding: 'utf-8' }),
        ) as MeilingV1TokenDataFile;
        for (const tokenData of tokenSessions.issuedTokens) {
          tokenData.expiresAt = new Date(tokenData.expiresAt);
          tokenData.firstIssued = new Date(tokenData.firstIssued);
          tokenData.lastUsed = new Date(tokenData.lastUsed);
        }
      }
    }

    garbageCollect();
  }
}

export function garbageCollect() {
  // remove duplicates
  tokenSessions.issuedTokens = tokenSessions.issuedTokens.filter(
    (n, i) =>
      tokenSessions.issuedTokens
        .map((v, i) => (v.token === n.token ? i : undefined))
        .filter((n) => n !== undefined)[0] === i,
  );

  // remove expired
  tokenSessions.issuedTokens = tokenSessions.issuedTokens.filter((n) => n.expiresAt.getTime() > new Date().getTime());

  saveSession();
}

export function saveSession() {
  if (config.session.v1.storage) {
    if (config.session.v1.storage.type === 'file') {
      fs.writeFileSync(config.session.v1.storage.path, JSON.stringify(tokenSessions, null, 2));
    }
  }
}

export async function isToken(token?: string): Promise<boolean> {
  if (!token) return false;

  let result;

  if (config.session.v1.storage) {
    const matchedTokens = tokenSessions.issuedTokens.filter((t) => t.token === token);
    result = matchedTokens.length === 1;
  } else {
    const matchedToken = await prisma.meilingSessionV1Token.findUnique({
      where: {
        token,
      },
    });
    result = matchedToken !== undefined && matchedToken !== null;
  }

  saveSession();

  return result;
}

export function getTokenFromRequest(req: FastifyRequest): string | undefined {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ').splice(1).join(' ');
    return token;
  }
  return;
}

export function createToken(req: FastifyRequest): string | undefined {
  if (
    tokenSessions.issuedTokens.filter(
      (t) =>
        t.ip === req.ip &&
        new Date().getTime() - config.session.v1.rateLimit.timeframe * 1000 < t.firstIssued.getTime(),
    ).length > config.session.v1.rateLimit.maxTokenPerIP
  ) {
    return undefined;
  }

  const token = Token.generateToken();

  const tokenData: MeilingV1TokenData = {
    token,
    ip: req.ip,
    session: {},
    expiresAt: new Date(new Date().getTime() + config.session.v1.maxAge * 1000),
    firstIssued: new Date(),
    lastUsed: new Date(),
  };

  tokenSessions.issuedTokens.push(tokenData);

  saveSession();

  return token;
}

export async function getSessionFromRequest(req: FastifyRequest): Promise<MeilingV1Session | undefined> {
  let data: MeilingV1Session | undefined;
  let token: string | undefined = undefined;

  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    token = await getTokenFromRequest(req);

    if (await isToken(token)) {
      const session = tokenSessions.issuedTokens.find((n) => n.token === token);
      const expiresAt = session?.expiresAt;

      if (expiresAt) {
        if (new Date().getTime() < expiresAt.getTime()) {
          data = session?.session;
        } else {
          data = undefined;
        }
      } else {
        data = session?.session;
      }
    } else {
      data = undefined;
    }
  } else {
    data = undefined;
  }

  if (data !== undefined) {
    if (data.user) {
      const userPromises = [];
      for (const user of data.user) {
        // not async function since we don't need to wait it to complete.
        User.updateLastAuthenticated(user.id);
      }
    }
  }

  saveSession();

  return data;
}

export async function setSession(req: FastifyRequest, data?: MeilingV1Session) {
  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    const token = await getTokenFromRequest(req);

    if (token) {
      if (await isToken(token)) {
        if (data) {
          const tokenData = tokenSessions.issuedTokens.find((n) => n.token === token);
          if (tokenData) {
            tokenData.session = data;
            tokenData.expiresAt = new Date(new Date().getTime() + config.session.v1.maxAge * 1000);
          }
        } else {
          tokenSessions.issuedTokens = tokenSessions.issuedTokens.filter((n) => n.token !== token);
        }
      }
    }
  }

  saveSession();
}

export async function setExtendedAuthentiationSession(
  req: FastifyRequest,
  extAuth: MeilingV1SessionExtendedAuthentication | undefined,
) {
  const prevSession = await getSessionFromRequest(req);
  const session = {
    ...prevSession,
    extendedAuthentication: extAuth,
  } as MeilingV1Session;

  await setSession(req, session);
}

export async function setExtendedAuthenticationSessionMethodAndChallenge(
  req: FastifyRequest,
  method?: MeilingV1ExtendedAuthMethods,
  challenge?: string | undefined,
  challengeCreatedAt?: Date,
) {
  const session = await getSessionFromRequest(req);

  if (session) {
    if (session.extendedAuthentication) {
      session.extendedAuthentication.method = method === undefined ? session.extendedAuthentication.method : method;
      session.extendedAuthentication.challenge =
        challenge === undefined ? session.extendedAuthentication.challenge : challenge;
      session.extendedAuthentication.challengeCreatedAt = new Date();

      if (challengeCreatedAt) {
        session.extendedAuthentication.challengeCreatedAt = challengeCreatedAt;
      }
    }

    await setSession(req, session);
  }
}

export async function getPreviouslyLoggedIn(req: FastifyRequest, user: UserModel | string): Promise<boolean> {
  const session = await getSessionFromRequest(req);

  if (session) {
    if (session.previouslyLoggedIn === undefined) {
      session.previouslyLoggedIn = [];
    }

    const userData = await User.getBasicInfo(user);
    if (userData === null || userData === undefined) {
      return false;
    }

    const userId = userData.id;

    const result = session.previouslyLoggedIn.filter((n) => n.id === userId);

    return result.length > 0;
  } else {
    return false;
  }
}

export async function login(req: FastifyRequest, user: UserModel | string) {
  const session = await getSessionFromRequest(req);

  if (session) {
    if (session.user === undefined) {
      session.user = [];
    }

    if (session.previouslyLoggedIn === undefined) {
      session.previouslyLoggedIn = [];
    }

    const userData = await User.getBasicInfo(user);
    if (userData === null || userData === undefined) {
      return;
    }

    if (session.user.map((user) => user.id === userData.id).indexOf(true) < 0) {
      session.user.push({
        id: userData.id,
      });
    }

    if (session.previouslyLoggedIn.map((user) => user.id === userData.id).indexOf(true) < 0) {
      session.previouslyLoggedIn.push({
        id: userData.id,
      });
    }

    await setSession(req, session);
  }

  return;
}

export async function logout(req: FastifyRequest, user?: UserModel | string) {
  const session = await getSessionFromRequest(req);

  if (session) {
    if (user) {
      if (session.user === undefined) {
        session.user = [];
      } else {
        const userData = await User.getBasicInfo(user);

        if (userData === null || userData === undefined) {
          return;
        }

        const accountsToLogout = session.user.filter((a) => a.id !== userData.id);

        session.user = accountsToLogout;
      }
    } else {
      session.user = [];
    }

    if (session.user.length === 0) {
      session.user = undefined;
    }

    await setSession(req, session);
  }
}

export async function getLoggedIn(req: FastifyRequest) {
  const session = await getSessionFromRequest(req);

  if (session) {
    if (session.user === undefined) {
      session.user = [];
    }

    const users = [];

    for (const user of session.user) {
      const thisUser = await User.getInfo(user.id);
      if (thisUser !== null && thisUser !== undefined) {
        users.push(thisUser);
        User.updateLastAuthenticated(thisUser);
      }
    }

    return users;
  }

  return [];
}

export function isUserLoggedIn(session: MeilingV1Session) {
  return session.user !== undefined && session.user.length > 0;
}

export function isInExtendedAuthenticationSession(session: MeilingV1Session) {
  return session.extendedAuthentication !== undefined;
}

export function getExtendedAuthenticationSession(session: MeilingV1Session) {
  return session.extendedAuthentication;
}
