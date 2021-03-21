import { FastifyReply, FastifyRequest } from 'fastify';
import { Client, User } from '../../../../common';
import { MeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { MeilingV1AppParams } from './interface';

async function meilingV1AppListHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const params = req.params as MeilingV1AppParams;

  const users = await MeilingV1Session.getLoggedIn(req);
  if (users.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

  const clients = [];
  for (const user of users) {
    const userClient = await User.getDetailedInfo(user);

    if (userClient?.authorizedApps) {
      for (const myApp of userClient.authorizedApps) {
        if (clients.filter((client) => client.id === myApp.id).length === 0) {
          clients.push(Client.sanitize(myApp));
        }
      }
    }
  }

  rep.send(clients);
}

export default meilingV1AppListHandler;
