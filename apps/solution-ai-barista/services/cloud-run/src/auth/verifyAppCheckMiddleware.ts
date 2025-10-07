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

import { Request, Response, NextFunction } from 'express';
import { getAppCheck } from 'firebase-admin/app-check';
import logger from '../logging/logger';
import { createErrorResponse } from '../utils/utils';

/**
 * Middleware that verifies that the `X-Firebase-AppCheck` header is a valid Firebase
 * AppCheck token. 
 */
function verifyAppCheck(consumeToken: boolean = false) {

    return async function verifyAppCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Skip AppCheck verification if it is not enabled.
        if (!process.env.ENABLE_APPCHECK || process.env.ENABLE_APPCHECK != 'TRUE') {
            next();
            return;
        }

        // Confirm that the correct headerheader and value is present.
        const appCheckToken = req.header('X-Firebase-AppCheck');

        logger.info('Verifying AppCheck token', { 'X-Firebase-AppCheck': appCheckToken });

        if (!appCheckToken) {
            // App Check header missing
            logger.error('App Check header missing');
            res.status(401).send(createErrorResponse('Unauthorized', 401));
            return;
        }

        // Verify the id token and store it in the current session. 
        // Consume the token for replay protection if set.
        try {
            const appCheckClaims = await getAppCheck().verifyToken(appCheckToken, { consume: consumeToken });
            // AppCheck token validated.
            logger.info('AppCheck token validated', appCheckClaims);
            next();
        } catch (error) {
            // AppCheck token is not valid.
            logger.error('AppCheck token is not valid', error);
            res.status(401).send(createErrorResponse('Unauthorized', 401));
        }
    }

};
export default verifyAppCheck;