import { User } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { getUserInfo, getUserPlainInfo, updateLastAuth } from '../../../../common/user';
import { MeilingV1Session, MeilingV1SessionExtendedAuthentication } from '../interfaces';
import { MeilingV1ExtendedAuthMethods } from '../interfaces/query';

const sessionName = 'meiling-v1';

export function getMeilingV1Session(req: FastifyRequest): MeilingV1Session {
  let data = req.session.get(sessionName) as MeilingV1Session | undefined | null;

  if (data === undefined || data === null) {
    data = {};
    setMeilingV1Session(req, data);
  }

  return data;
}

export function setMeilingV1Session(req: FastifyRequest, data: MeilingV1Session) {
  req.session.set(sessionName, data);
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

export async function loginMeilingV1Session(req: FastifyRequest, user: User | string) {
  const session = getMeilingV1Session(req);
  if (session.user === undefined) {
    session.user = [];
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

  setMeilingV1Session(req, session);
}

export async function logoutMeilingV1Session(req: FastifyRequest, user: User | string) {
  const session = getMeilingV1Session(req);
  if (session.user === undefined) {
    session.user = [];
  } else {
    const userData = await getUserPlainInfo(user);
    console.log('userData', userData);

    if (userData === null || userData === undefined) {
      return;
    }

    const accountsToLogout = session.user.filter((a) => a.id !== userData.id);
    console.log(accountsToLogout);

    session.user = accountsToLogout;
  }

  console.log(session);

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