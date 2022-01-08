import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

export async function userPasswordCreateHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;

  const body = req.body as PasswordBody;
  if (!Utils.isValidValue(body, body?.password)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid body.');
    return;
  }

  const password = body.password;
  if ((await Meiling.Identity.User.checkPassword(user, password)).length > 0) {
    sendMeilingError(rep, MeilingV1ErrorType.EXISTING_PASSWORD, 'existing password.');
    return;
  }

  const addPasswordSuccess = await Meiling.Identity.User.addPassword(user, password);

  rep.send({
    success: addPasswordSuccess,
  });
}
