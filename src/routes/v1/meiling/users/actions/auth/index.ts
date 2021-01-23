import { MeilingV1UserActionsParams } from '..';
import {
  OAuth2QueryAccessType,
  OAuth2QueryBoolean,
  OAuth2QueryPrompt,
  OAuth2QueryResponseType,
} from '../../../../oauth2/interfaces';

export type MeilingV1UserOAuthAuthParams = MeilingV1UserActionsParams;

export interface MeilingV1UserOAuthAuthQuery {
  // oAuth parameters
  access_type?: OAuth2QueryAccessType;
  client_id: string;
  scope: string;
  response_type: OAuth2QueryResponseType;
  redirect_uri: string;
  include_granted_scopes?: OAuth2QueryBoolean;
  prompt?: OAuth2QueryPrompt;
}

export * from './check';
