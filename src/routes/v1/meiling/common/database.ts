import { AuthorizationMethod } from '@prisma/client';
import { MeilingV1ExtendedAuthMethods } from '../interfaces/query';

export function convertAuthentication(method?: MeilingV1ExtendedAuthMethods): AuthorizationMethod | undefined {
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

export function convertAuthenticationMethod(method: AuthorizationMethod): MeilingV1ExtendedAuthMethods | null {
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
