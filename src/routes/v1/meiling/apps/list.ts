import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';
import { sendMeilingError } from '../../../../common/meiling/v1/error/error';
import { MeilingV1AppParams } from './interface';

async function appListHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const params = req.params as MeilingV1AppParams;

  const users = await Meiling.V1.Session.getLoggedIn(req);
  if (users.length === 0) {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const clients = [];
  for (const user of users) {
    const userClient = await Meiling.Identity.User.getDetailedInfo(user);

    if (userClient?.authorizedApps) {
      for (const myApp of userClient.authorizedApps) {
        if (clients.filter((client) => client.id === myApp.id).length === 0) {
          clients.push(Meiling.OAuth2.Client.sanitize(myApp));
        }
      }
    }
  }

  rep.send(clients);
}

export default appListHandler;
