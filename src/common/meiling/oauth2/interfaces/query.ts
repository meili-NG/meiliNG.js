import { AccessType, GrantType, Prompt, ResponseType } from './type';

export type QueryBoolean = 'true' | 'false';

export interface QueryBaseParameters {
  client_id: string;
}

export interface QueryClientSecretParameters extends QueryAuthParameters {
  client_secret?: string;
}

export interface QueryAuthParameters extends QueryBaseParameters {
  redirect_uri: string;
  response_type: ResponseType;
  scope: string;
  access_type?: AccessType;
  state?: string;
  include_granted_scopes?: QueryBoolean;
  login_hint?: string;
  prompt?: Prompt;
}

export type QueryBodyParameters =
  | TokenViaAuthorizationCodeParameters
  | TokenViaRefreshTokenParameters
  | TokenViaDeviceCodeParameters;
//  | TokenViaSAMLParameters;

export interface QueryTokenBaseparameters extends QueryClientSecretParameters {
  grant_type: GrantType;
}

export interface TokenViaAuthorizationCodeParameters extends QueryTokenBaseparameters {
  grant_type: GrantType.AUTHORIZATION_CODE;
  code: string;
  code_verifier?: string;
  redirect_uri: string;
}

export interface TokenViaRefreshTokenParameters extends QueryTokenBaseparameters {
  grant_type: GrantType.REFRESH_TOKEN;
  refresh_token: string;
}

export interface TokenViaDeviceCodeParameters extends QueryTokenBaseparameters {
  grant_type: GrantType.DEVICE_CODE;
  device_code: string;
}

/*
export interface TokenViaSAMLParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer';
  scope: string;
}
*/
