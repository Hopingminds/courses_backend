import path from 'path';
import fs from 'fs';
import appRoot from 'app-root-path';
import rateLimit from 'express-rate-limit';
import FileStreamRotator from 'file-stream-rotator';
import { errorResponse } from '../configs/app.response.js';
import currentDateTime from '../lib/current.date.time.js';
import logger from './winston.logger.js';


export const apiLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 sec
    max: 1, // limit each IP to 1 request per `window` (here, per 10 seconds)
    message: { message: 'Too many login attempts from this IP, please try again after a 30 second pause' },
    handler: async (req, res, _next, options) => {
        try {
            const LOGS_FOLDER = `${appRoot}/logs/limiter`;

            // if logs folder does not exist, create folder
            if (!fs.existsSync(`${appRoot}/logs`)) {
                fs.mkdirSync(`${appRoot}/logs`);
            }

            // if limiter folder does not exist, create folder
            if (!fs.existsSync(LOGS_FOLDER)) {
                fs.mkdirSync(LOGS_FOLDER);
            }

            // create a rotating write stream
            const apiLimiterRotator = FileStreamRotator.getStream({
                date_format: 'YYYY-MM-DD',
                filename: path.join(LOGS_FOLDER, 'api-limiter-%DATE%.log'),
                frequency: 'daily',
                verbose: false
            });

            const logMessage = `[${currentDateTime()}]\tTITLE: TOO MANY REQUEST\tMETHOD: ${req.method}\tURL: ${req.url}\tCLIENT: ${req.headers['user-agent']}\n`;

            apiLimiterRotator.write(logMessage, 'utf8');
        } catch (err) {
            logger.error('API limiter error: ', err);
        }

        // sending API error response
        res.status(options.statusCode).send(errorResponse(
            29,
            'TOO MANY REQUEST',
            options.message.message
        ));
    },
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // disable the `X-RateLimit-*` headers
});