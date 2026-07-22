module.exports = {
  apps: [
    {
      name: 'tharwah-api',
      script: 'src/server.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      cwd: '/var/www/tharwah-api',
      instances: 'max',
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
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
  ],
};
