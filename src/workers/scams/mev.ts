// prevents TS errors
declare var self: Worker;

self.onmessage = async (event: MessageEvent<string>) => {
  const domain = event.data;

  // Fetch the main page of the site
  const response = await fetch(`http://${domain}`, {
    timeout: true,
  }).catch(() => undefined);
  if (!response) return;

  // Get the request body
  const text = await response.text();

  // Get just the a-z text, remove everything else
  const textOnly = text.replace(/[^a-z]/gi, '');

  // Check for MEV scam
  if (textOnly.includes('mev') && textOnly.includes('uniswap')) {
    postMessage('mev');
    return;
  }

  postMessage(null);
};
