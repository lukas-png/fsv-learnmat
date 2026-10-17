process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import 'reflect-metadata'; // required by class-transformer's @Type decorator
import 'dotenv/config';
import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import ModulesRoute from '@routes/modules.route';

validateEnv();

const app = new App([new IndexRoute(), new AuthRoute(), new ModulesRoute()]);

app.listen();
