# AI Barista Angular Frontend

This component shows the frontend for the agentic coffee ordering app. It is built with Angular and uses Firebase Cloud Storage (to upload media files and pass them to the backend) and communicates directly with the backend.

## Prerequsites

Install dependencies:

```bash
npm install
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Update Configuration

Add your Firebase configuration into the environment configuration file `src/environments/environment.development.ts`.

## Access the Backend

The frontend is configured to access the backend through the path `/api` that is being served through the Angular proxy server. Requests to this path are forwarded to `http://localhost:8080`. (See the file `proxy.conf.json`).

The URL can be configured through the property `backendUrl` in the environment configuration.

## Deploy the frontend

You can build and deploy the frontend directly to Firebase Hosting. Run the following command in the top level directory:

```bash
firebase deploy --only hosting
```
