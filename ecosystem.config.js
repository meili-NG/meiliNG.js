/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = {
  apps: [
    {
      name: 'Meiling Gatekeeper',
      cwd: '.',
      script: 'yarn',
      args: ['start', '--no-cleanup'],
      env: {
        // You should configure it here.
        NODE_ENV: 'production',

        FASTIFY_LISTEN: 8080,
        FASTIFY_USE_PROXY: 1,
      },
    },
  ],

  deploy: {
    production: {
      user: process.env.DEPLOY_PRODUCTION_USER,
      host: process.env.DEPLOY_PRODUCTION_HOST,
      ref: 'origin/main',
      repo: 'https://github.com/meiling-gatekeeper/meiling',
      path: process.env.DEPLOY_PRODUCTION_PATH,
      'pre-deploy-local': `scp -Cr ./.env ${process.env.DEPLOY_PRODUCTION_USER}@${process.env.DEPLOY_PRODUCTION_HOST}:${process.env.DEPLOYY_PRODUCTION_PATH}/current`,
      'post-deploy': `yarn && yarn build && pm2 startOrRestart ecosystem.config.js`,
    },
  },
};
