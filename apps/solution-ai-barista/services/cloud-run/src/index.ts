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

import express from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase-admin/app';
import routeHandlers from './routes';
import logger from './logging/logger';
import verifyAuthentication from './auth/verifyAuthenticationMiddleware';
import verifyAppCheck from './auth/verifyAppCheckMiddleware';

// import { LoggingWinston, express as loggingWinstonExpress } from '@google-cloud/logging-winston';

// Set up Express
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080

// Set up CORS to enable access from the frontend application if needed.
// const corsOptions = {
//   // TODO: Configure the domain of the frontend application here.
//    origin: '',
// }
// app.use(cors(corsOptions));

// Use the JSON middleware to parse requests.
app.use(express.json());

// Set up Firebase.
initializeApp();

// The /chat endpoint is the entry point for the agent.
app.post('/chat', verifyAuthentication(), verifyAppCheck(), routeHandlers.chat);

// Clear data and reinitalize the current session.
app.post('/clearSession', verifyAuthentication(), verifyAppCheck(), routeHandlers.clearSession);

// Approve an in-progress order when prompted by the agent.
app.post('/approveOrder', verifyAuthentication(true), verifyAppCheck(true), routeHandlers.approveOrder);

// Start the Express server.
app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port}`);
});
