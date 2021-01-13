import { User } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import fs, { promises as fsNext } from 'fs';
import { config } from '../../../..';
import { generateToken } from '../../../../common';
import { getUserInfo, getUserPlainInfo, updateLastAuth } from '../../../../common/user';
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

export function loadMeilingV1SessionTokens() {
  if (fs.existsSync(config.session.v1.dataPath)) {
    tokenSessions = JSON.parse(
      fs.readFileSync(config.session.v1.dataPath, { encoding: 'utf-8' }),
    ) as MeilingV1TokenDataFile;
    for (const tokenData of tokenSessions.issuedTokens) {
      tokenData.expiresAt = new Date(tokenData.expiresAt);
      tokenData.firstIssued = new Date(tokenData.firstIssued);
      tokenData.lastUsed = new Date(tokenData.lastUsed);
    }

    garbageCollectMeilingV1Tokens();
  }
}

export function garbageCollectMeilingV1Tokens() {
  // remove duplicates
  tokenSessions.issuedTokens = tokenSessions.issuedTokens.filter(
    (n) => tokenSessions.issuedTokens.map((b) => n.token === b.token).filter((b) => b).length === 1,
  );

  // remove expired
  tokenSessions.issuedTokens = tokenSessions.issuedTokens.filter((n) => n.expiresAt.getTime() < new Date().getTime());
}

export function saveMeilingV1Tokens() {
  fs.writeFileSync(config.session.v1.dataPath, JSON.stringify(tokenSessions, null, 2));
}

export function isMeilingV1Token(token?: string): boolean {
  return token !== undefined && tokenSessions.issuedTokens.filter((t) => t.token === token).length === 1;
}

export function getMeilingV1TokenFromRequest(req: FastifyRequest): string | undefined {
  if (req.headers.authorization) {
    return req.headers.authorization.split(' ').splice(1).join(' ');
  }
  return;
}

export function createMeilingV1Token(req: FastifyRequest): string | undefined {
  if (
    tokenSessions.issuedTokens.filter(
      (t) => t.ip === req.ip && new Date().getTime() - config.session.v1.rateLimit.timeframe < t.firstIssued.getTime(),
    ).length > config.session.v1.rateLimit.maxTokenPerIP
  ) {
    return undefined;
  }

  const token = generateToken();

  tokenSessions.issuedTokens.push({
    token,
    ip: req.ip,
    session: {},
    expiresAt: new Date(new Date().getTime() + config.session.v1.maxAge),
    firstIssued: new Date(),
    lastUsed: new Date(),
  });

  saveMeilingV1Tokens();

  return token;
}

export function getMeilingV1Session(req: FastifyRequest): MeilingV1Session | undefined {
  let data: MeilingV1Session | undefined;
  let token: string | undefined = undefined;

  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    token = getMeilingV1TokenFromRequest(req);

    if (token) {
      if (isMeilingV1Token(token)) {
        const session = tokenSessions.issuedTokens.find((n) => n.token === token);
        const expiresAt = session?.expiresAt;

        if (expiresAt) {
          if (new Date().getTime() > expiresAt.getTime()) {
            data = undefined;
          } else {
            data = session?.session;
          }
        } else {
          data = undefined;
        }
      } else {
        data = undefined;
      }
    } else {
      data = undefined;
    }
  }

  saveMeilingV1Tokens();

  return data;
}

export function setMeilingV1Session(req: FastifyRequest, data?: MeilingV1Session) {
  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    const token = getMeilingV1TokenFromRequest(req);

    if (token) {
      if (isMeilingV1Token(token)) {
        if (data) {
          const tokenData = tokenSessions.issuedTokens.find((n) => n.token === token);
          if (tokenData) {
            tokenData.session = data;
            tokenData.expiresAt = new Date(new Date().getTime() + config.session.v1.maxAge);
          }
        } else {
          tokenSessions.issuedTokens = tokenSessions.issuedTokens.filter((n) => n.token !== token);
        }
      }
    }
  }

  saveMeilingV1Tokens();
}

export function setMeilingV1ExtendedAuthSession(
  req: FastifyRequest,
  extAuth: MeilingV1SessionExtendedAuthentication | undefined,
) {
  const prevSession = getMeilingV1Session(req);
  const session = {
    ...prevSession,
    extendedAuthentication: extAuth,
  } as MeilingV1Session;

  setMeilingV1Session(req, session);
}

export function setMeilingV1ExtendedAuthSessionMethodAndChallenge(
  req: FastifyRequest,
  method?: MeilingV1ExtendedAuthMethods,
  challenge?: string | undefined,
) {
  const session = getMeilingV1Session(req);

  if (session) {
    if (session.extendedAuthentication) {
      session.extendedAuthentication.method = method === undefined ? session.extendedAuthentication.method : method;
      session.extendedAuthentication.challenge =
        challenge === undefined ? session.extendedAuthentication.challenge : challenge;
    }

    setMeilingV1Session(req, session);
  }
}

export async function checkPreviouslyLoggedinMeilingV1Session(
  req: FastifyRequest,
  user: User | string,
): Promise<boolean> {
  const session = getMeilingV1Session(req);

  if (session) {
    if (session.previouslyLoggedIn === undefined) {
      session.previouslyLoggedIn = [];
    }

    const userData = await getUserPlainInfo(user);
    if (userData === null || userData === undefined) {
      return false;
    }

    const userId = userData.id;

    const result = session.previouslyLoggedIn.filter((n) => n.id === userId);
    console.log(result);

    return result.length > 0;
  } else {
    return false;
  }
}

export async function loginMeilingV1Session(req: FastifyRequest, user: User | string) {
  const session = getMeilingV1Session(req);

  if (session) {
    if (session.user === undefined) {
      session.user = [];
    }

    if (session.previouslyLoggedIn === undefined) {
      session.previouslyLoggedIn = [];
    }

    const userData = await getUserPlainInfo(user);
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

    setMeilingV1Session(req, session);
  }

  return;
}

export async function logoutMeilingV1Session(req: FastifyRequest, user?: User | string) {
  const session = getMeilingV1Session(req);

  if (session) {
    if (user) {
      if (session.user === undefined) {
        session.user = [];
      } else {
        const userData = await getUserPlainInfo(user);

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

    setMeilingV1Session(req, session);
  }
}

export async function getLoggedInMeilingV1Session(req: FastifyRequest) {
  const session = getMeilingV1Session(req);

  if (session) {
    if (session.user === undefined) {
      session.user = [];
    }

    const users = [];

    for (const user of session.user) {
      const thisUser = await getUserInfo(user.id);
      if (thisUser !== null && thisUser !== undefined) {
        users.push(thisUser);
        updateLastAuth(thisUser);
      }
    }

    return users;
  }
}

export function hasMeilingV1UserLoggedIn(session: MeilingV1Session) {
  return session.user !== undefined && session.user.length > 0;
}

export function hasMeilingV1ExtendedAuthSession(session: MeilingV1Session) {
  return session.extendedAuthentication !== undefined;
}

export function getMeilingV1ExtendedAuthSession(session: MeilingV1Session) {
  return session.extendedAuthentication;
}
