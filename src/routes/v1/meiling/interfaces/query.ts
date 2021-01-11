export enum MeilingV1SigninType {
  USERNAME_AND_PASSWORD = 'username_and_password',
  TWO_FACTOR_AUTH = 'two_factor_authentication',
  PASSWORDLESS = 'passwordless',
}

export enum MeilingV1ExtendedAuthMethods {
  PGP_SIGNATURE = 'pgp_signature',
  OTP = 'otp',
  SMS = 'sms',
  EMAIL = 'email',
  SECURITY_KEY = 'security_key',
}

export type MeilingV1SignInBody = MeilingV1SignInUsernameAndPassword | MeilingV1SignInExtendedAuthentication;

export interface MeilingV1SignInUsernameAndPassword {
  type: MeilingV1SigninType.USERNAME_AND_PASSWORD;
  data: {
    username: string;
    password: string;
  };
}

type MeilingV1SignInExtendedAuthentication = MeilingV1SignInTwoFactor | MeilingV1SignInPasswordLess;

export interface MeilingV1SignInTwoFactor {
  type: MeilingV1SigninType.TWO_FACTOR_AUTH;
  data?: MeilingV1SignInAuthenticateData;
}

interface MeilingV1SignInPasswordLess {
  type: MeilingV1SigninType.PASSWORDLESS;
  data?: MeilingV1SignInAuthenticateData;
  context?: {
    username?: string;
  };
}

interface MeilingV1SignInAuthenticateData {
  method?: MeilingV1ExtendedAuthMethods;
  challengeResponse?: string;
}
