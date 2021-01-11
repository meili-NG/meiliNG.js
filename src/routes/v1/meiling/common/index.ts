import { User, Authorization, AuthorizationMethod } from '@prisma/client';
import { prisma } from '../../../..';
import { generateToken } from '../../../../common';
import { AuthorizationJSONObject, AuthorizationOTPObject, AuthorizationPGPSSHKeyObject } from '../../../../common/user';
import { validateOTP, validatePGPSign } from '../../../../common/validate';
import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from '../interfaces/query';

export function getDatabaseEquivalentFromAuthenticationV1(method: MeilingV1ExtendedAuthMethods): AuthorizationMethod {
  switch (method) {
    case MeilingV1ExtendedAuthMethods.SMS:
      return 'SMS';
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      return 'SECURITY_KEY';
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
      return 'PGP_KEY';
    case MeilingV1ExtendedAuthMethods.OTP:
      return 'OTP';
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return 'EMAIL';
  }
}

export function getAuthenticationV1FromDatabaseEquivalent(
  method: AuthorizationMethod,
): MeilingV1ExtendedAuthMethods | null {
  switch (method) {
    case 'EMAIL':
      return MeilingV1ExtendedAuthMethods.EMAIL;
    case 'OTP':
      return MeilingV1ExtendedAuthMethods.OTP;
    case 'PGP_KEY':
      return MeilingV1ExtendedAuthMethods.PGP_SIGNATURE;
    case 'SECURITY_KEY':
      return MeilingV1ExtendedAuthMethods.SECURITY_KEY;
    case 'SMS':
      return MeilingV1ExtendedAuthMethods.SMS;
    default:
      return null;
  }
}

export async function getAuthenticationMethodsV1(
  user?: User | string,
  signinType?: MeilingV1SigninType,
  signinMethod?: MeilingV1ExtendedAuthMethods,
): Promise<Authorization[]> {
  let uuid;
  if (user !== undefined) {
    if (typeof user === 'string') {
      uuid = user;
    } else {
      uuid = user.id;
    }
  } else {
    uuid = undefined;
  }

  let auths;

  if (signinType !== undefined) {
    auths = await prisma.authorization.findMany({
      where: {
        userId: uuid,
        allowSingleFactor: signinType === MeilingV1SigninType.PASSWORDLESS ? true : undefined,
        allowTwoFactor: signinType === MeilingV1SigninType.TWO_FACTOR_AUTH ? true : undefined,
        method: signinMethod !== undefined ? getDatabaseEquivalentFromAuthenticationV1(signinMethod) : undefined,
      },
    });
  } else {
    auths = await prisma.authorization.findMany({
      where: {
        userId: uuid,
        method: signinMethod !== undefined ? getDatabaseEquivalentFromAuthenticationV1(signinMethod) : undefined,
      },
    });
  }

  return auths;
}

export function generateChallengeV1(signinMethod: MeilingV1ExtendedAuthMethods) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      return generateToken();
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return generateToken(6, '0123456789');
    case MeilingV1ExtendedAuthMethods.OTP:
    default:
      return undefined;
  }
}

export async function verifyChallengeV1(
  signinMethod: MeilingV1ExtendedAuthMethods,
  challenge: string,
  challengeResponse: any,
  data?: AuthorizationJSONObject,
) {
  switch (signinMethod) {
    case MeilingV1ExtendedAuthMethods.PGP_SIGNATURE:
      return validatePGPSign(challenge, challengeResponse, (data as AuthorizationPGPSSHKeyObject).data.key);
    case MeilingV1ExtendedAuthMethods.SECURITY_KEY:
      break;
    case MeilingV1ExtendedAuthMethods.SMS:
    case MeilingV1ExtendedAuthMethods.EMAIL:
      return challenge.trim() === challengeResponse.trim();
    case MeilingV1ExtendedAuthMethods.OTP:
      return validateOTP(challengeResponse, (data as AuthorizationOTPObject).data.secret);
  }
}
