import { User } from '@prisma/client';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { findMatchingUsersByUsernameOrEmail } from '../../../common/user';
import {
  generateChallengeV1,
  getAuthenticationMethodsV1,
  getAuthenticationV1ToDatabaseEquivalent,
  getDataBaseAuthenticationToAuthenticationV1,
} from './common';
import { sendMeilingError } from './error';
import { MeilingV1Session, MeilingV1ErrorType } from './interfaces';
import {
  MeilingV1ExtendedAuthMethods,
  MeilingV1SignInBody,
  MeilingV1SigninType,
  MeilingV1SignInUsernameAndPassword,
} from './interfaces/query';

export async function meilingV1SigninHandler(req: FastifyRequest, rep: FastifyReply) {
  let session = req.session.get('meiling-v1') as MeilingV1Session | null | undefined;

  if (session?.user?.id) {
    sendMeilingError(rep, MeilingV1ErrorType.ALREADY_LOGGED_IN, 'You are already logged in.');
    return;
  }

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
  let allowLogin = false;

  if (body.type === MeilingV1SigninType.USERNAME_AND_PASSWORD) {
    const username = body?.data?.username;
    const password = body?.data?.password;

    if (username === undefined || password === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is missing username and password.');
      return;
    }

    const users = await findMatchingUsersByUsernameOrEmail(username, password);

    if (users.length == 1) {
      userToLogin = users[0];
      allowLogin = true;
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
    // temp
    return;
  } else if (body.type === MeilingV1SigninType.PASSWORDLESS) {
    const username = body?.context?.username;
    const signinMethod = body?.data?.method;

    if (username === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is missing username.');
      return;
    }

    const users = await findMatchingUsersByUsernameOrEmail(username);

    if (users.length == 0) {
      sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'Wrong username.');
      return;
    }

    // which passwordless-login methods are available?
    if (signinMethod === undefined) {
      const methods: MeilingV1ExtendedAuthMethods[] = [];
      for (const user of users) {
        const thisMethods = await getAuthenticationMethodsV1(user, body.type);
        for (const thisMethod of thisMethods) {
          const methodMeilingV1 = getDataBaseAuthenticationToAuthenticationV1(thisMethod.method);
          if (methodMeilingV1 !== null) {
            if (!methods.includes(methodMeilingV1)) {
              methods.push(methodMeilingV1);
            }
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

    const authorizedUsers = [];

    for (const user of users) {
      const methods = (await getAuthenticationMethodsV1(user, body.type)).filter(
        (method) => getAuthenticationV1ToDatabaseEquivalent(signinMethod) === method.method,
      );

      for (const method of methods) {
      }
    }
  }

  return;
  session = {
    user: {
      id: userToLogin.id,
    },
  };
  req.session.set('meiling-v1', session);
}
