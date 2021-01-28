import chalk from 'chalk';
import Figlet from 'figlet';
import { isDevelopment, VERSION } from '../';

export function showBanner() {
  console.log(Figlet.textSync('Meiling'));
  console.log();
  console.log(`${chalk.bold('Meiling Project')} - ver. ${VERSION}`);
  console.log(chalk.cyan(chalk.underline('https://github.com/Stella-IT/meiling')));
  console.log();
  console.log(
    `Copyright © ${chalk.bold(
      `${chalk.cyan('Stella')} ${chalk.blue('IT')} ${chalk.magenta('Inc.')}`,
    )} and Meiling Project Contributors`,
  );
  console.log();
}

export function devModeCheck() {
  if (isDevelopment) {
    console.log(
      chalk.yellowBright('Launching in Development mode, ') +
        chalk.bgYellowBright(chalk.black(chalk.bold(' DO NOT USE THIS IN PRODUCTION. '))),
    );
    console.log();
  }
}
