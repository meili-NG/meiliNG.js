import { AuthorizationMethod, OAuthTokenType } from '@prisma/client';
import { OAuth2 } from '..';
import { ExtendedAuthMethods } from './interfaces';

export function convertAuthentication(method?: ExtendedAuthMethods): AuthorizationMethod | undefined {
  switch (method) {
    case ExtendedAuthMethods.SMS:
      return 'SMS';
    case ExtendedAuthMethods.SECURITY_KEY:
      return 'SECURITY_KEY';
    case ExtendedAuthMethods.PGP_SIGNATURE:
      return 'PGP_KEY';
    case ExtendedAuthMethods.OTP:
      return 'OTP';
    case ExtendedAuthMethods.EMAIL:
      return 'EMAIL';
    default:
      return undefined;
  }
}

export function convertAuthenticationMethod(method: AuthorizationMethod): ExtendedAuthMethods | null {
  switch (method) {
    case 'EMAIL':
      return ExtendedAuthMethods.EMAIL;
    case 'OTP':
      return ExtendedAuthMethods.OTP;
    case 'PGP_KEY':
      return ExtendedAuthMethods.PGP_SIGNATURE;
    case 'SECURITY_KEY':
      return ExtendedAuthMethods.SECURITY_KEY;
    case 'SMS':
      return ExtendedAuthMethods.SMS;
    default:
      return null;
  }
}

export function convertTokenType(type?: OAuth2.Interfaces.GrantType): OAuthTokenType | undefined {
  switch (type?.toLowerCase()) {
    case OAuth2.Interfaces.GrantType.ACCESS_TOKEN:
      return 'ACCESS_TOKEN';
    case OAuth2.Interfaces.GrantType.REFRESH_TOKEN:
      return 'REFRESH_TOKEN';
    case OAuth2.Interfaces.GrantType.AUTHORIZATION_CODE:
      return 'AUTHORIZATION_CODE';
    default:
      return undefined;
  }
}
