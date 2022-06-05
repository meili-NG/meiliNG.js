import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import SpeakEasy from 'speakeasy';
import config from '../../../../../../../../resources/config';
import { getSessionFromRequest } from '../../../../../../../../common/meiling/v1/session';
import { AuthenticationMethod } from '@prisma/client';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.OTP);

async function userOTPActionPostKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const body = req.body as { challengeResponse?: string; name: string } | undefined;

  const isRegistering = Utils.isNotBlank(body?.challengeResponse);

  const session = await getSessionFromRequest(req);
  const otpState = session?.registering?.otp;

  let secret = undefined;
  let requireIssue = false;
  if (otpState === undefined) {
    requireIssue = true;
  } else {
    // TODO: change this hardcoded value
    if (otpState.issuedAt + 1000 * 60 * 5 < new Date().getTime()) {
      requireIssue = true;
    } else {
      secret = otpState.secret;
    }
  }

  if (isRegistering) {
    if (!otpState || !secret) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED);
    } else if (requireIssue) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_TIMEOUT);
    }

    if (!Utils.isNotBlank(body?.name)) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'missing name');
    }

    const isValid = SpeakEasy.totp.verifyDelta({
      encoding: 'base32',
      token: body?.challengeResponse as string,
      secret,
      window: 2,
    });

    if (!isValid) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID);
    }

    const name = body?.name;
    const otpData = await getPrismaClient().authentication.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        data: {
          name,
          secret,
        },
        method: dbType as AuthenticationMethod,
        allowTwoFactor: true,
      },
    });

    rep.send({
      id: otpData.id,
      createdAt: otpData.createdAt,
      name: (otpData.data as any).data.name,

      allowSingleFactor: otpData.allowSingleFactor,
      allowTwoFactor: otpData.allowTwoFactor,
      allowPasswordReset: otpData.allowPasswordReset,
    });
  } else {
    const secret = SpeakEasy.generateSecret();
    const secretSafe = secret.base32;

    await Meiling.V1.Session.setSession(req, {
      ...session,
      registering: {
        ...session?.registering,
        otp: {
          secret: secretSafe,
          issuedAt: new Date().getTime(),
        },
      },
    });

    rep.send({
      otpauth: secret.otpauth_url,
    });
  }
}

export default userOTPActionPostKey;
