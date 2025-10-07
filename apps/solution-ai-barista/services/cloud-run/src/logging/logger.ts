/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { DecodedIdToken } from 'firebase-admin/auth';

const loggingWinston = new LoggingWinston();

const logger = winston.createLogger({
    level: 'info',

    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                    let output = `${timestamp} ${level}: ${message}`;
                    // Append metadata if present
                    if (Object.keys(meta).length > 0) {
                        output += ` ${JSON.stringify(meta)}`;
                    }
                    // Append the stack if present
                    if (stack) {
                        output += `\n${stack}`;
                    }
                    return output;
                }),
            ),
        })
    ]
});

// Enable Cloud Logging in production.
if (process.env.NODE_ENV == 'production') {
    console.log('[Production environment] Enabling Cloud Logging.');
    logger.add(loggingWinston);
}
export default logger;

/**
 * Returns a logger that includes the user's uid.
 */
export const getSessionLogger = (auth: DecodedIdToken | undefined) => {
    return auth ? logger.child({
        labels: {
            uid: auth.uid
        }
    }) : logger;
}
