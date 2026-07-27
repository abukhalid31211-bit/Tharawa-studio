module.exports = {
  apps: [
    {
      name: 'tharwah-api',
      script: 'dist/server.js',
      cwd: '/var/www/tharwah-api',
      // TODO: restore instances:'max' after adding
      // @socket.io/redis-adapter + rate-limit-redis
      // (Socket.IO rooms and express-rate-limit currently keep state in
      // per-process memory only, so running >1 instance silently drops
      // realtime broadcasts to some clients and multiplies effective
      // rate limits across workers — see AUDIT-REPORT.md §4.7.)
      instances: 1,
      exec_mode: 'cluster',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/tharwah-api/error.log',
      out_file: '/var/log/tharwah-api/out.log',
      log_file: '/var/log/tharwah-api/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
