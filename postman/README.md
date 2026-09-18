# Hotel Orchestrator Postman Collection

Import `postman/hotel-orchestrator.postman_collection.json` into Postman. The collection variable `{{baseUrl}}` defaults to `http://localhost:3000`; edit it in the collection variables when the API runs elsewhere.

The **Supplier outage simulation** folder requires the API and worker to be restarted with Supplier A outage simulation enabled:

```powershell
docker compose -f docker-compose.yml -f docker-compose.outage.yml up -d --build
```

Run that command before the outage folder, then restore normal operation afterward:

```powershell
docker compose -f docker-compose.yml up -d --build
```

The direct mock endpoint test works without the environment override. The real aggregation and health outage requests require the override.

For optional CI execution with Newman:

```powershell
npx newman run postman/hotel-orchestrator.postman_collection.json
```
