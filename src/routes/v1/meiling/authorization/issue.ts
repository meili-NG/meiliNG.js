import { FastifyReply, FastifyRequest } from 'fastify';
import libphonenumberJs from 'libphonenumber-js';
import { FastifyRequestWithSession } from '..';
import * as Notification from '../../../../common/notification';
import { generateToken } from '../../../../common/token';
import * as Utils from '../../../../common/utils';
import config from '../../../../resources/config';
import { MeilingV1Challenge } from '../common';
import { appendAuthorizationStatus } from '../common/session';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType, MeilingV1ExtendedAuthMethods } from '../interfaces';

type MeilingV1AuthorizationIssueQuery = MeilingV1AuthorizationIssueEmailQuery | MeilingV1AuthorizationIssuePhoneQuery;

interface MeilingV1AuthorizationIssueEmailQuery {
  type: 'email';
  lang?: Notification.TemplateLanguage;
  to: string;
}

interface MeilingV1AuthorizationIssuePhoneQuery {
  type: 'phone';
  lang?: Notification.TemplateLanguage;
  to: string;
}

export async function meilingV1AuthorizationIssueHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1AuthorizationIssueQuery;

  const createdAt = new Date();
  const challenge = generateToken(6, '0123456789');

  const lang = body.lang ? body.lang : 'ko';

  try {
    if (body.type === 'email') {
      const email = body.to;
      if (!Utils.isValidEmail(email)) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'email is not valid');
        return;
      }

      if (session.authorizationStatus?.email?.challenge.challengeCreatedAt) {
        const to = session.authorizationStatus.email.to;

        if (to === email) {
          const prevCreatedAt = new Date(session.authorizationStatus?.email?.challenge.challengeCreatedAt);

          if (MeilingV1Challenge.isChallengeRateLimited(MeilingV1ExtendedAuthMethods.EMAIL, prevCreatedAt)) {
            sendMeilingError(
              rep,
              MeilingV1ErrorType.AUTHORIZATION_REQUEST_RATE_LIMITED,
              'old token is still valid for email verification. rate_limited',
            );
            return;
          }
        }
      }

      await Notification.sendNotification(Notification.NotificationMethod.EMAIL, {
        type: 'template',
        templateId: Notification.TemplateId.AUTHORIZATION_CODE,
        lang,

        messages: [
          {
            to: email,
            variables: {
              code: challenge,
            },
          },
        ],
      });

      await appendAuthorizationStatus(req, {
        email: {
          to: email,
          challenge: {
            challenge,
            challengeCreatedAt: createdAt,
          },
          isVerified: false,
        },
      });
    } else if (body.type === 'phone') {
      const phone = libphonenumberJs(body.to);

      if (!phone) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'phone number is not valid');
        return;
      }

      if (session.authorizationStatus?.phone?.challenge.challengeCreatedAt) {
        const to = libphonenumberJs(session.authorizationStatus.phone.to);

        if (to && to.formatInternational() === phone.formatInternational()) {
          const prevCreatedAt = new Date(session.authorizationStatus?.phone?.challenge.challengeCreatedAt);

          if (MeilingV1Challenge.isChallengeRateLimited(MeilingV1ExtendedAuthMethods.SMS, prevCreatedAt)) {
            sendMeilingError(
              rep,
              MeilingV1ErrorType.AUTHORIZATION_REQUEST_RATE_LIMITED,
              'old token is still valid for phone authorization. rate_limited',
            );
            return;
          }
        }
      }

      let method: Notification.NotificationMethod = Notification.NotificationMethod.SMS;

      if (phone.country === 'KR' && config) {
        method = Notification.NotificationMethod.ALIMTALK;
      }

      await Notification.sendNotification(method, {
        type: 'template',
        templateId: Notification.TemplateId.AUTHORIZATION_CODE,
        lang,

        messages: [
          {
            to: phone.formatInternational(),
            variables: {
              code: challenge,
            },
          },
        ],
      });

      await appendAuthorizationStatus(req, {
        phone: {
          to: phone.formatInternational(),
          challenge: {
            challenge,
            challengeCreatedAt: createdAt,
          },
          isVerified: false,
        },
      });
    } else {
      sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_AUTHORIZATION_TYPE);
      return;
    }
  } catch (e) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'Failed to communicate with Server');
    console.error(e);
    return;
  }

  rep.send({
    success: true,
  });
}
