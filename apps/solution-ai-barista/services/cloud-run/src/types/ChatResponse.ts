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

import { BeverageModel } from '@ai-barista/shared';
import { ChatResponseModel } from '@ai-barista/shared';

export class ChatResponse implements ChatResponseModel {
  sessionId?: string;
  role: 'agent' = 'agent' as const;
  text: string;
  suggestedResponses: string[];
  readyForSubmission: boolean;
  order: BeverageModel[];
  orderSubmitted: boolean;

  constructor(options: {
    text: string;
    suggestedResponses: string[];
    readyForSubmission?: boolean; // Optional
    orderSubmitted?: boolean; // Optional
    order?: BeverageModel[]; // Optional
  }) {
    this.text = options.text;
    this.suggestedResponses = options.suggestedResponses;
    this.readyForSubmission = options.readyForSubmission ?? false;
    this.orderSubmitted = options.orderSubmitted ?? false;
    this.order = options.order ?? [];
  }
}