import { TikTokLiveConnection } from 'tiktok-live-connector';

const c = new TikTokLiveConnection('t7vomg9', {});

c.on('error', (e) => {
  console.error('Event error:', e.name, e.message, e.cause);
});

c.on('connect', () => console.log('CONNECTED'));

c.connect()
  .then(r => console.log('Connect promise resolved:', r))
  .catch(e => {
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Error cause:', String(e.cause));
  });

// Log any unhandled promise rejection
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled:', reason);
});

// Kill after 12s
setTimeout(() => {
  console.log('Timeout - disconnecting');
  c.disconnect();
  process.exit(1);
}, 12000);