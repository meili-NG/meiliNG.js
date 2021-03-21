import { FastifyReply, FastifyRequest } from 'fastify';
import { meilingV1UserActionGetUser } from '..';
import { Client, ClientAccessControls, User } from '../../../../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';
import { MeilingV1AppParams } from './interface';

async function meilingV1UserAppInfoHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const params = req.params as MeilingV1AppParams;
  const clientId = params.clientId;

  const user = (await meilingV1UserActionGetUser(req)) as User.UserInfoObject;

  if (clientId) {
    const client = await Client.getByClientId(clientId);
    const acl = await Client.getAccessControl(clientId);
    if (!client || !acl) {
      sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
      return;
    }

    const shouldShow = await ClientAccessControls.checkUsers(acl, user.id);

    if (!shouldShow) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      return;
    }

    rep.send(Client.sanitize(client));
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST);
  }
}

export default meilingV1UserAppInfoHandler;
