import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';

async function appAdminInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const clientId = (req.params as { clientId: string }).clientId;

  if (clientId) {
    const client = await Meiling.OAuth2.Client.getByClientId(clientId);

    rep.send(client);
    return;
  } else {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }
}

export default appAdminInfoHandler;
