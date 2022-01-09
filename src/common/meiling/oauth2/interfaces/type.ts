export enum ResponseType {
  CODE = 'code',
  TOKEN = 'token',
}
export type AccessType = 'online' | 'offline';
export enum GrantType {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  AUTHORIZATION_CODE = 'authorization_code',
  DEVICE_CODE = 'urn:ietf:params:oauth:grant-type:device_code',
  // SAML_BEARER = 'urn:ietf:params:oauth:grant-type:saml2-bearer',
}

export type Prompt = 'none' | 'consent' | 'select_account';

export type CodeChallengeMethod = 'S256' | 'plain';
