import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { meilingV1UserActionGetUser } from '..';
import { User, Utils } from '../../../../../../common';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

export async function meilingV1OAuthClientPasswordsPostHandler(req: FastifyRequest, rep: FastifyReply) {
  const user = await meilingV1UserActionGetUser(req);
  if (user === undefined) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  } else if (user === null) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
    return;
  }

  const body = req.body as PasswordBody;
  if (!Utils.isValidValue(body, body?.password)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid body.');
    return;
  }

  const password = body.password;
  if ((await User.checkPassword(user, password)).length > 0) {
    sendMeilingError(rep, MeilingV1ErrorType.EXISTING_PASSWORD, 'existing password.');
    return;
  }

  const addPasswordSuccess = await User.addPassword(user, password);

  rep.send({
    success: addPasswordSuccess,
  });
}
