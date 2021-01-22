import { OAuthClient } from '@prisma/client';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { Client, ClientAccessControls, User } from '../../../common';
import { getLoggedInMeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

interface MeilingV1AppParams {
  clientId?: string;
}

export function registerV1MeilingAppEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, meilingV1AppHandler);
  app.get(baseURI + '/:clientId', meilingV1AppHandler);
}

export async function meilingV1AppHandler(req: FastifyRequest, rep: FastifyReply) {
  const params = req.params as MeilingV1AppParams;
  const clientId = params.clientId;

  const users = await getLoggedInMeilingV1Session(req);
  if (users.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

  if (clientId) {
    const client = await Client.getByClientId(clientId);
    const acl = await Client.getAccessControl(clientId);
    if (!client || !acl) {
      sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
      return;
    }

    let shouldShow = false;
    for (const user of users) {
      shouldShow = shouldShow || (await ClientAccessControls.checkUsers(acl, user.id));
    }

    if (!shouldShow) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    rep.send(Client.sanitize(client));
    return;
  } else {
    const clients = [];
    for (const user of users) {
      const userClient = await User.getDetailedInfo(user);

      if (userClient?.authorizedApps) {
        for (const myApp of userClient.authorizedApps) {
          if (clients.filter((client) => client.id === myApp.client.id).length === 0) {
            clients.push(Client.sanitize(myApp.client));
          }
        }
      }
    }

    rep.send(clients);
  }
}
