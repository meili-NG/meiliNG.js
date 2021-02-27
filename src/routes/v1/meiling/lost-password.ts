import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '.';
import { Token, User, Utils } from '../../../common';
import { NotificationMethod, sendNotification, TemplateId, TemplateLanguage } from '../../../common/notification';
import { isChallengeRateLimited } from './common/challenge';
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

  if (!body.method) {
    const methods = await getAvailableExtendedAuthenticationMethods(undefined, 'password_reset');

    rep.send({
      method: methods,
    });
    return;
  }

  if (!body.data?.challengeResponse) {
    if (isChallengeRateLimited(body.method, session.passwordReset?.challengeCreatedAt)) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body is not a valid JSON.');
      return;
    }

    if (!body.data?.challengeContext.username) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'body does not contain context: username');
      return;
    }

    let user = [];
    const usernameInput = body.data.challengeContext.username;

    if (Utils.isValidEmail(usernameInput)) {
      user = await User.findByUsername(usernameInput);
    } else {
      user = await User.findByEmail(usernameInput);
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

    if (body.method === MeilingV1ExtendedAuthMethods.EMAIL) {
      const to = (await User.getPrimaryEmail(user[0].id))?.email;

      // TODO: make it configurable
      const challenge = Token.generateToken(6, '0123456789');

      if (!to || !Utils.isValidEmail(to)) {
        sendMeilingError(rep, MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID, 'email does not exist on this user');
        return;
      }

      await sendNotification(NotificationMethod.EMAIL, {
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
    } else if (body.method === MeilingV1ExtendedAuthMethods.SMS) {
    }
  }

  rep.status(200).send({
    success: true,
  });
}
