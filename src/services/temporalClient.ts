import {
  Client,
  Connection,
} from '@temporalio/client';

let temporalClient: Client | undefined;

export async function connectTemporalClient(address: string): Promise<Client> {
  const connection = await Connection.connect({
    address,
    connectTimeout: '1.5 seconds',
  });
  temporalClient = new Client({ connection });
  return temporalClient;
}

export function createLazyTemporalClient(address: string): Client {
  temporalClient = new Client({
    connection: Connection.lazy({ address }),
  });
  return temporalClient;
}

export function getTemporalClient(): Client {
  if (!temporalClient) {
    throw new Error('Temporal client has not been initialized');
  }

  return temporalClient;
}
