import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from './query';

export interface MeilingV1Session {
  user?: MeilingLoggedInUser[];
  extendedAuthentication?: MeilingV1SessionExtendedAuthentication;
}

export interface MeilingLoggedInUser {
  id: string;
}

export interface MeilingV1SessionExtendedAuthentication {
  id?: string;
  type: MeilingV1SigninType;
  method: MeilingV1ExtendedAuthMethods;
  challenge: string;
}
