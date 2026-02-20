const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to fix AndroidX manifest merger conflict
 * Adds tools:replace="android:appComponentFactory" to application element
 */
function withAndroidManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    
    // Add tools namespace
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    
    // Get application element
    if (manifest.application && manifest.application[0]) {
      const app = manifest.application[0];
      
      // Add tools:replace for appComponentFactory - this resolves the AndroidX conflict
      app.$['tools:replace'] = 'android:appComponentFactory';
    }
    
    return config;
  });
}

module.exports = withAndroidManifestFix;
