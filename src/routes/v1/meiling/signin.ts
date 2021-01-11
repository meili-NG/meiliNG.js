import { Authorization, AuthorizationMethod, User } from '@prisma/client';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { findMatchingUsersByUsernameOrEmail, getUserPlainInfo } from '../../../common/user';
import {
  generateChallengeV1,
  getAuthenticationMethodsV1,
  getDatabaseEquivalentFromAuthenticationV1,
  getAuthenticationV1FromDatabaseEquivalent,
  verifyChallengeV1,
} from './common';
import {
  getMeilingV1ExtendedAuthSession,
  getMeilingV1Session,
  hasMeilingV1ExtendedAuthSession,
  loginMeilingV1Session,
  setMeilingV1ExtendedAuthSession,
  setMeilingV1ExtendedAuthSessionMethodAndChallenge,
  setMeilingV1Session,
} from './common/session';
import { sendMeilingError } from './error';
import { MeilingV1Session, MeilingV1ErrorType } from './interfaces';
import { MeilingV1ExtendedAuthMethods, MeilingV1SignInBody, MeilingV1SigninType } from './interfaces/query';

function getMeilingAvailableAuthMethods(authMethods: Authorization[]) {
  const methods: MeilingV1ExtendedAuthMethods[] = [];

  for (const thisMethod of authMethods) {
    const methodMeilingV1 = getAuthenticationV1FromDatabaseEquivalent(thisMethod.method);
    if (methodMeilingV1 !== null) {
      if (!methods.includes(methodMeilingV1)) {
        methods.push(methodMeilingV1);
      }
    }
  }

  return methods;
}

export async function meilingV1SigninHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = getMeilingV1Session(req);

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

        setMeilingV1ExtendedAuthSession(req, {
          id: user.id,
          type: MeilingV1SigninType.TWO_FACTOR_AUTH,
        });
        return;
      }
    }
  } else if (body.type === MeilingV1SigninType.TWO_FACTOR_AUTH || body.type === MeilingV1SigninType.PASSWORDLESS) {
    const signinMethod = body?.data?.method;
    const authMethods = [];

    if (body.type === MeilingV1SigninType.TWO_FACTOR_AUTH) {
      if (session.extendedAuthentication?.type !== MeilingV1SigninType.TWO_FACTOR_AUTH) {
        sendMeilingError(
          rep,
          MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED,
          'two factor authentication request is not generated yet or overrided by passwordless login. please check your login request.',
        );
        return;
      }

      const userId = session.extendedAuthentication.id;

      if (userId === undefined) {
        sendMeilingError(
          rep,
          MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED,
          'two factor authentication request session does not contain user session. please redo your login.',
        );
        return;
      }

      const user = await getUserPlainInfo(userId);

      if (user === null) {
        sendMeilingError(
          rep,
          MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED,
          'two factor authentication request session does not valid userId session. please redo your login.',
        );
        return;
      }

      authMethods.push(...(await getAuthenticationMethodsV1(user, body.type, signinMethod)));
    } else if (body.type === MeilingV1SigninType.PASSWORDLESS) {
      const username = body?.context?.username;

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

      setMeilingV1ExtendedAuthSession(req, {
        type: MeilingV1SigninType.PASSWORDLESS,
      });
    }

    const availableMethods = await getMeilingAvailableAuthMethods(authMethods);

    // which passwordless-login methods are available for this user?
    if (signinMethod === undefined) {
      rep.send({
        methods: availableMethods,
      });
      return;
    }

    // check signinMethod is valid
    if (getDatabaseEquivalentFromAuthenticationV1(signinMethod) === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_SIGNIN_METHOD, 'invalid signin method: ' + signinMethod);
      return;
    }

    if (!availableMethods.includes(signinMethod)) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_SIGNIN_METHOD, 'unsupported signin method: ' + signinMethod);
      return;
    }

    // response of challenge
    const challengeResponse = body?.data?.challengeResponse;

    // if challengeResponse is blank, it means you need a challenge that you defined.
    if (challengeResponse === undefined) {
      const challenge = generateChallengeV1(signinMethod);

      rep.send({
        type: body.type,
        challenge,
      });

      setMeilingV1ExtendedAuthSessionMethodAndChallenge(req, signinMethod, challenge);
      return;
    }

    // challenge was already set. therefore, check for session.
    if (session?.extendedAuthentication === undefined || session?.extendedAuthentication?.type !== body.type) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED,
        'authentication request was not generated yet or had been invalidated.',
      );
      return;
    }

    // validate current method is same with session's extendedAuthentication
    const extendedAuthSession = session.extendedAuthentication;
    if (extendedAuthSession.method !== body.data?.method) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD,
        `authentication request is using different challenge method.
please request this endpoint without challengeResponse field to request challenge again.`,
      );
      return;
    }

    // challenge value from session
    const challenge = extendedAuthSession.challenge;
    const authorizedUsers: User[] = [];

    if (challenge !== undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, `challenge is missing.`);
      return;
    }

    // authMethod
    for (const authMethod of authMethods) {
      // if authMethod is current authMethod:
      if (getAuthenticationV1FromDatabaseEquivalent(authMethod.method) === signinMethod) {
        // check database is not corrupted.
        if (authMethod.data !== null) {
          const data = JSON.parse(authMethod.data as string);

          // run challenge
          if (await verifyChallengeV1(signinMethod, challenge, challengeResponse, data)) {
            // get userId and push to authorizedUsers
            const userId = authMethod.userId;
            if (userId !== null) {
              const user = await getUserPlainInfo(userId);
              if (user !== null && user !== undefined) {
                if (authorizedUsers.map((authUser) => authUser.id === user.id).indexOf(true) < 0) {
                  authorizedUsers.push(user);
                }
                break;
              }
            }
          }
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
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_SIGNIN_TYPE, 'invalid signin type.');
    return;
  }

  await loginMeilingV1Session(req, userToLogin);
  setMeilingV1ExtendedAuthSession(req, undefined);

  rep.status(200).send({
    success: true,
  });
}
