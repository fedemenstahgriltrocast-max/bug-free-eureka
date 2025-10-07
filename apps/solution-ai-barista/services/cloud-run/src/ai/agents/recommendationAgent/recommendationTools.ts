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

import { ai } from '../../genkit';
import { z } from 'genkit';
import logger from '../../../logging/logger';

const defaultRecommendation = {
    name: 'Mocha',
    modifiers: ['double shots', 'chocolate sauce']
};

/**
 * Access the LOCAL_RECOMMENDATION_SERVICE to retrieve a recommendation. 
 * If the service is not available, fall back to a hardcoded recommendation.
 */
ai.defineTool({
    name: 'get_barista_recommendation',
    description: 'Get the barista\'s latest recommendation for a drink.',
    inputSchema: z.void(),
    outputSchema: z.object({ name: z.string().describe('Name of the drink'), modifiers: z.array(z.string()).describe('Modifiers for the drink') }).describe('The recommendation, consisting of a name and a list of optional modifiers')
},
    async () => {
        logger.info('[get_barista_recommendation]');

        let recommendation: Recommendation | undefined;

        if (process.env.LOCAL_RECOMMENDATION_SERVICE) {
            // Retrieve a recommendation from the recommendation service.
            recommendation = await loadRecommendation();
        }
        // Fall back to the default recommendation if it could not be loaded.
        if (!recommendation) {
            recommendation = defaultRecommendation;
            logger.warn('[get_barista_recommendation] Falling back to local recommendation');
        }
        logger.info('[get_barista_recommendation] Returning barista recommendation.', { recommendation: recommendation });
        return recommendation;
    }
);

/**
 * Load the recommendation from the recommendation service.
 * 
 * This demonstrates how a tool call can access external services, such as a HTTP endpoint.
 */
async function loadRecommendation(): Promise<Recommendation | undefined> {
    logger.info('Loading recommendation from service');
    try {
        const response = await fetch(`${process.env.LOCAL_RECOMMENDATION_SERVICE}/recommendation`);
        if (response.ok) {
            const result = await response.json();
            return { name: result.name, modifiers: result.modifiers };
        } else {
            logger.warn('Could not access local recommendation service.', { response: response });
        }
    } catch (error) {
        logger.error('Error loading recommendation from service.', { error: error });
    }
    return;
}

interface Recommendation {
    name: string;
    modifiers: string[];
}
