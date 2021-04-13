import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { sendMeilingError } from '../../../../../error';
import { MeilingV1ErrorType } from '../../../../../interfaces';

export function meilingV1UserAppsRedirectUriCRUDPlugin(
  app: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
): void {
  app.get('/', async (req, rep) => {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
  });

  app.post('/', async (req, rep) => {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
  });

  app.delete('/:uuid', async (req, rep) => {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
  });

  app.put('/:uuid', async (req, rep) => {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
  });

  done();
}
