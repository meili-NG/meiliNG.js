import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';

async function appAdminPutHandler(req: FastifyRequest, rep: FastifyReply) {
  const clientId = (req.params as { clientId: string }).clientId;

  if (clientId) {
    const client = await Meiling.OAuth2.Client.getByClientId(clientId);
    if (!client) return Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND);

    // TODO: Implement updates later.
    const data = req.body as any;

    if (data.metadata && typeof data.metadata === 'object') {
      await getPrismaClient().oAuthClient.update({
        where: {
          id: clientId,
        },
        data: {
          metadata: data.metadata,
        },
      });
    }

    rep.send({ success: true });
    return;
  } else {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }
}

export default appAdminPutHandler;
