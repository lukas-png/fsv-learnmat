process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import Routes from '@interfaces/routes.interface';
import errorMiddleware from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import config from 'config';
import https from 'https';
import fs from 'fs';

// Access links carry the JWT as ?token=..., keep it out of the access logs
morgan.token('url', (req: express.Request) => (req.originalUrl || req.url).replace(/([?&]token=)[^&]*/gi, '$1***'));


class App {
  public app: express.Application;
  public port: string | number;
  public env: string;

  constructor(routes: Routes[]) {
    this.app = express();
    if (config.get('trustProxy')) this.app.set('trust proxy', 1);
    this.port = config.get("port") || 3000;
    this.env = config.get("env")  || 'development';
    logger.info(process.env.NODE_ENV)
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {

    const keyPath = __dirname + '/../../../key.pem';
    const certPath = __dirname + '/../../../cert.pem';

    if (this.env === 'production' && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const credentials = {
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(certPath, 'utf8')
      };
      https.createServer(credentials, this.app).listen(443);
      logger.info(`🚀 App listening on the port 443`);
    }

    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    if (this.env === 'production') {
      this.app.use(morgan('combined', { stream }));
      // this.app.use(cors({ origin: true, credentials: true }));
    } else {
      this.app.use(morgan('dev', { stream }));
      this.app.use(cors({ origin: true, credentials: true }));
    }
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(hpp());
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {    
    routes.forEach(route => {
      this.app.use('/api', route.router);
    });
    if (this.env === 'production') {
      this.app.use(express.static(__dirname + "/../learnmat"))

      this.app.all('*', function(req, res, next) {
        // Just send the index.html for other files to support HTML5Mode
        res.status(200).sendFile(`/`, {root: __dirname + "/../learnmat" });
      });
    }
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
