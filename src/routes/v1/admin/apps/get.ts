import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';
import { sendMeilingError } from '../../../../common/meiling/v1/error/error';

async function appAdminInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const clientId = (req.params as { clientId: string }).clientId;

  if (clientId) {
    const client = await Meiling.OAuth2.Client.getByClientId(clientId);

    rep.send(client);
    return;
  } else {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }
}

export default appAdminInfoHandler;
