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
import { getAuth } from 'firebase-admin/auth';
import logger from '../logging/logger';

import { createErrorResponse } from '../utils/utils';

/**
 * Middleware that verifies that the `Authorization: Bearer` header is a valid Firebase
 * Authentication token. 
 */
function verifyAuthentication(checkRevoked: boolean = false) {
    return async function verifyAuthentication(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Confirm that the correct Authorization header and value is present.
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            logger.error('Credentials missing');
            res.status(401).send(createErrorResponse('Credentials missing', 401));
            return;
        }

        // Extract the 'Bearer' value.
        const bearer = authorizationHeader.substring(7, authorizationHeader.length);

        // Verify the id token and store it in the current session.
        try {
            const decodedToken = await getAuth().verifyIdToken(bearer, checkRevoked);
            logger.info('Credentials validated', decodedToken);

            // Store the authentication details for this execution.
            res.locals.auth = decodedToken;
            next();
        } catch (error) {
            logger.error('Credentials invalid', error);
            res.status(401).send(createErrorResponse('Credentials invalid', 401));
        }
    };
}

export default verifyAuthentication;