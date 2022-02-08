import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import libphonenumberJs from 'libphonenumber-js';
import { FastifyRequestWithSession } from '.';
import { Meiling, Utils, Notification } from '../../../common';
import config from '../../../resources/config';
import { getPrismaClient } from '../../../resources/prisma';
import { Event } from '../../../common';

export async function lostPasswordHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;
  let body;

  try {
    body = Utils.convertJsonIfNot<Meiling.V1.Interfaces.PasswordResetBody>(req.body);
  } catch (e) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'body is not a valid JSON.');
    return;
  }

  if (body.password) {
    if (!session.passwordReset?.isVerified || !session.passwordReset.passwordResetUser) {
      Meiling.V1.Error.sendMeilingError(
        rep,
        Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_COMPLETED,
        'password reset request not completed yet',
      );
      return;
    }

    const uuid = session.passwordReset.passwordResetUser;
    await getPrismaClient().authentication.deleteMany({
      where: {
        method: 'PASSWORD',
        user: {
          id: uuid,
        },
      },
    });

    await Meiling.Identity.User.addPassword(uuid, body.password);
    await Meiling.V1.Session.setAuthenticationStatus(req, undefined);
    await Meiling.V1.Session.setPasswordResetSession(req, undefined);

    rep.send({ success: true });
    return;
  }

  if (!body.context?.username) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'body does not contain context: username',
    );
    return;
  }

  const username = body?.context?.username;

  if (!username) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'username is missing');
    return;
  }

  const users = await Meiling.Identity.User.findByUsername(username);

  if (Utils.isValidEmail(username)) {
    users.push(...(await Meiling.Identity.User.findByEmail(username)));
  }

  if (users.length > 1) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.MORE_THAN_ONE_USER_MATCHED,
      'more than one user has matched',
    );
    return;
  } else if (users.length < 1) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.WRONG_USERNAME, 'no user was found!');
    return;
  }

  const user = users[0];

  if (!body.method) {
    const methods = (await Meiling.V1.User.getAvailableExtendedAuthenticationMethods(user, 'password_reset')).map(
      (n) => n.method,
    );

    rep.send({
      methods,
    });
    return;
  }

  if (!body.data?.challengeResponse) {
    const methods = await Meiling.V1.User.getAvailableExtendedAuthenticationMethods(user, 'password_reset');

    // TODO: make it configurable
    const lang: Notification.TemplateLanguage = 'ko';

    // TODO: get lang from body

    // TODO: make it configurable
    const currentMethod: Meiling.V1.Interfaces.ExtendedAuthMethods =
      body.method.toLowerCase() as Meiling.V1.Interfaces.ExtendedAuthMethods;

    const challenge = Meiling.V1.Challenge.generateChallenge(currentMethod);
    if (!challenge) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNSUPPORTED_SIGNIN_METHOD);
      return;
    }

    if (
      methods.map((n) => n.method.toLowerCase() as string).filter((n) => n === currentMethod.toLowerCase()).length === 0
    ) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNSUPPORTED_SIGNIN_METHOD);
      return;
    }

    let to: string | undefined = undefined;

    if (currentMethod === Meiling.V1.Interfaces.ExtendedAuthMethods.EMAIL) {
      const to = (await Meiling.Identity.User.getPrimaryEmail(user.id))?.email;

      if (!to || !Utils.isValidEmail(to)) {
        Meiling.V1.Error.sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID,
          'email does not exist on this user',
        );
        return;
      }
    } else if (currentMethod === Meiling.V1.Interfaces.ExtendedAuthMethods.SMS) {
      const toRaw = (await Meiling.Identity.User.getPrimaryPhone(user.id))?.phone;

      if (toRaw) {
        const phoneParsed = libphonenumberJs(toRaw);
        if (phoneParsed) {
          to = phoneParsed.formatInternational();
        }
      }

      if (!to) {
        Meiling.V1.Error.sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID,
          'phone number does not exist on this user',
        );
        return;
      }
    } else {
      // TODO: Create Lost Password flow for other method.
      // but I think common flow can cover this?
    }

    if (to !== undefined) {
      if (Meiling.V1.Challenge.isChallengeRateLimited(body.method, session.passwordReset?.challengeCreatedAt)) {
        Meiling.V1.Error.sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_RATE_LIMITED,
          'You are rate limited',
        );

        return;
      }

      const notificationMethod = Meiling.V1.Notification.convertToNotificationMethod(currentMethod);
      if (!notificationMethod) {
        Meiling.V1.Error.sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID,
          'invalid authorization method',
        );
        return;
      }

      Event.Baridegi.sendBaridegiLog(Event.Baridegi.BaridegiLogType.CREATE_AUTHENTICATION_REQUEST, {
        type: currentMethod,
        notificationApi: {
          rawType: notificationMethod,
        },
        ip: req.ip,
        to,
      });

      await Notification.sendNotification(notificationMethod, {
        type: 'template',
        templateId: Notification.TemplateId.AUTHENTICATION_CODE,
        lang,
        messages: [
          {
            to,
            variables: {
              code: challenge,
            },
          },
        ],
      });
    }

    await Meiling.V1.Session.setPasswordResetSession(req, {
      method: body.method,
      challenge: challenge,
      challengeCreatedAt: new Date(),
      passwordResetUser: user.id,
    });

    rep.send({
      success: true,
      challenge: Meiling.V1.Challenge.shouldSendChallenge(body.method) ? challenge : undefined,
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
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED,
      'generation request was not generated in first place.',
    );
    return;
  }

  const passwordReset = session.passwordReset as Meiling.V1.Interfaces.SessionPasswordReset;
  if (
    !passwordReset.method ||
    passwordReset.method.toLowerCase() !== body.method.toLowerCase() ||
    !passwordReset.passwordResetUser
  ) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED,
      'generation request was not generated with particular method',
    );
    return;
  }

  if (
    !passwordReset.challengeCreatedAt ||
    new Date().getTime() - new Date(passwordReset.challengeCreatedAt).getTime() >
      1000 * config.token.invalidate.meiling.CHALLENGE_TOKEN
  ) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.AUTHENTICATION_TIMEOUT,
      'generated request was timed out',
    );
    return;
  }

  const isValid = await Meiling.V1.Challenge.verifyChallenge(
    passwordReset.method,
    passwordReset.challenge,
    body.data.challengeResponse,
  );
  if (!isValid) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID,
      'invalid challenge',
    );
    return;
  }

  await Meiling.V1.Session.setPasswordResetSession(req, {
    passwordResetUser: passwordReset.passwordResetUser,
    isVerified: true,
  });

  rep.send({
    success: true,
  });
}
