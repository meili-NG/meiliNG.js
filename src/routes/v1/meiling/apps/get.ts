import { FastifyReply, FastifyRequest } from 'fastify';
import { Client, ClientAccessControls } from '../../../../common';
import { MeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { MeilingV1AppParams } from './interface';

async function appInfoHandler(req: FastifyRequest, rep: FastifyReply) {
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
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
    return;
  }
}

export default appInfoHandler;
