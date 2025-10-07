# Local recommendation service

This is a small HTTP-service that returns a static beverage recommendation.

It returns a random combination of beverages and two modifiers.

It is used to demonstrate calling an external HTTP-service from the AI Barista recommendation agent.

## Run

```bash
npm install
npm run dev
```

### Use the service

Start the backend with the `LOCAL_RECOMMENDATION_SERVICE` environment variable to point to this service:

```bash
LOCAL_RECOMMENDATION_SERVICE="http://127.0.0.1:8084" npm run genkit:dev
```
