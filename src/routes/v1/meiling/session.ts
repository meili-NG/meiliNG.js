import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { BaridegiLogType, sendBaridegiLog } from '../../../common/event/baridegi';
import { MeilingV1Session } from './common';

export function sessionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    let token = MeilingV1Session.getTokenFromRequest(req);

    if (token) {
      const [isToken, isValid] = await Promise.all([MeilingV1Session.isToken(token), MeilingV1Session.isValid(token)]);
      if (isToken && isValid) {
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
      sendBaridegiLog(BaridegiLogType.NEW_SESSION, {
        ip: req.ip,
        token: token,
      });

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

  done();
}
