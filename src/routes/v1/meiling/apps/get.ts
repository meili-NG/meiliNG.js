import { FastifyReply, FastifyRequest } from 'fastify';
import { Client, ClientAccessControls, User } from '../../../../common';
import { MeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { MeilingV1AppParams } from './interface';

export async function meilingV1AppHandler(req: FastifyRequest, rep: FastifyReply) {
  const params = req.params as MeilingV1AppParams;
  const clientId = params.clientId;

  const users = await MeilingV1Session.getLoggedIn(req);
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
