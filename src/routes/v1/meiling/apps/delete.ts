import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../..';
import { Client } from '../../../../common';
import { MeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { MeilingV1AppParams } from './interface';

async function meilingV1AppDeleteHandler(req: FastifyRequest, rep: FastifyReply) {
  const params = req.params as MeilingV1AppParams;
  const clientId = params.clientId;

  const users = await MeilingV1Session.getLoggedIn(req);
  if (users.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

  if (!clientId) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'missing client_id');
    return;
  }

  const client = await Client.getByClientId(clientId);
  const acl = await Client.getAccessControl(clientId);
  if (!client || !acl) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
    return;
  }

  const owners = await Client.getClientOwners(clientId);
  if (owners.filter((n) => users.filter((o) => o.id === n.id)).length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
    return;
  }

  await prisma.oAuthClient.delete({
    where: {
      id: clientId,
    },
  });

  rep.send({
    success: true,
  });
  return;
}

export default meilingV1AppDeleteHandler;
