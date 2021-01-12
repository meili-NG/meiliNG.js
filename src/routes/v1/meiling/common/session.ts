import { User } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import fs, { promises as fsNext } from 'fs';
import { config } from '../../../..';
import { generateToken } from '../../../../common';
import { getUserInfo, getUserPlainInfo, updateLastAuth } from '../../../../common/user';
import { MeilingV1Session, MeilingV1SessionExtendedAuthentication } from '../interfaces';
import { MeilingV1ExtendedAuthMethods } from '../interfaces/query';

interface TokenSessionFile {
  tokens: string[];
  data: {
    [key: string]: TokenSessionData;
  };
}

type TokenSessionData =
  | {
      session: MeilingV1Session;
      expiresAt: Date;
    }
  | undefined;

let tokenSessions: TokenSessionFile = {
  tokens: [],
  data: {},
};

const sessionName = 'meiling-v1';

export function loadMeilingV1SessionTokens() {
  if (fs.existsSync(config.session.tokenDataPath)) {
    tokenSessions = JSON.parse(
      fs.readFileSync(config.session.tokenDataPath, { encoding: 'utf-8' }),
    ) as TokenSessionFile;
    for (const token in tokenSessions.data) {
      if (tokenSessions.data[token] !== undefined) {
        (tokenSessions.data[token] as any).expiresAt = new Date((tokenSessions.data[token] as any).expiresAt);
      }
    }

    garbageCollectMeilingV1Tokens();
  }
}

export function garbageCollectMeilingV1Tokens() {
  // remove duplicates
  tokenSessions.tokens = tokenSessions.tokens.filter(
    (n) => tokenSessions.tokens.map((b) => n === b).filter((b) => b).length === 1,
  );

  const expiredTokens = [];

  for (const token in tokenSessions.data) {
    if (tokenSessions.data[token] !== undefined) {
      const expired = (tokenSessions.data[token] as any).expiresAt.getTime() < new Date().getTime();
      if (expired) expiredTokens.push(token);
    }
  }

  for (const token of expiredTokens) {
    tokenSessions.data[token] = undefined;
    tokenSessions.tokens = tokenSessions.tokens.filter((n) => n !== token);
  }
}

export function saveMeilingV1Tokens() {
  fs.writeFileSync(config.session.tokenDataPath, JSON.stringify(tokenSessions, null, 2));
}

export function isMeilingV1Token(token?: string): boolean {
  return token !== undefined && tokenSessions.tokens.includes(token);
}

export function getMeilingV1Token(req: FastifyRequest): string | undefined {
  if (req.headers.authorization) {
    return req.headers.authorization.split(' ').splice(1).join(' ');
  }
  return;
}

export function createMeilingV1Token(): string {
  const token = generateToken();

  tokenSessions.tokens.push(token);
  tokenSessions.data[token] = {
    session: {},
    expiresAt: new Date(new Date().getTime() + config.session.maxAge),
  };

  saveMeilingV1Tokens();

  return token;
}

export function getMeilingV1Session(req: FastifyRequest): MeilingV1Session {
  let data: MeilingV1Session | undefined | null;
  let token = undefined;

  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    token = getMeilingV1Token(req);

    if (token) {
      if (tokenSessions.tokens.includes(token)) {
        const session = tokenSessions.data[token];
        const expiresAt = session?.expiresAt;

        if (expiresAt) {
          if (new Date().getTime() > expiresAt.getTime()) {
            data = undefined;
          } else {
            data = session?.session;
          }
        } else {
          data = null;
        }
      } else {
        data = null;
      }
    } else {
      data = null;
    }
  } else {
    if (req.session) {
      data = req.session.get(sessionName);
    } else {
      data = null;
    }
  }

  if (data === undefined || data === null) {
    data = {};
    setMeilingV1Session(req, data);
  }

  saveMeilingV1Tokens();

  return data;
}

export function setMeilingV1Session(req: FastifyRequest, data?: MeilingV1Session) {
  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    const token = getMeilingV1Token(req);

    if (token) {
      if (tokenSessions.tokens.includes(token)) {
        if (data) {
          tokenSessions.data[token] = {
            session: data,
            expiresAt: new Date(new Date().getTime() + config.session.maxAge),
          };
        } else {
          tokenSessions.data[token] = undefined;
        }
      }
    }
  } else {
    if (req.session) {
      req.session.set(sessionName, data);
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

  if (session.extendedAuthentication) {
    session.extendedAuthentication.method = method === undefined ? session.extendedAuthentication.method : method;
    session.extendedAuthentication.challenge =
      challenge === undefined ? session.extendedAuthentication.challenge : challenge;
  }

  setMeilingV1Session(req, session);
}

export async function checkPreviouslyLoggedinMeilingV1Session(
  req: FastifyRequest,
  user: User | string,
): Promise<boolean> {
  const session = getMeilingV1Session(req);

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
}

export async function loginMeilingV1Session(req: FastifyRequest, user: User | string) {
  const session = getMeilingV1Session(req);
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
  return;
}

export async function logoutMeilingV1Session(req: FastifyRequest, user?: User | string) {
  const session = getMeilingV1Session(req);

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

export async function getLoggedInMeilingV1Session(req: FastifyRequest) {
  const session = getMeilingV1Session(req);

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

export function hasMeilingV1UserLoggedIn(session: MeilingV1Session) {
  return session.user !== undefined && session.user.length > 0;
}

export function hasMeilingV1ExtendedAuthSession(session: MeilingV1Session) {
  return session.extendedAuthentication !== undefined;
}

export function getMeilingV1ExtendedAuthSession(session: MeilingV1Session) {
  return session.extendedAuthentication;
}
