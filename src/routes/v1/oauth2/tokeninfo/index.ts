import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

// TODO: https://developers.google.com/identity/protocols/oauth2/limited-input-device#step-4:-poll-googles-authorization-server
// TODO: https://developers.google.com/identity/protocols/oauth2/native-app#exchange-authorization-code

export async function oAuth2TokenInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const body = req.body;

  sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);

  return;
}
