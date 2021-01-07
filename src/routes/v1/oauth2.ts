import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

type OAuth2QueryResponseType = 'code';
type OAuth2QueryAccessType = 'online' | 'offline';
type OAuth2QueryGrantType =
  | 'access_token'
  | 'refresh_token'
  | 'authorization_code'
  | 'password'
  | 'client_credentials'
  | 'urn:ietf:params:oauth:grant-type:saml2-bearer';

type OAuth2QueryBoolean = 'true' | 'false';
type OAuth2QueryPrompt = 'none' | 'consent' | 'select_account';

interface OAuth2QueryBaseParameters {
  client_id: string;
}

interface OAuth2QueryAuthClientParameters extends OAuth2QueryAuthParameters {
  client_secret: string;
}

interface OAuth2QueryAuthParameters extends OAuth2QueryBaseParameters {
  redirect_uri: string;
  response_type: OAuth2QueryResponseType;
  scope: string;
  access_type?: OAuth2QueryAccessType;
  state?: string;
  include_granted_scopes?: OAuth2QueryBoolean;
  login_hint?: string;
  prompt?: OAuth2QueryPrompt;
}

type OAuth2QueryTokenParameters =
  | OAuth2QueryTokenAuthorizationCodeParameters
  | OAuth2QueryTokenRefreshTokenParameters
  | OAuth2QueryTokenPasswordParameters
  | OAuth2QueryTokenClientCredentialsParameters
  | OAuth2QueryTokenSAMLParameters;

type OAuth2ErrorResponseError =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope';

interface OAuth2ErrorResponse {
  error: OAuth2ErrorResponseError;
  error_description?: string;
  error_uri?: string;
}

interface OAuth2QueryTokenBaseParameters extends OAuth2QueryAuthClientParameters {
  grant_type: OAuth2QueryGrantType;
}

interface OAuth2QueryTokenAuthorizationCodeParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
}

interface OAuth2QueryTokenRefreshTokenParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'refresh_token';
  refresh_token: string;
}

interface OAuth2QueryTokenPasswordParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'password';
  username: string;
  password: string;
  scope: string;
}

interface OAuth2QueryTokenClientCredentialsParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'client_credentials';
  scope: string;
}

interface OAuth2QueryTokenSAMLParameters extends OAuth2QueryTokenBaseParameters {
  grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer';
  scope: string;
}

export function registerV1OAuth2Endpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/auth', oAuth2AuthHandler);
  app.get(baseURI + '/token', oAuth2TokenHandler);
}

function oAuth2AuthHandler(req: FastifyRequest, rep: FastifyReply) {
  const query = req.query as OAuth2QueryAuthParameters;

  const clientId = query?.client_id;
  const redirectUri = query?.redirect_uri;
  const responseType = query?.response_type;
  const scope = query?.scope;

  if (!(clientId && redirectUri && responseType && scope)) {
    rep.code(400).send('');
    return;
  }

  // 뭐 알아서 리다이렉트 하세요.
}

function oAuth2TokenHandler(req: FastifyRequest, rep: FastifyReply) {
  const query = req.query as OAuth2QueryTokenBaseParameters;
}
