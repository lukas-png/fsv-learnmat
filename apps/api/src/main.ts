process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import 'reflect-metadata'; // required by class-transformer's @Type decorator
import 'dotenv/config';
import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import ModulesRoute from '@routes/modules.route';
import SubmissionsRoute from '@routes/submissions.route';
import { statsService } from '@services/stats.service';

validateEnv();

const app = new App([new IndexRoute(), new AuthRoute(), new ModulesRoute(), new SubmissionsRoute()]);

app.listen();
statsService.start();

// Write pending statistics before the container stops
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    statsService.stop().finally(() => process.exit(0));
  });
}
