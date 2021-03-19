import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { isDevelopment } from '../../..';
import config from '../../../config';
import { MeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

export function v1MeilingSessionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', async (req, rep) => {
    if ((req.query as any)?.token && (req.query as any)?.token !== '') {
      const authToken = (req.query as any)?.token;

      if (config.session.v1.debugTokens.includes(authToken)) {
        if (isDevelopment) {
          rep.send(await MeilingV1Session.getSessionFromRequest(req));
        } else {
          sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: not in development mode.');
        }
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: invalid token.');
      }
      return;
    }

    let token = MeilingV1Session.getTokenFromRequest(req);

    if (token) {
      if (await MeilingV1Session.isToken(token)) {
        rep.send({
          success: true,
        });
        return;
      } else {
        rep.send({
          success: false,
        });
        return;
      }
    } else {
      token = await MeilingV1Session.createToken(req);
      if (token) {
        rep.send({
          success: true,
          token,
        });
      } else {
        rep.send({
          success: false,
        });
      }
      return;
    }
  });

  app.put('/', async (req, rep) => {
    if ((req.query as any)?.token && (req.query as any)?.token !== '') {
      const authToken = (req.query as any)?.token;

      if (config.session.v1.debugTokens.includes(authToken)) {
        if (isDevelopment) {
          await MeilingV1Session.setSession(req, req.body as any);
          rep.send(await MeilingV1Session.getSessionFromRequest(req));
        } else {
          sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: not in development mode.');
        }
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: invalid token.');
      }
      return;
    }
  });

  done();
}
