import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { findMatchingUsersByUsernameOrEmail } from '../../../common/user';
import { getMeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';
import { meilingV1SigninHandler } from './signin';
import { meilingV1SignoutHandler } from './signout';
import { meilingV1SignupHandler } from './signup';
import { meilingV1UserInfoHandler } from './user';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/user', meilingV1UserInfoHandler);
  app.get(baseURI + '/user/exist', meilingV1UserExistHandler);

  app.post(baseURI + '/signin', meilingV1SigninHandler);
  app.post(baseURI + '/signup', meilingV1SignupHandler);
  app.get(baseURI + '/signout', meilingV1SignoutHandler);
  app.get(baseURI + '/session', (req, rep) => {
    if ((req.query as any)?.token === 'HongMeiling') {
      rep.send(getMeilingV1Session(req));
    } else {
      rep.redirect('https://www.youtube.com/watch?v=2B-2lv2ZGBE');
    }
  });

  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Engine',
      api: 'Meiling Endpoints',
    });
  });
}

async function meilingV1UserExistHandler(req: FastifyRequest, rep: FastifyReply) {
  if ((req.query as any)?.username) {
    const username = (req.query as any)?.username;
    const users = await findMatchingUsersByUsernameOrEmail(username);

    rep.send({
      exist: users.length > 0,
    });
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'username is missing.');
    return;
  }
}
