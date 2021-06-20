import { FastifyReply, FastifyRequest } from 'fastify';
import { Client } from '../../../../common';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

async function appAdminInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const clientId = (req.params as { clientId: string }).clientId;

  if (clientId) {
    const client = await Client.getByClientId(clientId);

    rep.send(client);
    return;
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
    return;
  }
}

export default appAdminInfoHandler;
