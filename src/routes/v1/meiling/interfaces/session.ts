import { MeilingV1ExtendedAuthMethods, MeilingV1SigninType } from './query';

export interface MeilingV1Session {
  user?: {
    ids: string[];
  };
  extendedAuthentication?: {
    id?: string;
    type: MeilingV1SigninType;
    method: MeilingV1ExtendedAuthMethods;
    challenge: string;
  };
}
