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
import { AgentSessionManager } from '../ai/agentSessionManager';
import { getSessionLogger } from '../logging/logger';
import ChatError from '../types/ChatError';
import { DecodedIdToken } from 'firebase-admin/auth';


/**
 * Clear data and the in-progress order for the given agent session.
 * 
 * If an error occurs, a 500 error is returned in the response.
 * If the data has been successfully cleared, true is returned.
 */
export async function clearDataAndSession(auth: DecodedIdToken, req: Request, res: Response): Promise<boolean> {
    const logger = getSessionLogger(auth);

    // Clean up the session storage that also includes the current in-progress order.
    const agentSessionManager = new AgentSessionManager(auth);
    const isCleared = await agentSessionManager.clearSession();

    if (!isCleared) {
        logger.error('Clearing session data failed.');
        throw new ChatError(500, 'Session could not be cleared.');
    }
    logger.info('Session data cleared successfully.')

    // Invalidate the current auth details stored in this session.
    res.locals.auth = undefined;
    return true;
}