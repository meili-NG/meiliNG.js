import fastify from 'fastify';
import fastifyFormbody from 'fastify-formbody';
import fs from 'fs';
import { Meiling, Startup, Terminal } from './common';
import { setupSwaggerUI } from './common/fastify';
import config from './resources/config';
import meilingPlugin from './routes';

const main = async () => {
  // some banner stuff
  Terminal.Banner.showBanner();
  Terminal.Banner.devModeCheck();

  Terminal.Log.info('Loading Session Files...');
  Meiling.V1.Session.loadSessionSaveFiles();

  Terminal.Log.info('Starting up Fastify...');
  const app = fastify({
    logger: {
      prettyPrint: true,
    },
    trustProxy: config.fastify.proxy
      ? config.fastify.proxy.allowedHosts
        ? config.fastify.proxy.allowedHosts
        : true
      : false,
  });

  Terminal.Log.info('Registering for Fastify Handler for form handling...');
  app.register(fastifyFormbody);

  Terminal.Log.info('Testing database connection...');
  if (!(await Meiling.Database.testDatabase())) {
    Terminal.Log.error('Failed to connect! Please check if database is online.');
    process.exit(1);
  }

  Terminal.Log.info('Running check for JWT certificate configuration for id_token generation...');
  await Startup.checkIDTokenIssueCredentials();

  Terminal.Log.info('Running Garbage Collection...');
  await Startup.runStartupGarbageCollection();

  Terminal.Log.info('Registering Root Endpoints...');
  app.register(meilingPlugin);

  if (typeof config.fastify.listen === 'string') {
    if (fs.existsSync(config.fastify.listen)) {
      Terminal.Log.info('Deleting existing UNIX Socket...');
      fs.unlinkSync(config.fastify.listen);
    }
  }

  Terminal.Log.info('Preparing SwaggerUI for API Docs...');
  setupSwaggerUI(app);

  Terminal.Log.info('Starting up fastify...');
  await app.listen(config.fastify.listen, config.fastify.address);

  if (typeof config.fastify.listen === 'string') {
    if (config.fastify.unixSocket?.chown?.uid !== undefined && config.fastify.unixSocket?.chown?.gid !== undefined) {
      Terminal.Log.info('Setting up Owner Permissions of Socket...');
      fs.chownSync(
        config.fastify.listen,
        config.fastify.unixSocket?.chown?.uid as number,
        config.fastify.unixSocket?.chown?.gid as number,
      );
    }
    if (config.fastify.unixSocket?.chmod) {
      Terminal.Log.info('Setting up Access Permissions of Socket...');
      fs.chmodSync(config.fastify.listen, config.fastify.unixSocket.chmod);
    }
  }

  Terminal.Log.info('Starting up SwaggerUI...');
  app.swagger();

  Terminal.Log.ok('meiliNG has started up.');
};

if (require.main === module) {
  main();
}
