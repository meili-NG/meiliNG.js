import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import libphonenumberJs from 'libphonenumber-js';
import { FastifyRequestWithSession } from '.';
import { User, Utils } from '../../../common';
import {
  convertToNotificationMethod,
  sendNotification,
  TemplateId,
  TemplateLanguage,
} from '../../../common/notification';
import config from '../../../resources/config';
import { getPrismaClient } from '../../../resources/prisma';
import { MeilingV1Challenge } from './common';
import { generateChallenge, isChallengeRateLimited, verifyChallenge } from './common/challenge';
import { setAuthorizationStatus, setPasswordResetSession } from './common/session';
import { getAvailableExtendedAuthenticationMethods } from './common/user';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType, MeilingV1PasswordResetSession } from './interfaces';
import { MeilingV1ExtendedAuthMethods, MeilingV1PasswordReset } from './interfaces/query';

export async function lostPasswordHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;
  let body;

  try {
    body = Utils.convertJsonIfNot<MeilingV1PasswordReset>(req.body);
  } catch (e) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is not a valid JSON.');
    return;
  }

  if (body.password) {
    if (!session.passwordReset?.isVerified || !session.passwordReset.passwordResetUser) {
      sendMeilingError(
        rep,
        MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_COMPLETED,
        'password reset request not completed yet',
      );
      return;
    }

    const uuid = session.passwordReset.passwordResetUser;
    await getPrismaClient().authorization.deleteMany({
      where: {
        method: 'PASSWORD',
        user: {
          id: uuid,
        },
      },
    });

    await User.addPassword(uuid, body.password);
    await setAuthorizationStatus(req, undefined);
    await setPasswordResetSession(req, undefined);

    rep.send({ success: true });
    return;
  }

  if (!body.context?.username) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body does not contain context: username');
    return;
  }

  const username = body?.context?.username;

  if (!username) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'username is missing');
    return;
  }

  const users = await User.findByUsername(username);

  if (Utils.isValidEmail(username)) {
    users.push(...(await User.findByEmail(username)));
  }

  if (users.length > 1) {
    sendMeilingError(rep, MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED, 'more than one user has matched');
    return;
  } else if (users.length < 1) {
    sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'no user was found!');
    return;
  }

  const user = users[0];

  if (!body.method) {
    const methods = (await getAvailableExtendedAuthenticationMethods(user, 'password_reset')).map((n) => n.method);

    rep.send({
      methods,
    });
    return;
  }

  if (!body.data?.challengeResponse) {
    const methods = await getAvailableExtendedAuthenticationMethods(user, 'password_reset');

    // TODO: make it configurable
    const lang: TemplateLanguage = 'ko';

    // TODO: get lang from body

    // TODO: make it configurable
    const currentMethod: MeilingV1ExtendedAuthMethods = body.method.toLowerCase() as MeilingV1ExtendedAuthMethods;

    const challenge = generateChallenge(currentMethod);
    if (!challenge) {
      sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD);
      return;
    }

    if (
      methods.map((n) => n.method.toLowerCase() as string).filter((n) => n === currentMethod.toLowerCase()).length === 0
    ) {
      sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD);
      return;
    }

    let to: string | undefined = undefined;

    if (currentMethod === MeilingV1ExtendedAuthMethods.EMAIL) {
      const to = (await User.getPrimaryEmail(user.id))?.email;

      if (!to || !Utils.isValidEmail(to)) {
        sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID, 'email does not exist on this user');
        return;
      }
    } else if (currentMethod === MeilingV1ExtendedAuthMethods.SMS) {
      const toRaw = (await User.getPrimaryPhone(user.id))?.phone;

      if (toRaw) {
        const phoneParsed = libphonenumberJs(toRaw);
        if (phoneParsed) {
          to = phoneParsed.formatInternational();
        }
      }

      if (!to) {
        sendMeilingError(
          rep,
          MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID,
          'phone number does not exist on this user',
        );
        return;
      }
    } else {
      // TODO: Create Lost Password flow for other method.
      // but I think common flow can cover this?
    }

    if (to !== undefined) {
      if (isChallengeRateLimited(body.method, session.passwordReset?.challengeCreatedAt)) {
        sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_RATE_LIMITED, 'You are rate limited');

        return;
      }

      const notificationMethod = convertToNotificationMethod(currentMethod);
      if (!notificationMethod) {
        sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID, 'invalid authorization method');
        return;
      }

      await sendNotification(notificationMethod, {
        type: 'template',
        templateId: TemplateId.AUTHORIZATION_CODE,
        lang,
        messages: [
          {
            to,
            variables: {
              // TODO: fix eGovFrame like template system.
              // LDM's work required beforehand. est. 10d+
              코드: challenge,
            },
          },
        ],
      });
    }

    await setPasswordResetSession(req, {
      method: body.method,
      challenge: challenge,
      challengeCreatedAt: new Date(),
      passwordResetUser: user.id,
    });

    rep.send({
      success: true,
      challenge: MeilingV1Challenge.shouldSendChallenge(body.method) ? challenge : undefined,
    });
    return;
  }

  if (
    !Utils.isValidValue(
      session.passwordReset,
      session.passwordReset?.challenge,
      session.passwordReset?.challengeCreatedAt,
    )
  ) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED,
      'generation request was not generated in first place.',
    );
    return;
  }

  const passwordReset = session.passwordReset as MeilingV1PasswordResetSession;
  if (
    !passwordReset.method ||
    passwordReset.method.toLowerCase() !== body.method.toLowerCase() ||
    !passwordReset.passwordResetUser
  ) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED,
      'generation request was not generated with particular method',
    );
    return;
  }

  if (
    !passwordReset.challengeCreatedAt ||
    new Date().getTime() - new Date(passwordReset.challengeCreatedAt).getTime() >
      1000 * config.token.invalidate.meiling.CHALLENGE_TOKEN
  ) {
    sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_TIMEOUT, 'generated request was timed out');
    return;
  }

  const isValid = await verifyChallenge(passwordReset.method, passwordReset.challenge, body.data.challengeResponse);
  if (!isValid) {
    sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID, 'invalid challenge');
    return;
  }

  await setPasswordResetSession(req, {
    passwordResetUser: passwordReset.passwordResetUser,
    isVerified: true,
  });

  rep.send({
    success: true,
  });
}
