// Default to local, proxied servers JSON to work around CORS
process.env.SERVERS_JSON_URL = process.env.SERVERS_JSON_URL || '/servers.json';

require('esbuild-server')
  .createServer(
    require('./esbuild-options'),
    {
      static: 'public',
      injectLiveReload: true,
      open: true,
      proxy: {
        '/servers.json': 'https://vigrid.velvetcache.org',
      },
      onProxyRewrite: (proxyRes, localUrl, proxyUrl) => {
        console.log(`Proxying ${localUrl} to ${proxyUrl}`);
        return proxyRes;
      },
    }
  )
  .start();
