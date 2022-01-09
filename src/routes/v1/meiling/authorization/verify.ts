import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '..';
import { BaridegiLogType, sendBaridegiLog } from '../../../../common/event/baridegi';
import config from '../../../../resources/config';
import { getPrismaClient } from '../../../../resources/prisma';
import { setAuthorizationStatus } from '../../../../common/meiling/v1/session';
import { sendMeilingError } from '../../../../common/meiling/v1/error/error';
import { Meiling } from '../../../../common';

type MeilingV1VerificationQuery = MeilingV1PhoneVerificationQuery | MeilingV1EmailVerificationQuery;

type MeilingV1PhoneVerificationQuery = MeilingV1PhoneVerificationCodeQuery;

interface MeilingV1PhoneVerificationCodeQuery {
  type: 'phone';
  code: string;
}

type MeilingV1EmailVerificationQuery = MeilingV1EmailVerificationCodeQuery | MeilingV1EmailVerificationTokenQuery;

interface MeilingV1EmailVerificationCodeQuery {
  type: 'email';
  code: string;
}

interface MeilingV1EmailVerificationTokenQuery {
  type: 'email';
  token: string;
}

export async function meilingV1AuthorizationVerifyHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1VerificationQuery;

  if (!session.authorizationStatus) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED);
    return;
  }

  let verified = false;
  let createdAt = undefined;
  let expiresAt = undefined;

  if (body.type === 'phone') {
    if (!session.authorizationStatus.phone) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED);
      return;
    }

    if (body.code) {
      verified = session.authorizationStatus.phone.challenge.challenge === body.code;
      createdAt = session.authorizationStatus.phone.challenge.challengeCreatedAt;
    }
  } else if (body.type === 'email') {
    const code = (body as MeilingV1EmailVerificationCodeQuery).code;
    const token = (body as MeilingV1EmailVerificationTokenQuery).token;

    if (code) {
      if (!session.authorizationStatus.email) {
        sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED);
        return;
      }

      verified = session.authorizationStatus.email.challenge.challenge == code;
      createdAt = session.authorizationStatus.email.challenge.challengeCreatedAt;
    } else if (token) {
      const data = await getPrismaClient().meilingV1Verification.findUnique({
        where: {
          token,
        },
      });

      if (!data) {
        sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid token');
        return;
      }

      verified = true;
      createdAt = data.issuedAt;
      expiresAt = data.expiresAt;
    }
  } else {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  if (createdAt && !expiresAt) {
    createdAt = createdAt === undefined ? createdAt : new Date(createdAt);
    expiresAt = new Date(createdAt.getTime() + config.token.invalidate.meiling.CHALLENGE_TOKEN * 1000);
  } else if (!expiresAt) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  if (verified) {
    if (new Date().getTime() < expiresAt.getTime()) {
      let to = undefined;

      if (body.type === 'phone' && session.authorizationStatus.phone) {
        session.authorizationStatus.phone.isVerified = true;
        to = session.authorizationStatus.phone.to;
      } else if (body.type === 'email' && session.authorizationStatus.email) {
        session.authorizationStatus.email.isVerified = true;
        to = session.authorizationStatus.email.to;
      } else {
        sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNSUPPORTED_AUTHORIZATION_TYPE);
        return;
      }

      sendBaridegiLog(BaridegiLogType.VERIFY_AUTHORIZATION_REQUEST, {
        type: body.type,
        ip: req.ip,
        to,
      });
    } else {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_TIMEOUT);
      return;
    }
  } else {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.AUTHORIZATION_REQUEST_INVALID);
    return;
  }

  await setAuthorizationStatus(req, session.authorizationStatus);
  rep.send({
    success: true,
  });
}
