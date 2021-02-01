import {
  OAuth2QueryAccessType,
  OAuth2QueryBoolean,
  OAuth2QueryGrantType,
  OAuth2QueryPrompt,
  OAuth2QueryResponseType,
} from './type';

export interface OAuth2QueryBaseParameters {
  client_id: string;
}

export interface OAuth2QueryAuthClientParameters extends OAuth2QueryAuthParameters {
  client_secret?: string;
}

export interface OAuth2QueryAuthParameters extends OAuth2QueryBaseParameters {
  redirect_uri: string;
  response_type: OAuth2QueryResponseType;
  scope: string;
  access_type?: OAuth2QueryAccessType;
  state?: string;
  include_granted_scopes?: OAuth2QueryBoolean;
  login_hint?: string;
  prompt?: OAuth2QueryPrompt;
}

export type OAuth2QueryBodyParameters =
  | OAuth2QueryTokenAuthorizationCodeParameters
  | OAuth2QueryTokenRefreshTokenParameters;
//  | OAuth2QueryTokenSAMLParameters;

export enum OAuth2ErrorResponseType {
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_SCOPE = 'invalid_scope',
}

export interface OAuth2ErrorResponse {
  error: OAuth2ErrorResponseType;
  error_description?: string;
  error_uri?: string;
}

export interface OAuth2QueryTokenBaseParameters extends OAuth2QueryAuthClientParameters {
  grant_type: OAuth2QueryGrantType;
}

export interface OAuth2QueryTokenAuthorizationCodeParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: OAuth2QueryGrantType.AUTHORIZATION_CODE;
  code: string;
  redirect_uri: string;
}

export interface OAuth2QueryTokenRefreshTokenParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: OAuth2QueryGrantType.REFRESH_TOKEN;
  refresh_token: string;
}

/*
export interface OAuth2QueryTokenSAMLParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer';
  scope: string;
}
*/
