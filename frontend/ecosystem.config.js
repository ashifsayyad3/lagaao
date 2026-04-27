module.exports = {
  apps: [
    {
      name: 'lagaao-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/lagaao/frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '768M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/lagaao-frontend-error.log',
      out_file: '/var/log/pm2/lagaao-frontend-out.log',
      log_file: '/var/log/pm2/lagaao-frontend.log',
      time: true,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
