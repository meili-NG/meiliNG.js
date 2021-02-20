import { FastifyReply, FastifyRequest } from 'fastify';
import libphonenumberJs from 'libphonenumber-js';
import { FastifyRequestWithSession } from '..';
import * as Notification from '../../../../common/notification';
import * as Utils from '../../../../common/utils';
import { appendAuthorizationStatus } from '../common/session';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';

type MeilingV1AuthorizationIssueQuery = MeilingV1AuthorizationIssueEmailQuery | MeilingV1AuthorizationIssuePhoneQuery;

interface MeilingV1AuthorizationIssueEmailQuery {
  type: 'email';
  to: string;
}

interface MeilingV1AuthorizationIssuePhoneQuery {
  type: 'phone';
  to: string;
}

export async function meilingV1AuthorizationIssueHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1AuthorizationIssueQuery;

  const createdAt = new Date();
  const challenge = 'CHALLENGE';

  try {
    if (body.type === 'email') {
      const email = body.to;
      if (!Utils.isValidEmail(email)) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'email is not valid');
        return;
      }

      await Notification.sendNotification(Notification.NotificationMethod.EMAIL, {
        type: 'template',
        templateId: Notification.TemplateId.AUTHORIZATION_CODE,

        // TODO: get language
        lang: 'ko',

        messages: [
          {
            to: email,
            variables: {
              // TODO: remove eGovFrame-like variable name
              코드: challenge,
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

      await Notification.sendNotification(Notification.NotificationMethod.SMS, {
        type: 'template',
        templateId: Notification.TemplateId.AUTHORIZATION_CODE,

        // TODO: get language
        lang: 'ko',

        messages: [
          {
            to: phone.formatInternational(),
            variables: {
              // TODO: remove eGovFrame-like variable name
              코드: challenge,
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
    }
  } catch (e) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'Failed to communicate with Server');
  }

  rep.send({
    success: true,
  });
}
