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
  navigation: {
    relatedContentTypes: [
      'application::pages.pages',
      'application::home.home',
      'application::home-at-makadi-heights.home-at-makadi-heights',
      'application::event.event',
      'application::center.center',
      'application::amenity.amenity',
    ],
    allowedLevels: 2,
    // contentTypesNameFields: {
    //   'event': ['id'],
    // },
  },
  // ...
});
