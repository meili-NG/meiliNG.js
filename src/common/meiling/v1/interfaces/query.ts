import { TemplateLanguage } from '../../../../common/notification';

export enum SigninType {
  USERNAME_CHECK = 'username_check',
  USERNAME_AND_PASSWORD = 'username_and_password',
  TWO_FACTOR_AUTH = 'two_factor_authentication',
  PASSWORDLESS = 'passwordless',
}

export enum ExtendedAuthMethods {
  PGP_SIGNATURE = 'pgp_signature',
  OTP = 'otp',
  SMS = 'sms',
  EMAIL = 'email',
  WEBAUTHN = 'webauthn',
}

export type SigninBody = SigninUsernameCheck | SigninUsernameAndPassword | SigninExtendedAuthentication;

export interface SigninUsernameCheck {
  type: SigninType.USERNAME_CHECK;
  data: {
    username: string;
  };
}

export interface SigninUsernameAndPassword {
  type: SigninType.USERNAME_AND_PASSWORD;
  data: {
    username: string;
    password: string;
  };
}

export type SigninExtendedAuthentication = SigninTwoFactor | SigninPasswordLess;

export interface PasswordResetBody {
  method?: ExtendedAuthMethods;
  data?: SigninAuthenticationData;
  context?: {
    username?: string;
    lang?: TemplateLanguage;
  };
  password?: string;
}

export interface SigninTwoFactor {
  type: SigninType.TWO_FACTOR_AUTH;
  data?: SigninAuthenticationData;
}

interface SigninPasswordLess {
  type: SigninType.PASSWORDLESS;
  data?: SigninAuthenticationData;
  context?: {
    username?: string;
    phone?: string;
  };
}

interface SigninAuthenticationData {
  method?: ExtendedAuthMethods;
  challengeResponse?: any;
  challengeContext?: any;
}
