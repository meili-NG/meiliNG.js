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
  | OAuth2QueryTokenRefreshTokenParameters
  | OAuth2QueryTokenDeviceCodeParameters;
//  | OAuth2QueryTokenSAMLParameters;

export interface OAuth2QueryTokenBaseParameters extends OAuth2QueryAuthClientParameters {
  grant_type: OAuth2QueryGrantType;
}

export interface OAuth2QueryTokenAuthorizationCodeParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: OAuth2QueryGrantType.AUTHORIZATION_CODE;
  code: string;
  code_verifier?: string;
  redirect_uri: string;
}

export interface OAuth2QueryTokenRefreshTokenParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: OAuth2QueryGrantType.REFRESH_TOKEN;
  refresh_token: string;
}

export interface OAuth2QueryTokenDeviceCodeParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: OAuth2QueryGrantType.DEVICE_CODE;
  device_code: string;
}

/*
export interface OAuth2QueryTokenSAMLParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer';
  scope: string;
}
*/
