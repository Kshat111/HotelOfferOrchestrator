import { app } from './app.js';
import { config } from './config.js';
import {
  connectTemporalClient,
  createLazyTemporalClient,
} from './services/temporalClient.js';

async function startServer(): Promise<void> {
  try {
    await connectTemporalClient(config.TEMPORAL_ADDRESS);
  } catch {
    console.error('Temporal is unavailable during startup; using lazy client');
    createLazyTemporalClient(config.TEMPORAL_ADDRESS);
  }

  app.listen(config.PORT, () => {
    console.log(`hotel-offer-orchestrator listening on port ${config.PORT}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error('Server failed to start', error);
  process.exitCode = 1;
});
