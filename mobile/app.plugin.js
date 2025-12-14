const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withGoogleMapsApiKey(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Get the Google Maps API key from app.json
    const apiKey = config.android?.config?.googleMaps?.apiKey || 
                   config.extra?.googleMapsApiKey;

    if (!apiKey) {
      console.warn('Google Maps API key not found in app.json');
      return config;
    }

    if (manifest.application && manifest.application[0]) {
      const application = manifest.application[0];
      
      // Ensure meta-data array exists
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      // Check if the API key meta-data already exists
      const existingApiKeyIndex = application['meta-data'].findIndex(
        (item) => item.$ && item.$['android:name'] === 'com.google.android.geo.API_KEY'
      );

      const apiKeyMetaData = {
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': apiKey,
        },
      };

      if (existingApiKeyIndex !== -1) {
        // Update existing API key
        application['meta-data'][existingApiKeyIndex] = apiKeyMetaData;
      } else {
        // Add new API key meta-data
        application['meta-data'].push(apiKeyMetaData);
      }
    }

    return config;
  });
};
