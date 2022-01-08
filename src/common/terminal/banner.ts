import config from '../../resources/config';
import { info as packageJson } from '../../resources/package';

import Figlet from 'figlet';
import chalk from 'chalk';
import { NodeEnvironment } from '../../interface';

export const showBanner = (): void => {
  console.log(Figlet.textSync('Meiling'));
  console.log();
  console.log(`${chalk.bold('Meiling Gatekeeper')} - ${chalk.italic(`ver. ${packageJson.version}`)}`);
  console.log(chalk.cyan(chalk.underline(packageJson.repository)));
  console.log();
  console.log(`Copyright © Meiling Gatekeeper Contributors`);
  console.log(
    `Built with ${chalk.redBright('<3')} by ${chalk.cyan('Stella')} ${chalk.blue('IT')} ${chalk.magenta(
      'Inc.',
    )} OpenSource Team`,
  );
  console.log();
  console.log(
    'Distributed under ' +
      (process.env.MEILING_FORCE_HRPL ? chalk.bold('MIT License') : chalk.bold('Hakurei Reimu Public License')),
  );
  console.log();
};

export const devModeCheck = (): void => {
  if (config.node.environment === NodeEnvironment.Development) {
    console.log(
      chalk.yellow('Launching in Development mode, ') +
        chalk.bgYellowBright(chalk.black(chalk.bold(' DO NOT USE THIS IN PRODUCTION. '))),
    );
    console.log();
  }
};
