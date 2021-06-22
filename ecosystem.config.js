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
      user: 'root',
      host: 'meiling-deploy',
      ref: 'origin/main',
      repo: 'https://github.com/meiling-gatekeeper/meiling',
      path: '/var/meiling',
      'post-deploy': `yarn && yarn build && pm2 startOrRestart ecosystem.config.js`,
    },
  },
};
