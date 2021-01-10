import { User, Authorization, AuthorizationMethod } from '@prisma/client';
import { prisma } from '../../../..';
import { generateToken } from '../../../../common';
import { AuthorizationJSONObject, AuthorizationOTPObject, AuthorizationPGPSSHKeyObject } from '../../../../common/user';
import { validateOTP, validatePGPSign } from '../../../../common/validate';
import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from '../interfaces/query';

export function getAuthenticationV1ToDatabaseEquivalent(method: MeilingV1ExtendedAuthMethods): AuthorizationMethod {
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

export function getDataBaseAuthenticationToAuthenticationV1(
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
  user: User | string,
  signinMethod?: MeilingV1SigninType,
): Promise<Authorization[]> {
  let uuid;
  if (typeof user === 'string') {
    uuid = user;
  } else {
    uuid = user.id;
  }

  let auths;

  if (signinMethod !== undefined) {
    auths = await prisma.authorization.findMany({
      where: {
        userId: uuid,
        allowSingleFactor: signinMethod === MeilingV1SigninType.PASSWORDLESS ? true : undefined,
        allowTwoFactor: signinMethod === MeilingV1SigninType.TWO_FACTOR_AUTH ? true : undefined,
      },
    });
  } else {
    auths = await prisma.authorization.findMany({
      where: {
        userId: uuid,
      },
    });
  }

  const authenticationMethods = [];
  for (const auth of auths) {
    authenticationMethods.push(auth);
  }

  return authenticationMethods;
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
      return null;
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
