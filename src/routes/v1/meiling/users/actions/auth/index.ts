import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1UserActionsParams } from '..';
import {
  OAuth2QueryAccessType,
  OAuth2QueryBoolean,
  OAuth2QueryCodeChallengeMethod,
  OAuth2QueryPrompt,
  OAuth2QueryResponseType,
} from '../../../../oauth2/interfaces';
import { meilingV1OAuthClientAuthHandler } from './auth';
import { meilingV1OAuthClientAuthCheckHandler } from './check';
import { deviceCodeAuthPlugin } from './device';

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
  code_challenge?: string;
  code_challenge_method?: OAuth2QueryCodeChallengeMethod;
  state?: string;
  nonce?: string;
  display?: string;
}

export function clientAuthPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', meilingV1OAuthClientAuthCheckHandler);
  app.post('/', meilingV1OAuthClientAuthHandler);

  app.register(deviceCodeAuthPlugin);

  done();
}

export * from './check';
