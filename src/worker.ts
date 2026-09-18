import { NativeConnection, Worker } from '@temporalio/worker';

import * as activities from './activities/cacheActivity.js';
import * as supplierActivities from './activities/supplierActivities.js';
import { config } from './config.js';

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: config.TEMPORAL_ADDRESS,
  });
  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows/hotelAggregationWorkflow.js'),
    activities: {
      ...activities,
      ...supplierActivities,
    },
    taskQueue: 'hotel-offer-orchestrator',
  });

  await worker.run();
}

void run().catch((error: unknown) => {
  console.error(
    'Temporal worker stopped unexpectedly',
    error instanceof Error ? error.message : 'unknown error',
  );
  process.exitCode = 1;
});
