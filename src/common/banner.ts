import config from '../resources/config';
import { info as packageJson } from '../resources/package';

import Figlet from 'figlet';
import chalk from 'chalk';
import { NodeEnvironment } from '../interface';

export const showBanner = (): void => {
  console.log(Figlet.textSync('Meiling'));
  console.log();
  console.log(`${chalk.bold('Meiling Project')} - ${chalk.italic(`ver. ${packageJson.version}`)}`);
  console.log(chalk.cyan(chalk.underline(packageJson.repository)));
  console.log();
  console.log(`Copyright © Meiling Project Contributors`);
  console.log(
    `Built with ${chalk.redBright('<3')} by ${chalk.cyan('Stella')} ${chalk.blue('IT')} ${chalk.magenta(
      'Inc.',
    )} OpenSource Team`,
  );
  console.log();
  console.log('Distributed under ' + chalk.bold('MIT License'));
  console.log();
};

export const devModeCheck = (): void => {
  if (config.node.environment === NodeEnvironment.Development) {
    console.log(
      `${chalk.yellow('Launching in Development mode. ')}
      ${chalk.bgYellowBright(chalk.black(chalk.bold('DO NOT USE THIS IN PRODUCTION. ')))}\n`,
    );
  }
};
