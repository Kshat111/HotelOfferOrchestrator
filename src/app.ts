import cors, { CorsOptions } from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { healthRouter, hotelsRouter } from './routes/hotels.js';
import { supplierARouter, supplierBRouter } from './routes/suppliers.js';

export const app = express();

const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		if (!origin || config.CORS_ALLOWED_ORIGINS.includes(origin)) {
			callback(null, true);
			return;
		}

		const error = new Error('CORS origin is not allowed') as Error & {
			code: string;
			statusCode: number;
		};
		error.code = 'CORS_ORIGIN_NOT_ALLOWED';
		error.statusCode = 403;
		callback(error);
	},
};

const hotelRateLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 60,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	handler: (_request, response) => {
		response.status(429).json({
			error: {
				code: 'RATE_LIMITED',
				message: 'Too many hotel requests, please try again later',
			},
		});
	},
});

app.use(requestLogger);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/hotels', hotelRateLimiter);
app.use('/api', hotelsRouter);
app.use('/', healthRouter);
app.use('/supplierA', supplierARouter);
app.use('/supplierB', supplierBRouter);
app.use(errorHandler);
