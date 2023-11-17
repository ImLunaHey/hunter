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

    // Log every 100th cert
    if (certsSeen % 100 === 0) {
      console.info(`> [client] ${certsSeen} certs seen, ${certsFetched}/${certsFetching} fetched`);
    }

    // // Fetch the main page of the site
    // certsFetching++;
    // const response = await fetch(`http://${domain}`, {
    //   timeout: true,
    // }).catch(() => undefined);
    // certsFetched++;
    // if (!response) return;

    // // Get the request body
    // const text = await response.text();

    // // Check for MEV scam
    // if (text.includes('MEV')) console.info(`> [client] ${domain} Found possible MEV scam`);

    // // Check for crypto
    // if (text.includes('crypto')) console.info(`> [client] ${domain} Found crypto site`);

    // console.info(`> [client] ${domain} ${response.status}`);
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
