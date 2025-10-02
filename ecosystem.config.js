module.exports = {
  apps: [
    {
      name: 'main-server',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.MAIN_SERVER_PORT,
      },
    },
  ],
};
