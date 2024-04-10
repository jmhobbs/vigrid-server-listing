require('esbuild-server')
  .createServer(
    {
      bundle: true,
      minify: true,
      sourcemap: true,
      entryPoints: ['src/app.js'],
    },
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
