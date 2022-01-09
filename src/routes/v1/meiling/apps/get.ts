import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';
import { sendMeilingError } from '../../../../common/meiling/v1/error/error';
import { MeilingV1AppParams } from './interface';

async function appInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const params = req.params as MeilingV1AppParams;
  const clientId = params.clientId;

  if (clientId) {
    const client = await Meiling.OAuth2.Client.getByClientId(clientId);
    const acl = await Meiling.OAuth2.Client.getAccessControl(clientId);
    if (!client || !acl) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.APPLICATION_NOT_FOUND);
      return;
    }

    const users = await Meiling.V1.Session.getLoggedIn(req);
    if (users.length === 0) {
      // If no user access controls, returning client info.
      if (!acl.userAclId) rep.send(Meiling.OAuth2.Client.sanitize(client));
      // If not, returning unauthorized error.
      else sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    let shouldShow = false;
    for (const user of users) {
      shouldShow = shouldShow || (await Meiling.OAuth2.ClientAccessControls.checkUsers(acl, user.id));
    }

    if (!shouldShow) {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED);
      return;
    }

    rep.send(Meiling.OAuth2.Client.sanitize(client));
    return;
  } else {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }
}

export default appInfoHandler;
