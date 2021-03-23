import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '.';
import { meilingV1UserActionGetUser } from '..';
import { Client, ClientAccessControls, User } from '../../../../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';
import { MeilingV1AppParams } from './interface';

async function meilingV1UserAppInfoHandler(req_: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = req_ as MeilingV1ClientRequest;

  let response = {
    status: req.status,
  };

  if (!req.status.authorized && !req.status.owned) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND);
  }

  if (req.status.authorized) {
    response = {
      ...response,
      ...Client.sanitize(req.client),
    };
  }

  if (req.status.owned) {
    response = {
      ...response,
      ...(await Client.getInfoForOwners(req.client)),
    };
  }

  rep.send(response);
}

export default meilingV1UserAppInfoHandler;
