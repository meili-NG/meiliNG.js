import { FastifyReply, FastifyRequest } from 'fastify';
import { PasswordBody } from '.';
import { getUserFromActionRequest } from '../..';
import { Meiling, Utils } from '../../../../../../../common';

export async function userPasswordCreateHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;

  const body = req.body as PasswordBody;
  if (!Utils.isValidValue(body, body?.password)) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid body.');
    return;
  }

  const password = body.password;
  if ((await Meiling.Identity.User.checkPassword(user, password)).length > 0) {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.EXISTING_PASSWORD, 'existing password.');
    return;
  }

  const addPasswordSuccess = await Meiling.Identity.User.addPassword(user, password);

  rep.send({
    success: addPasswordSuccess,
  });
}
