import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '.';
import { getUserFromActionRequest } from '..';
import { Meiling } from '../../../../../../common';
import { getPrismaClient } from '../../../../../../resources/prisma';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

async function appGetHandler(req_: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = req_ as MeilingV1ClientRequest;
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;

  let response: any = {
    status: req.status,
  };

  if (!req.status.authorized && !req.status.owned) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
  }

  if (req.status.authorized) {
    const firstAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
      where: {
        client: {
          id: req.client.id,
        },
        user: {
          id: user.id,
        },
      },
      orderBy: {
        authorizedAt: 'asc',
      },
    });

    const lastAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
      where: {
        client: {
          id: req.client.id,
        },
        user: {
          id: user.id,
        },
      },
      orderBy: {
        authorizedAt: 'desc',
      },
    });

    response = {
      ...response,
      ...Meiling.OAuth2.Client.sanitize(req.client),
      authorizedAt: firstAuthorization?.authorizedAt,
      lastAuthAt: lastAuthorization?.authorizedAt,
      permissions: (await Meiling.Identity.User.getClientAuthorizedPermissions(user, req.client.id)).map((n) => n.name),
    };
  }

  if (req.status.owned) {
    response = {
      ...response,
      ...(await Meiling.OAuth2.Client.getInfoForOwners(req.client)),
    };
  }

  rep.send(response);
}

export default appGetHandler;
