import { User } from '@prisma/client';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { prisma } from '../../..';
import { findMatchingUsersByUsernameOrEmail } from '../../../common/user';
import {
  generateChallengeV1,
  getAuthenticationMethodsV1,
  getDatabaseEquivalentFromAuthenticationV1,
  getAuthenticationV1FromDatabaseEquivalent,
  verifyChallengeV1,
} from './common';
import { sendMeilingError } from './error';
import { MeilingV1Session, MeilingV1ErrorType } from './interfaces';
import { MeilingV1ExtendedAuthMethods, MeilingV1SignInBody, MeilingV1SigninType } from './interfaces/query';

export async function meilingV1SigninHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = req.session.get('meiling-v1') as MeilingV1Session | null | undefined;

  if (typeof req.body !== 'string') {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request type.');
    return;
  }

  let body;
  try {
    body = JSON.parse(req.body) as MeilingV1SignInBody;
  } catch (e) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is not a valid JSON.');
    return;
  }

  let userToLogin: User;

  if (body.type === MeilingV1SigninType.USERNAME_AND_PASSWORD) {
    const username = body?.data?.username;
    const password = body?.data?.password;

    if (username === undefined || password === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is missing username and password.');
      return;
    }

    const users = await findMatchingUsersByUsernameOrEmail(username, password);

    if (users.length === 1) {
      userToLogin = users[0];
    } else if (users.length > 1) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED,
        'more than one user was matched, use username instead.',
      );
      return;
    } else {
      const tmpUsers = await findMatchingUsersByUsernameOrEmail(username);
      if (tmpUsers.length > 0) {
        sendMeilingError(rep, MeilingV1ErrorType.WRONG_PASSWORD, 'Wrong password.');
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'Wrong username.');
      }
      return;
    }

    const user = userToLogin;
    if (user.useTwoFactor) {
      const twoFactorMethods = await getAuthenticationMethodsV1(user, body.type);

      if (twoFactorMethods.length > 0) {
        // set the session for two factor authentication
        sendMeilingError(
          rep,
          MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED,
          'two factor authentication is required.',
        );
        return;
      }
    }
  } else if (body.type === MeilingV1SigninType.TWO_FACTOR_AUTH) {
    if (session?.extendedAuthentication === undefined) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED,
        'two factor authentication request is not generated yet. please check your login request.',
      );
      return;
    }

    const userId = session?.extendedAuthentication?.id;

    if (userId === undefined) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED,
        'two factor authentication request session does not contain user session. please redo your login.',
      );
      return;
    }

    const user = session.extendedAuthentication.id;

    // temp
    return;
  } else if (body.type === MeilingV1SigninType.PASSWORDLESS) {
    const username = body?.context?.username;
    const signinMethod = body?.data?.method;

    const authMethods = [];

    if (username !== undefined) {
      const users = await findMatchingUsersByUsernameOrEmail(username);

      if (users.length === 0) {
        sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'Wrong username.');
        return;
      }

      for (const user of users) {
        const thisMethods = await getAuthenticationMethodsV1(user, body.type);
        authMethods.push(...thisMethods);
      }
    } else {
      authMethods.push(...(await getAuthenticationMethodsV1(undefined, body.type, signinMethod)));
    }

    // which passwordless-login methods are available for this user?
    if (signinMethod === undefined) {
      const methods: MeilingV1ExtendedAuthMethods[] = [];

      for (const thisMethod of authMethods) {
        const methodMeilingV1 = getAuthenticationV1FromDatabaseEquivalent(thisMethod.method);
        if (methodMeilingV1 !== null) {
          if (!methods.includes(methodMeilingV1)) {
            methods.push(methodMeilingV1);
          }
        }
      }

      rep.send({
        methods,
      });
      return;
    }

    const challengeResponse = body?.data?.challengeResponse;

    // send me challenge
    if (challengeResponse === undefined) {
      const challenge = generateChallengeV1(signinMethod);

      rep.send({
        type: body.type,
        challenge,
      });
      return;
    }

    // challenge was already set. therefore, check for session.
    if (
      session?.extendedAuthentication === undefined ||
      session?.extendedAuthentication?.type !== MeilingV1SigninType.PASSWORDLESS
    ) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.PASSWORDLESS_REQUEST_NOT_GENERATED,
        'passwordless request was not generated yet or had been invalidated.',
      );
      return;
    }

    const extendedAuthSession = session.extendedAuthentication;
    if (extendedAuthSession.method !== body.data?.method) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.PASSWORDLESS_NOT_CURRENT_CHALLENGE_METHOD,
        `passwordless request is using different challenge method.
please request this endpoint without challengeResponse field to request challenge again.`,
      );
      return;
    }

    const authorizedUsers = [];

    const challenge = extendedAuthSession.challenge;

    for (const authMethod of authMethods) {
      if (authMethod.data !== null) {
        const data = JSON.parse(authMethod.data as string);
        if (await verifyChallengeV1(signinMethod, challenge, challengeResponse, data)) {
          const userId = authMethod.userId;
          if (userId !== null) {
            const user = await prisma.user.findFirst({
              where: {
                id: userId,
              },
            });
            if (user != null) {
              authorizedUsers.push(user);
            }
          }
          break;
        }
      }
    }

    if (authorizedUsers.length === 1) {
      userToLogin = authorizedUsers[0];
    } else if (authorizedUsers.length > 1) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED,
        'more than one user was matched, login using username instead.',
      );
      return;
    } else {
      sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'Wrong username.');
      return;
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid type field.');
    return;
  }

  if (session?.user?.ids) {
    if (session.user.ids.includes(userToLogin.id)) {
      sendMeilingError(rep, MeilingV1ErrorType.ALREADY_SIGNED_IN, 'You are already logged in.');
      return;
    } else {
      session.user.ids.push(userToLogin.id);
    }
  }

  req.session.set('meiling-v1', session);
}
