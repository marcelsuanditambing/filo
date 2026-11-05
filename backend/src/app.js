import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import config from './config/index.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Behind the nginx reverse proxy: trust X-Forwarded-* so req.ip is the client.
app.set('trust proxy', true);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Token Buku Kenangan (?token=...) tidak ikut tercatat di log akses.
morgan.token('url', (req) => (req.originalUrl || req.url).replace(/([?&]token=)[^&]*/gi, '$1[hidden]'));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => res.json({ success: true, message: 'Filo API is running' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
