import { FastifyRequest, FastifyReply } from 'fastify';
import { isMeilingV1UserActionPermitted, MeilingV1UserActionsParams } from '.';
import { getOAuth2ClientByClientId, isClientAccessible } from '../../../../../common/client';
import { sendMeilingError } from '../../error';
import { MeilingV1ErrorType } from '../../interfaces';

type MeilingV1UserOAuthAuthParams = MeilingV1UserActionsParams;

interface MeilingV1UserOAuthAuthQuery {
  clientId: string;
}

export async function meilingV1OAuthApplicationAuthHandler(req: FastifyRequest, rep: FastifyReply) {
  const params = req.params as MeilingV1UserOAuthAuthParams;
  const query = req.query as MeilingV1UserOAuthAuthQuery;

  const userData = await isMeilingV1UserActionPermitted(req);
  if (userData === undefined) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  } else if (userData === null) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
    return;
  }

  if (!query.clientId) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.APPLICATION_NOT_FOUND,
      'oAuth2 application with specified client_id does not exist',
    );
    return;
  }

  const client = await getOAuth2ClientByClientId(query.clientId);
  if (client === null) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.APPLICATION_NOT_FOUND,
      'oAuth2 application with specified client_id does not exist',
    );
    return;
  }

  const permissionCheck = await isClientAccessible(query.clientId, userData);
  if (!permissionCheck) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.UNAUTHORIZED,
      'oAuth2 application with specified client_id does not exist',
    );
    return;
  }

  sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
}
