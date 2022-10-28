import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';

async function permissionAdminInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const name = (req.params as { name: string }).name;

  if (name) {
    const perm = await getPrismaClient().permission.findUnique({
      where: {
        name,
      },
    });

    if (perm) {
      rep.send(perm);
    } else {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
    }
    return;
  } else {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }
}

export default permissionAdminInfoHandler;
