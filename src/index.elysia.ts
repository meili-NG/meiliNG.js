import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import fs from 'fs';
import { Meiling, Startup, Terminal } from './common';
import { isSentryAvailable } from './common/sentry/tracer';
import config from './resources/config';
import { NodeEnvironment } from './interface';
import { info as packageJson } from './resources/package';

// Note: Routes will be migrated incrementally
// import { v1Plugin } from './routes/v1/index.elysia';
// import { wellKnownPlugin } from './routes/well-known/index.elysia';

/**
 * Main Elysia Application Entry Point
 *
 * This is the Elysia migration of the meiliNG authentication server.
 * It provides OAuth2 and OpenID Connect authentication services.
 */
const main = async () => {
  const currentEnv = config.node.environment;

  // Display banner and startup information
  Terminal.Banner.showBanner();
  Terminal.Banner.devModeCheck();

  Terminal.Log.info('Loading Session Files...');
  Meiling.V1.Session.loadSessionSaveFiles();

  Terminal.Log.info('Starting up Elysia...');

  // Initialize Elysia app
  const app = new Elysia()
    // Configure CORS
    .use(
      cors({
        origin: currentEnv === NodeEnvironment.Development ? '*' : config.frontend.url,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
      })
    )
    // Configure Swagger/OpenAPI documentation
    .use(
      swagger({
        documentation: {
          info: {
            title: 'meiliNG API',
            description: packageJson.description,
            version: packageJson.version,
          },
          servers: [
            {
              url: config.frontend.url,
              description: 'Main server',
            },
          ],
          tags: [
            { name: 'Authentication', description: 'User authentication endpoints' },
            { name: 'OAuth2', description: 'OAuth2 authorization endpoints' },
            { name: 'SAML2', description: 'SAML2 authentication endpoints' },
            { name: 'Admin', description: 'Administrative endpoints' },
            { name: 'User', description: 'User management endpoints' },
          ],
        },
        path: '/docs',
      })
    );

  // Global error handler
  app.onError(({ code, error, set }) => {
    Terminal.Log.error(`Error [${code}]:`, error.message);

    // Handle custom Meiling errors
    if (error.name === 'MeilingError' || error.name === 'MeilingV1Error') {
      const meilingError = error as any;
      set.status = meilingError.statusCode || 500;
      return {
        success: false,
        error: meilingError.type || 'INTERNAL_ERROR',
        message: meilingError.message,
        ...(currentEnv === NodeEnvironment.Development && { stack: error.stack }),
      };
    }

    // Handle OAuth2 errors
    if (error.name === 'OAuth2Error') {
      const oauth2Error = error as any;
      set.status = oauth2Error.statusCode || 400;
      return {
        error: oauth2Error.type || 'invalid_request',
        error_description: oauth2Error.message,
      };
    }

    // Generic error handler
    set.status = 500;
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: currentEnv === NodeEnvironment.Development ? error.message : 'An internal error occurred',
      ...(currentEnv === NodeEnvironment.Development && { stack: error.stack }),
    };
  });

  // Request logging (development mode)
  if (currentEnv === NodeEnvironment.Development) {
    app.onRequest(({ request, path }) => {
      Terminal.Log.info(`[${request.method}] ${path}`);
    });
  }

  // Sentry integration (if available)
  if (isSentryAvailable()) {
    Terminal.Log.info('Registering Sentry...');
    // TODO: Implement Sentry middleware for Elysia
    // app.use(sentryPlugin);
  }

  // Test database connection
  Terminal.Log.info('Initiating database connection...');
  if (!(await Meiling.Database.testDatabase())) {
    Terminal.Log.error('Failed to connect! Please check if database is online.');
    process.exit(1);
  }

  // Check JWT certificates
  Terminal.Log.info('Running check for JWT certificate configuration for id_token generation...');
  await Startup.checkIDTokenIssueCredentials();

  // Run startup garbage collection
  Terminal.Log.info('Running Garbage Collection...');
  await Startup.runStartupGarbageCollection();

  Terminal.Log.info('Registering Root Endpoints...');

  // Root endpoint
  app.all('/', () => {
    const easteregg = {
      about: {
        name: packageJson.name,
        description: packageJson.description,
        repository: packageJson.repository,
        version: currentEnv === NodeEnvironment.Development ? packageJson.version : undefined,
      },
    };

    return {
      hello: 'world',
      ...easteregg,
    };
  });

  // Mount route plugins
  // TODO: Uncomment as routes are migrated
  // app.use(v1Plugin);
  // app.use(wellKnownPlugin);

  // Health check endpoint
  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // 404 handler
  app.onError(({ code, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'The requested resource was not found',
      };
    }
  });

  // Determine listen configuration
  let isUnixSocket = false;
  const listenConfig = config.fastify.listen;

  if (typeof listenConfig === 'string') {
    isUnixSocket = true;

    if (fs.existsSync(listenConfig)) {
      Terminal.Log.info('Deleting existing UNIX Socket...');
      fs.unlinkSync(listenConfig);
    }
  }

  // Start server
  Terminal.Log.info('Starting up Elysia server...');

  const listenOptions: any = {};

  if (typeof listenConfig === 'number') {
    listenOptions.port = listenConfig;
    listenOptions.hostname = config.fastify.address ?? '0.0.0.0';
  } else {
    listenOptions.unix = listenConfig;
  }

  app.listen(listenOptions);

  // Set UNIX socket permissions if applicable
  if (typeof listenConfig === 'string') {
    if (config.fastify.unixSocket?.chown?.uid !== undefined && config.fastify.unixSocket?.chown?.gid !== undefined) {
      Terminal.Log.info('Setting up Owner Permissions of Socket...');
      fs.chownSync(
        listenConfig,
        config.fastify.unixSocket?.chown?.uid as number,
        config.fastify.unixSocket?.chown?.gid as number
      );
    }
    if (config.fastify.unixSocket?.chmod) {
      Terminal.Log.info('Setting up Access Permissions of Socket...');
      fs.chmodSync(listenConfig, config.fastify.unixSocket.chmod);
    }
  }

  // Log successful startup
  const listenAddress = typeof listenConfig === 'number'
    ? `http://${config.fastify.address ?? '0.0.0.0'}:${listenConfig}`
    : listenConfig;

  Terminal.Log.ok(`meiliNG (Elysia) has started up.`);
  Terminal.Log.info(`Listening on: ${listenAddress}`);
  Terminal.Log.info(`API Documentation: ${listenAddress}/docs`);
};

// Run the application
if (import.meta.main) {
  main().catch((error) => {
    Terminal.Log.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export default main;
