import { MeilingV1ExtendedAuthMethods } from './query';

export interface MeilingV1Session {
  user?: {
    id: string;
  };
  extendedAuthentication?: {
    id: string;
    method: MeilingV1ExtendedAuthMethods;
    challenge: string;
  };
}
