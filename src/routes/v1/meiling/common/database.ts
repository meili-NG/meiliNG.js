import { AuthorizationMethod, OAuthTokenType } from '@prisma/client';
import { OAuth2QueryGrantType } from '../../oauth2/interfaces';
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

export function convertTokenType(type?: OAuth2QueryGrantType): OAuthTokenType | undefined {
  switch (type?.toLowerCase()) {
    case OAuth2QueryGrantType.ACCESS_TOKEN:
      return 'ACCESS_TOKEN';
    case OAuth2QueryGrantType.REFRESH_TOKEN:
      return 'REFRESH_TOKEN';
    case OAuth2QueryGrantType.AUTHORIZATION_CODE:
      return 'AUTHORIZATION_CODE';
    default:
      return undefined;
  }
}
