import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from './query';

export interface MeilingV1Session {
  user?: MeilingLoggedInUser[];
  extendedAuthentication?: MeilingV1SessionExtendedAuthentication;
}

export interface MeilingLoggedInUser {
  id: string;
}

interface MeilingV1SignInTwoFactorAuth {
  id: string;
  type: MeilingV1SigninType.TWO_FACTOR_AUTH;
  method?: MeilingV1ExtendedAuthMethods;
  challenge?: string;
  challengeTimeout?: string;
}

interface MeilingV1SignInPasswordLess {
  type: MeilingV1SigninType.PASSWORDLESS;
  method?: MeilingV1ExtendedAuthMethods;
  challenge?: string;
  challengeTimeout?: string;
}

export type MeilingV1SessionExtendedAuthentication = MeilingV1SignInPasswordLess | MeilingV1SignInTwoFactorAuth;
