import localtunnel from 'localtunnel';
import { getConfig } from './config';

void (async () => {
    const { port, hostname } = getConfig();
    const subdomain = hostname.split('.')[0];
    const tunnel = await localtunnel({ port, subdomain });

    console.log(`localhost available here: \x1b[42m${tunnel.url}\x1b[0m`);
})();
