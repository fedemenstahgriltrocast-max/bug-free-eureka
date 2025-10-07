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

import { Request, Response } from 'express';
import { createChatErrorFromError, createErrorResponseFromMessageChatError, createTextResponse } from '../utils/utils';
import { clearDataAndSession } from '../utils/routeUtils';
import { getSessionLogger } from '../logging/logger';


const clearSession = async (req: Request, res: Response) => {
    // Get the auth details for the current interaction.
    const auth = res.locals.auth;

    const logger = getSessionLogger(auth);

    logger.info(`Processing /newSession request for user ${auth.uid}`);

    try {
        // No-op if there is no active session for this user, otherwise clear the data.
        if (auth && !(await clearDataAndSession(auth, req, res))) {
            // An error occured while clearing data and an error has already been sent and logged.
            return;
        }
        res.status(200).send(createTextResponse('Session invalidated.'));
    } catch (error) {
        logger.error('Could not clear session.', error)
        const chatError = createChatErrorFromError(error);
        res.status(chatError.statusCode).send(createErrorResponseFromMessageChatError('Error clearing session.', chatError));
    }
};

export default clearSession;