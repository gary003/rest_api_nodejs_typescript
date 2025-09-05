module.exports = {
  apps: [
    {
      name: 'tracing',
      script: './dist/bin/tracing.js',
      exec_mode: 'cluster',
      instances: 1
    },
    {
      name: 'server',
      script: './dist/bin/server.js',
      exec_mode: 'cluster',
      instances: 1,
      wait_ready: true,
      listen_timeout: 500
    }
  ]
}
