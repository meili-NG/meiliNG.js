import { OAuthClient } from '@prisma/client';
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { meilingV1UserActionGetUser } from '..';
import { Client, User } from '../../../../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';
import { meilingV1UserAppsAuthorizedActionsCombinedPlugin } from './actions';
import meilingV1UserAppDeleteHandler from './delete';
import meilingV1UserAppInfoHandler from './get';
import meilingV1UserAppListHandler from './list';

export function meilingV1UserAppsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', meilingV1UserAppListHandler);

  app.register(meilingV1UserAppsAuthorizedActionsPlugin, { prefix: '/:clientId' });

  done();
}

interface MeilingV1ClientIDParams {
  clientId: string;
}

export interface MeilingV1ClientRequest extends FastifyRequest {
  client: OAuthClient;
  status: {
    authorized: boolean;
    owned: boolean;
  };
}

export function meilingV1UserAppsAuthorizedActionsPlugin(
  app: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
): void {
  app.addHook('onRequest', async (req, rep) => {
    const user = (await meilingV1UserActionGetUser(req)) as User.UserInfoObject;
    const clientId = (req.params as MeilingV1ClientIDParams).clientId;

    const userDetail = (await User.getDetailedInfo(user)) as User.UserDetailedObject;

    const owned = userDetail.createdApps.filter((n) => n.id === clientId).length > 0;
    const authorized = userDetail.authorizedApps.filter((n) => n.id === clientId).length > 0;

    if (!owned && !authorized) {
      sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
      throw new Error('You do not own/authorized this');
    }

    const client = (await Client.getByClientId(clientId)) as OAuthClient;

    (req as MeilingV1ClientRequest).status = {
      owned,
      authorized,
    };

    (req as MeilingV1ClientRequest).client = client;
  });

  app.get('/', meilingV1UserAppInfoHandler);
  app.delete('/', meilingV1UserAppDeleteHandler);
  app.register(meilingV1UserAppsAuthorizedActionsCombinedPlugin);

  done();
}
