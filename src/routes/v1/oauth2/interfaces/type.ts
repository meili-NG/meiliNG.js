export enum OAuth2QueryResponseType {
  CODE = 'code',
  TOKEN = 'token',
}
export type OAuth2QueryAccessType = 'online' | 'offline';
export enum OAuth2QueryGrantType {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  AUTHORIZATION_CODE = 'authorization_code',
  // SAML_BEARER = 'urn:ietf:params:oauth:grant-type:saml2-bearer',
}

export type OAuth2QueryBoolean = 'true' | 'false';
export type OAuth2QueryPrompt = 'none' | 'consent' | 'select_account';

export type OAuth2QueryCodeChallengeMethod = 'S256' | 'plain';
