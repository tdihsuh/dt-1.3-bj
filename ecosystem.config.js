module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : '黑猫察',
      script    : 'app.js',
      instances : "max",
      exec_mode : "cluster",
      autorestart: true,
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_development : {
        NODE_ENV: 'development'
      },
      env_test : {
        NODE_ENV: 'test'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ]
};
