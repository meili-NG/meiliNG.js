import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '..';
import { prisma } from '../../../..';
import config from '../../../../config';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';

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

export async function meilingV1VerificationHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1VerificationQuery;

  if (!session.verificationStatus) {
    sendMeilingError(rep, MeilingV1ErrorType.VERIFICATION_REQUEST_NOT_GENERATED);
    return;
  }

  let verified = false;
  let createdAt = undefined;
  let expiresAt = undefined;

  if (body.type === 'phone') {
    if (!session.verificationStatus.phone) {
      sendMeilingError(rep, MeilingV1ErrorType.VERIFICATION_REQUEST_NOT_GENERATED);
      return;
    }

    if (body.code) {
      verified = session.verificationStatus.phone.challenge.challenge === body.code;
      createdAt = session.verificationStatus.phone.challenge.challengeCreatedAt;
    }
  } else if (body.type === 'email') {
    const code = (body as MeilingV1EmailVerificationCodeQuery).code;
    const token = (body as MeilingV1EmailVerificationTokenQuery).token;

    if (code) {
      if (!session.verificationStatus.email) {
        sendMeilingError(rep, MeilingV1ErrorType.VERIFICATION_REQUEST_NOT_GENERATED);
        return;
      }

      verified = session.verificationStatus.email.challenge.challenge == code;
      createdAt = session.verificationStatus.email.challenge.challengeCreatedAt;
    } else if (token) {
      const data = await prisma.meilingV1Verification.findUnique({
        where: {
          token,
        },
      });

      if (!data) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid token');
        return;
      }

      verified = true;
      createdAt = data.issuedAt;
      expiresAt = data.expiresAt;
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
    return;
  }

  if (createdAt && !expiresAt) {
    expiresAt = new Date(createdAt.getTime() + config.token.invalidate.meiling.CHALLENGE_TOKEN * 1000);
  } else if (!expiresAt) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
    return;
  }

  if (verified && new Date().getTime() < expiresAt.getTime()) {
    if (body.type === 'phone' && session.verificationStatus.phone) {
      session.verificationStatus.phone.isVerified = true;
    } else if (body.type === 'email' && session.verificationStatus.email) {
      session.verificationStatus.email.isVerified = true;
    }
  }

  sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
}
