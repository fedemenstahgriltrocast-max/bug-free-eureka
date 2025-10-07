# AI Barista Backend

This directory contains the backend service for the AI Barista application. It's built using Genkit and Node.js with Express, designed to be deployed on Google Cloud Run or run locally for development.

This service handles:
*   User authentication and session management.
*   Interaction with the AI agent (powered by Genkit and Vertex AI).
*   Storing agent context and state, chat history and orders in Firestore.


## Prerequisites

This backend stores data in Firestore and Firebase Cloud Storage. Before running the backend, ensure you have set up the necessary Firebase services: Cloud Functions to handle data clean up, Firestore rules to enable Time-To-Live configuration and Cloud Storage Securit Rules.

From the top level directory, run this command to deploy the configuration and set up the project:

```bash
firebase deploy --only firestore,storage,functions
```

## Development and Running locally

Install dependencies:

```bash
npm install
```

Then, run the `dev` or `genkit:dev` script to automatically build and run after saving changes:

```bash
npm run genkit:dev
```

Alternatively, run the `build` and `run` scripts directly.

Update the shared libraries used by the backend and frontend by running `npm run build:update-libs`.

## Authentication for Cloud services

This backend uses Firestore and Firebase Cloud Storage to store user sessions and data, in addition to Vertex AI. If you are running this app on Firebase Studio, it will automatically use [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/provide-credentials-adc) when run.

If you are running this project locally, follow the steps in the [ADC guide for local development](https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment) to initialize local credentials.

## Deploy to Google Cloud Run

This project can be deployed directly from source code to Cloud Run.
Follow the steps in Firebase Studio to deploy the app.

Alternatively you can deploy it from the commandline using the Google Cloud SDK. Follow [the documentation](https://cloud.google.com/run/docs/deploying-source-code) to enable the Cloud Run service and grant the necessary permissions.

Here's an example command to deploy the application to Cloud Run:

```bash
gcloud run deploy aibarista-api --region us-central1 --source .
```

Note that your Firestore database and the Cloud Run instance should be located in the same region.

Don't forget to deploy the Firebase security rules, configuration and Firebase Functions as described in [Prerequisites](#prerequisites).

## Firebase and Google Cloud features

### Firestore

The Cloud Firestore Time-to-live (TTL) feature is used to automatically clear any submitted orders and abandoned user sessions from Firebase Genkit automatically.
(In a real-world application you may wish to process submitted orders and remove them once they have been completed).

The TTL configuration and security rules are configured in [/firebase](/firebase) and are deployed using the Firebase CLI:

```bash
firebase deploy --only firestore
```

### Firebase Cloud Storage

Images uploaded by users are stored on Firebase Cloud Storage.

Security rules are configured in [/firebase](/firebase) and are deployed using the Firebase CLI:

```bash
firebase deploy --only storage
```

A Cloud Function for Firebase is used to automatically clean up any stored filed when a user's session is removed from Firestore, for example when it is manually removed after completing an order or when the TTL expires.
The function is stored in [/services/functions](/services/functions) and is deployed using the Firebase CLI:

```bash
firebase deploy --only functions
```

### Google Cloud Logging and Open Telemetry

Logs and metrics are uploaded to Google Cloud Logging when the application is run in production. This includes [telemetry logs from Firebase Genkit](https://firebase.google.com/docs/genkit/observability/telemetry-collection) that are uploaded to Google Cloud Observability. Set `NODE_ENV=production` to enable automated uploads.

[Follow the documentation](https://firebase.google.com/docs/genkit/observability/getting-started) to enable the required APIs and set up permissions for the backend to enable observability logging for Firebase Genkit.

### Firebase AppCheck

This application uses Firebase App Check to protect the backend from abuse and unauthorized clients.

To get started, follow [the Firebase project set up steps for App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider#project-setup), including adding your domains and register your app in the AppCheck section of the Firebase console.

Set the environment variable `ENABLE_APPCHECK=TRUE` to enforce verification of AppCheck headers in the backend.
