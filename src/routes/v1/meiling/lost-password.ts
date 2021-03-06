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
import { MeilingV1Challenge } from './common';
import { generateChallenge, isChallengeRateLimited } from './common/challenge';
import { setPasswordResetSession } from './common/session';
import { getAvailableExtendedAuthenticationMethods } from './common/user';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';
import { MeilingV1ExtendedAuthMethods, MeilingV1PasswordReset } from './interfaces/query';

export async function meilingV1LostPasswordHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  let body;

  try {
    body = Utils.convertJsonIfNot<MeilingV1PasswordReset>(req.body);
  } catch (e) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is not a valid JSON.');
    return;
  }

  if (!body.data?.challengeContext.username) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body does not contain context: username');
    return;
  }

  const username = body?.data?.challengeContext.username;

  if (!username) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'username is missing');
    return;
  }

  if (!body.method) {
    const methods = await getAvailableExtendedAuthenticationMethods(undefined, 'password_reset');

    rep.send({
      method: methods,
    });
    return;
  }

  if (!body.data?.challengeResponse) {
    let user = [];
    const methods = await getAvailableExtendedAuthenticationMethods(username, 'password_reset');

    if (Utils.isValidEmail(username)) {
      user = await User.findByUsername(username);
    } else {
      user = await User.findByEmail(username);
    }

    if (user.length > 1) {
      sendMeilingError(rep, MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED, 'more than one user has matched');
      return;
    } else if (user.length < 1) {
      sendMeilingError(rep, MeilingV1ErrorType.WRONG_USERNAME, 'no user was found!');
      return;
    }

    // TODO: make it configurable
    const lang: TemplateLanguage = 'ko';

    // TODO: get lang from body

    // TODO: make it configurable
    const challenge = generateChallenge(body.method);
    if (!challenge) {
      sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD);
      return;
    }

    if (!methods.map((n) => n.method.toLowerCase() as string).includes(body.method.toLowerCase())) {
      sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD);
      return;
    }

    let to: string | undefined = undefined;

    if (body.method === MeilingV1ExtendedAuthMethods.EMAIL) {
      const to = (await User.getPrimaryEmail(user[0].id))?.email;

      if (!to || !Utils.isValidEmail(to)) {
        sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID, 'email does not exist on this user');
        return;
      }
    } else if (body.method === MeilingV1ExtendedAuthMethods.SMS) {
      const toRaw = (await User.getPrimaryPhone(user[0].id))?.phone;

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
    }

    if (to !== undefined) {
      if (isChallengeRateLimited(body.method, session.passwordReset?.challengeCreatedAt)) {
        sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_RATE_LIMITED, 'You are rate limited');

        return;
      }

      const notificationMethod = convertToNotificationMethod(body.method);
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
    });

    rep.send({
      to,
      challenge: MeilingV1Challenge.shouldSendChallenge(body.method) ? challenge : undefined,
    });
    return;
  }

  rep.status(200).send({
    success: true,
  });
}
