import 'dotenv/config';
import { CertStreamClient } from './cert-stream';

let certsSeen = 0;
let certsFetching = 0;
let certsFetched = 0;

const client = new CertStreamClient(async (meta) => {
  try {
    certsSeen++;

    // Get the domain from the cert
    const domain = meta.data.leaf_cert.all_domains?.[0]?.replace('*.', '');
    if (domain === undefined) return;

    // Log the domain
    console.log(
      JSON.stringify({
        message: 'new-cert',
        level: 'debug',
        domain,
        _time: Date.now(),
      }),
    );

    // Only check 1/100 certs
    if (certsSeen % 100 !== 0) return;

    // Log the stats
    console.info(
      JSON.stringify({
        message: 'stats',
        level: 'debug',
        certsSeen,
        certsFetching,
        certsFetched,
        _time: Date.now(),
      }),
    );

    certsFetching++;
    const workerURL = new URL('workers/scams/mev.ts', import.meta.url).href;
    const worker = new Worker(workerURL);
    worker.postMessage(domain);
    worker.onmessage = (event) => {
      certsFetched++;
      switch (event.data) {
        case 'mev':
          console.log(
            JSON.stringify({
              message: 'scam-detected',
              scam: 'mev',
              level: 'info',
              domain,
              _time: Date.now(),
            }),
          );
          return;
      }

      console.info(
        JSON.stringify({
          message: 'nothing-detected',
          level: 'debug',
          domain,
          _time: Date.now(),
        }),
      );

      // Terminate the worker when we're done
      worker.terminate();
    };
  } catch (error) {
    console.error(`> [client] ${error}`);
  }
});

try {
  console.info('> [client] started');

  // Connect to the websocket server
  await client.connect();
  console.info('> [client] connected to stream');

  // Failed to connect
  if (!client.ws) process.exit(0);

  const originalOnOpen = client.ws.onopen;
  client.ws.onopen = (event) => {
    console.info('> [client] opened');
    originalOnOpen?.(event);
  };

  client.ws.onclose = (event) => {
    console.info(`> [client] closed: ${event.code} ${event.reason}`);
  };

  client.ws.onerror = (event) => {
    console.info(`> [client] error: ${event}`);
  };
} catch (error) {
  console.error(`> [client] ${error}`);
}
