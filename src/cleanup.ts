import chalk from 'chalk';
import { Banner, Database, Startup } from './common';

// some banner stuff
Banner.showBanner();

(async () => {
  if (!(await Database.testDatabase())) {
    console.error(
      chalk.bgRedBright(
        chalk.whiteBright(chalk.bold('[Database] Failed to connect! Please check MySQL/MariaDB is online.')),
      ),
    );
    console.log();
    process.exit(1);
  }

  await Startup.runStartupGarbageCollection(true);
  console.log();
  console.log(chalk.greenBright(chalk.bold('Cleanup Complete!')));
  process.exit(0);
})();
