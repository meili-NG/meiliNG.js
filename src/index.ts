import fastify from 'fastify';
import fs, { promises as fsNext } from 'fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
const VERSION = packageJson.version;

const env = process.env.NODE_ENV || 'development';

const app = fastify({
  logger: true,
});

const easteregg = {
  about: {
    name: 'meiling',
    description: 'An easy-to-use, open-source oAuth2 Authentication Provider',
    version: VERSION,
    repository: 'https://github.com/Stella-IT/meiling',
  },
  poweredBy: {
    gatekeeperEngine: 'Scarlet Mansion Access Control, ver. 0.1.6',
    qiEngine: 'Qi Engine, ver. 0.2.4; Compatible with Qi Standard ver.1.2.4',
  },
};

app.get('/', (req, rep) => {
  const helloWorld = {
    hello: 'world',
    ...(env === 'development' ? easteregg : {}),
  };

  rep.send(helloWorld);
});

app.listen(8080);
