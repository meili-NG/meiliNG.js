import { AuthorizationMethod, User, Authorization } from '@prisma/client';
import { prisma } from '../../../..';
import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from '../interfaces/query';

export function getDatabaseEquivalentFromAuthenticationV1(
  method?: MeilingV1ExtendedAuthMethods,
): AuthorizationMethod | undefined {
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
    default:
      return undefined;
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

export async function getExtendedAuthenticationMethodsV1(
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
