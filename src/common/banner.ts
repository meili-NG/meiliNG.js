import chalk from 'chalk';
import Figlet from 'figlet';
import { isDevelopment, packageJson } from '../';

export function showBanner() {
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
}

export function devModeCheck() {
  if (isDevelopment) {
    console.log(
      chalk.yellow('Launching in Development mode, ') +
        chalk.bgYellowBright(chalk.black(chalk.bold(' DO NOT USE THIS IN PRODUCTION. '))),
    );
    console.log();
  }
}
