import { OAuth2 } from '../..';

export interface MeilingV1UserActionsParams {
  userId: string;
}

export type MeilingV1UserOAuthAuthParams = MeilingV1UserActionsParams;

export interface MeilingV1UserOAuthAuthQuery {
  // oAuth parameters
  access_type?: OAuth2.Interfaces.OAuth2QueryAccessType;
  client_id: string;
  scope: string;
  response_type: OAuth2.Interfaces.OAuth2QueryResponseType;
  redirect_uri: string;
  include_granted_scopes?: OAuth2.Interfaces.OAuth2QueryBoolean;
  prompt?: OAuth2.Interfaces.OAuth2QueryPrompt;
  code_challenge?: string;
  code_challenge_method?: OAuth2.Interfaces.OAuth2QueryCodeChallengeMethod;
  state?: string;
  nonce?: string;
  display?: string;
}
