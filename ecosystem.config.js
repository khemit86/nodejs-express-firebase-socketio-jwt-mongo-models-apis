module.exports = {
  apps: [
    {
      name: 'zoomdelivery-api',
      script: './server.js',
      watch: false,
      ignore_watch: ['.git', 'node_modules', 'public'],
      env: {
        PORT: 7100,
        MONGO_USERNAME: 'octal_pankaj',
        MONGO_PASSWORD: '3RX3ZznzuVtRuvo2',
        MONGO_SERVER: 'pankajoctal.nkvr2ml.mongodb.net',
        MONGO_DATABASE: 'zoomdelivery',
        JWT_SECRET: 'octal@123',
        FCM_TOKEN: 'octal@123',
        tokenLife: '1d',
        refreshTokenLife: '3d',
        IMAGE_LOCAL_PATH: 'https://zoom-staging-api.octallabs.com/',
        UI_LINK: 'https://zoom-web-staging.pages.dev',
        UI_RESET_LINK: 'https://zoom-web-saakashlh-gmailcom.vercel.app/auth',
        EMAIL_ADDRESS: 'mern@octalsoftware.com',
        FACEBOOK_CLIENT_ID: 1013755159311818,
        FACEBOOK_CLIENT_SECRET: '50c0058b5ce98a43e6dc8f59bc1edcaa',
        GOOGLE_CLIENT_ID:
          '736340207104-see54314bdoknk5guu94visg35jh21iq.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: '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',
        CALLBACK_URL_SOCIAL: 'http://localhost:3000/'
      },
      env_staging: {
        PORT: 5001,
        IMAGE_LOCAL_PATH: 'http://13.235.72.118:5001/img/',
        RESET_LOCAL_LINK: 'http://13.235.72.118:5002/reset-password',
        MONGO_USERNAME: 'octal_manish',
        MONGO_PASSWORD: 'GT8sa0u3TNqCjIZh',
        MONGO_SERVER: 'octal-manish.fyjd2zy.mongodb.net',
        MONGO_DATABASE: 'pet_cares',
        CALLBACK_URL_SOCIAL: 'http://13.235.72.118:5001/'
      },
      env_testing: {
        PORT: 5001,
        IMAGE_LOCAL_PATH: 'http://3.110.92.159:5001/img/',
        RESET_LOCAL_LINK: 'http://3.110.92.159:5002/reset-password',
        MONGO_USERNAME: 'octal_manish',
        MONGO_PASSWORD: 'GT8sa0u3TNqCjIZh',
        MONGO_SERVER: 'octal-manish.fyjd2zy.mongodb.net',
        MONGO_DATABASE: 'pet_cares_qa',
        CALLBACK_URL_SOCIAL: 'http://3.110.92.159:5001/'
      },
      instances: 2,
      exec_mode: "cluster",
    }
  ]
}
