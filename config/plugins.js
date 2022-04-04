

module.exports = ({ env }) => ({
  // ...
  upload: {
    provider: 'cloudinary',
    providerOptions: {
      cloud_name: env('CLOUDINARY_NAME', 'doh4vcgwz'),
      api_key: env('CLOUDINARY_KEY', '266441192261964'),
      api_secret: env('CLOUDINARY_SECRET', 'zXImiFpwDx2BwYAiwAZqB6ZVm2o'),
    },
  },
  email: {
    provider: 'nodemailer',
    providerOptions: {
      service: 'gmail',
      auth: {
        user: 'amr.r.gasser@gmail.com',
        pass: 'xthioibjcuiflcjg'
      },
    },
    settings: {
      defaultFrom: 'amr.r.gasser@gmail.com',
      defaultReplyTo: 'amr.r.gasser@gmail.com',
    },
  },
  // ...
});
