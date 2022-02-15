import { FastifyInstance } from 'fastify';
import fastifySwagger from 'fastify-swagger';
import { nameStylized } from '..';
import { info as packageJson } from '../../resources/package';
import config from '../../resources/config';

export function setupSwaggerUI(app: FastifyInstance) {
  app.register(fastifySwagger, {
    routePrefix: '/docs',
    openapi: {
      info: {
        title: nameStylized,
        description: packageJson.description,
        version: packageJson.version,
      },
      externalDocs: {
        url: 'https://meili.ng',
        description: 'GitHub Repository',
      },
      servers: [
        {
          url: config.meiling.hostname,
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'apiKey',
            in: 'header',
          },
        },
      },
    },
    hideUntagged: true,
    exposeRoute: true,
  });
}
