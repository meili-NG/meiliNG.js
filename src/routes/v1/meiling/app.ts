import { OAuthClient } from '@prisma/client';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import {
  checkClientAccessControlledUsers,
  getClientAccessControls,
  getOAuth2AuthorizationInfo,
  getOAuth2ClientByClientId,
  sanitizeClient,
} from '../../../common/client';
import { getAllUserInfo } from '../../../common/user';
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
    const client = await getOAuth2ClientByClientId(clientId);
    const acl = await getClientAccessControls(clientId);
    if (!client || !acl) {
      sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
      return;
    }

    let shouldShow = false;
    for (const user of users) {
      shouldShow = shouldShow || (await checkClientAccessControlledUsers(acl, user.id));
    }

    if (!shouldShow) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    rep.send(sanitizeClient(client));
    return;
  } else {
    const clients = [];
    for (const user of users) {
      const userClient = await getAllUserInfo(user);

      if (userClient?.authorizedApps) {
        for (const myApp of userClient.authorizedApps) {
          if (clients.filter((client) => client.id === myApp.client.id).length === 0) {
            clients.push(sanitizeClient(myApp.client));
          }
        }
      }
    }

    rep.send(clients);
  }
}
