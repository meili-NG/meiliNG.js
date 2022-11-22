import chalk from 'chalk';
import { NodeEnvironment } from '../../interface';
import config from '../../resources/config';

const Log = {
  info: (...msg: any[]) => {
    if (config.node.environment !== NodeEnvironment.Production)
      console.log(`${chalk.cyanBright(chalk.bold('i'))}`, ...msg);
  },
  warn: (...msg: any[]) => {
    if (config.node.environment !== NodeEnvironment.Production)
      console.log(`${chalk.yellowBright(chalk.bold('!'))}`, ...msg);
  },
  error: (...msg: any[]) => {
    if (config.node.environment !== NodeEnvironment.Production)
      console.log(`${chalk.redBright(chalk.bold('×'))}`, ...msg);
  },
  ok: (...msg: any[]) => {
    if (config.node.environment !== NodeEnvironment.Production)
      console.log(`${chalk.greenBright(chalk.bold('√'))}`, ...msg);
  },
};

export default Log;
