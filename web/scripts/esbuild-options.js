const define = {};

const env_defaults = {
  SERVERS_JSON_URL: 'https://vigrid.velvetcache.org/servers.json',
  WEBSOCKET_URL: 'wss://vigrid.velvetcache.org/ws',
}

for(const k in env_defaults) {
  define[`process.env.${k}`] = JSON.stringify(process.env[k] || env_defaults[k])
}

module.exports = {
  entryPoints: ['./src/app.js'],
  outfile: './dist/app.js',
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  define,
}
