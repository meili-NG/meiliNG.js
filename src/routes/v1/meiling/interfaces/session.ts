import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from './query';

export interface MeilingV1Session {
  user?: MeilingLoggedInUser[];
  extendedAuthentication?: MeilingV1SessionExtendedAuthentication;
  previouslyLoggedIn?: MeilingLoggedInUser[];
  authorizationStatus?: MeilingV1SessionAuthorizationStatus;
  passwordReset?: MeilingV1PasswordResetSession;
}

export interface MeilingLoggedInUser {
  id: string;
}

export interface MeilingV1PasswordResetSession extends MeilingV1ChallengeData {
  method?: MeilingV1ExtendedAuthMethods;
}

interface MeilingV1SignInTwoFactorAuth extends MeilingV1ChallengeData {
  id: string;
  type: MeilingV1SigninType.TWO_FACTOR_AUTH;
  method?: MeilingV1ExtendedAuthMethods;
}

interface MeilingV1SignInPasswordLess extends MeilingV1ChallengeData {
  type: MeilingV1SigninType.PASSWORDLESS;
  method?: MeilingV1ExtendedAuthMethods;
}

interface MeilingV1ChallengeData {
  challenge?: string;
  challengeCreatedAt?: Date;
}

interface MeilingV1ChallengeStatusInfo<T> {
  to: T;
  challenge: MeilingV1ChallengeData;
  isVerified: boolean;
}

export interface MeilingV1SessionAuthorizationStatus {
  email?: MeilingV1ChallengeStatusInfo<string>;
  phone?: MeilingV1ChallengeStatusInfo<string>;
}

export type MeilingV1SessionExtendedAuthentication = MeilingV1SignInPasswordLess | MeilingV1SignInTwoFactorAuth;
