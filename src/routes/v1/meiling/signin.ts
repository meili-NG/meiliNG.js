import { Authorization, User } from '@prisma/client';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import {
  findMatchingUsersByUsernameOrEmail,
  getUserInfo,
  getUserPlainInfo,
  updateLastAuth,
  updateLastSignIn,
} from '../../../common/user';
import {
  generateChallengeV1,
  getExtendedAuthenticationMethodsV1,
  getDatabaseEquivalentFromAuthenticationV1,
  getAuthenticationV1FromDatabaseEquivalent,
  verifyChallengeV1,
  shouldSendChallengeV1,
} from './common';
import {
  checkPreviouslyLoggedinMeilingV1Session,
  getMeilingV1Session,
  loginMeilingV1Session,
  setMeilingV1ExtendedAuthSession,
  setMeilingV1ExtendedAuthSessionMethodAndChallenge,
} from './common/session';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';
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
  let body;

  if (typeof req.body !== 'string') {
    body = req.body as MeilingV1SignInBody;
  } else {
    try {
      body = JSON.parse(req.body) as MeilingV1SignInBody;
    } catch (e) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is not a valid JSON.');
      return;
    }
  }

  let userToLogin: User;
  if (body.type === MeilingV1SigninType.USERNAME_CHECK) {
    const username = body?.data?.username;

    if (username === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is missing username.');
      return;
    }

    const users = await findMatchingUsersByUsernameOrEmail(username);

    if (users.length === 1 && (await checkPreviouslyLoggedinMeilingV1Session(req, users[0]))) {
      const user = await getUserInfo(users[0]);

      if (user) {
        rep.send({
          success: true,
          data: {
            id: user.id,
            profileUrl: user.profileUrl,
            emails: user.emails,
            name: user.name,
            username: user.username,
          },
        });
      } else {
        rep.send({
          success: false,
        });
      }
    } else if (users.length === 0) {
      rep.send({
        success: false,
      });
    } else {
      rep.send({
        success: true,
      });
    }

    return;
  } else if (body.type === MeilingV1SigninType.USERNAME_AND_PASSWORD) {
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
      const twoFactorMethods = await getExtendedAuthenticationMethodsV1(user, body.type);

      if (twoFactorMethods.length > 0) {
        // set the session for two factor authentication

        setMeilingV1ExtendedAuthSession(req, {
          id: user.id,
          type: MeilingV1SigninType.TWO_FACTOR_AUTH,
        });

        sendMeilingError(
          rep,
          MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED,
          'two factor authentication is required.',
        );
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

      authMethods.push(...(await getExtendedAuthenticationMethodsV1(user, body.type, signinMethod)));
    } else if (body.type === MeilingV1SigninType.PASSWORDLESS) {
      const username = body?.context?.username;

      if (username !== undefined) {
        const users = await findMatchingUsersByUsernameOrEmail(username);

        if (users.length === 0) {
          sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'Wrong username.');
          return;
        }

        for (const user of users) {
          const thisMethods = await getExtendedAuthenticationMethodsV1(user, body.type);
          authMethods.push(...thisMethods);
        }
      } else {
        authMethods.push(...(await getExtendedAuthenticationMethodsV1(undefined, body.type, signinMethod)));
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

      setMeilingV1ExtendedAuthSessionMethodAndChallenge(req, signinMethod, challenge);

      rep.send({
        type: body.type,
        challenge: shouldSendChallengeV1(signinMethod) ? challenge : undefined,
      });
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

    if (challenge === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, `challenge is missing.`);
      return;
    }

    const authMethodCheckPromises = [];
    const authMethodCheckUsers: string[] = [];

    // authMethod
    for (const authMethod of authMethods) {
      // if authMethod is current authMethod:
      if (getAuthenticationV1FromDatabaseEquivalent(authMethod.method) === signinMethod) {
        // check database is not corrupted.
        if (authMethod.data !== null) {
          let data;
          if (typeof data === 'string') {
            data = JSON.parse(authMethod.data as string);
          } else {
            data = authMethod.data;
          }

          if (authMethod.userId !== null) {
            // add promise to array
            authMethodCheckPromises.push(verifyChallengeV1(signinMethod, challenge, challengeResponse, data));
            authMethodCheckUsers.push(authMethod.userId);
          }
        }
      }
    }

    const authMethodCheckResults = await Promise.all(authMethodCheckPromises);
    const authMethodCheckIndex = authMethodCheckResults
      .map((n, i) => (n === true ? i : undefined))
      .filter((n) => n !== undefined) as number[];

    for (const index of authMethodCheckIndex) {
      const userId = authMethodCheckUsers[index];
      console.log(userId);

      if (userId !== null) {
        if (authorizedUsers.filter((n) => n.id === userId).length === 0) {
          const user = await getUserPlainInfo(userId);
          if (user !== null && user !== undefined) {
            authorizedUsers.push(user);
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
      sendMeilingError(rep, MeilingV1ErrorType.SIGNIN_FAILED, 'No matching users');
      return;
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_SIGNIN_TYPE, 'invalid signin type.');
    return;
  }

  await loginMeilingV1Session(req, userToLogin);
  setMeilingV1ExtendedAuthSession(req, undefined);

  updateLastAuth(userToLogin);
  updateLastSignIn(userToLogin);

  rep.status(200).send({
    success: true,
  });
}
