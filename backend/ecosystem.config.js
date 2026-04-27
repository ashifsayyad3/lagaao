module.exports = {
  apps: [
    {
      name: 'lagaao-backend',
      script: 'dist/main.js',
      cwd: '/var/www/lagaao/backend',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/pm2/lagaao-backend-error.log',
      out_file: '/var/log/pm2/lagaao-backend-out.log',
      log_file: '/var/log/pm2/lagaao-backend.log',
      time: true,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
