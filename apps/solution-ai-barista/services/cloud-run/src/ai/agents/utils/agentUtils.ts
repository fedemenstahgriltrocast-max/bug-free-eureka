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

import { BeverageModel } from 'libs/shared';
import { ai } from '../../genkit';
import logger from '../../../logging/logger';
import { AgentState } from '../../..//types/agentState';

/** 
 * Converts a BeverageModel to a tuple for use by tools.
 */
export function beverageToTuple(beverage: BeverageModel): [string, string[]] {
    return [beverage.name, beverage.modifiers];
  }
  
  /**
   * Saves the given order in the current session.
   * @param order Order to save in the current session
   */
  export async function updateStateOrder(order: BeverageModel[]) {
    await ai.currentSession<AgentState>().updateState({
      ...ai.currentSession().state,
      inProgressOrder: order
    });
  
    logger.silly('[updateStateOrder]', { newOrder: order });
  
  }
  
  /**
   * Retrieves the current order from the current session.
   * @returns The current order
   */
  export function getStateOrder(): BeverageModel[] {
    logger.silly('[getStateOrder]', { order: ai.currentSession<AgentState>().state?.inProgressOrder });
    return ai.currentSession<AgentState>().state?.inProgressOrder || [];
  }