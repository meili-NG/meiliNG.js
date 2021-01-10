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

interface MeilingV1SignInUsernameAndPassword {
  type: MeilingV1SigninType.USERNAME_AND_PASSWORD;
  data: {
    username: string;
    password: string;
  };
}

interface MeilingV1SignInExtendedAuthentication {
  type: MeilingV1SigninType.TWO_FACTOR_AUTH | MeilingV1SigninType.PASSWORDLESS;
  data: MeilingV1SignInAuthenticateData;
}

type MeilingV1SignInAuthenticateData =
  | MeilingV1SignInAuthenticateDataSMS
  | MeilingV1SignInAuthenticateDataOTP
  | MeilingV1SignInAuthenticateDataEmail
  | MeilingV1SignInAuthenticateDataPGPSignature
  | MeilingV1SignInAuthenticateDataSecurityKey;

interface MeilingV1SignInExtendedMethodsPayload {
  method: MeilingV1ExtendedAuthMethods;
}

interface MeilingV1SignInAuthenticateDataSMS extends MeilingV1SignInExtendedMethodsPayload {
  method: MeilingV1ExtendedAuthMethods.SMS;
  code: string;
}

interface MeilingV1SignInAuthenticateDataOTP extends MeilingV1SignInExtendedMethodsPayload {
  method: MeilingV1ExtendedAuthMethods.OTP;
  code: string;
}

interface MeilingV1SignInAuthenticateDataEmail extends MeilingV1SignInExtendedMethodsPayload {
  method: MeilingV1ExtendedAuthMethods.EMAIL;
  code: string;
}

interface MeilingV1SignInAuthenticateDataPGPSignature extends MeilingV1SignInExtendedMethodsPayload {
  method: MeilingV1ExtendedAuthMethods.PGP_SIGNATURE;
  signedData: string;
}

interface MeilingV1SignInAuthenticateDataSecurityKey extends MeilingV1SignInExtendedMethodsPayload {
  method: MeilingV1ExtendedAuthMethods.SECURITY_KEY;
  payload: any;
}
