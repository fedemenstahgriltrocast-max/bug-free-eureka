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

/**
 * Firebase Cloud Functions
 */

import * as logger from "firebase-functions/logger";
import {onDocumentDeleted} from "firebase-functions/firestore";
import {getStorage} from "firebase-admin/storage";
import {initializeApp} from "firebase-admin/app";

initializeApp();

/**
 * Remove media stored in Cloud Storage when a session is deleted
 * from Firestore.
 * This happens when the session is complete and the user has
 * submitted an order, a session is manually deleted or it is removed due to
 * its TTL.
 * A Firebase Function that is triggered when sessions are removed from
 * Firestore, for example when its TTL is reached or the user has been deleted.
 */
export const onSessionDeletedRemoveMedia =
  onDocumentDeleted("agentSessions/{userId}", async (event) => {
    // Get the user ID from the event.
    const userId = event.params.userId;
    logger.info("Removing media for user", {user: userId});
    // Remove all files stored for this user.
    await getStorage().bucket().deleteFiles(
      {prefix: `users/${userId}`}
    );
    logger.info("Media removed.", {user: userId});
  });
