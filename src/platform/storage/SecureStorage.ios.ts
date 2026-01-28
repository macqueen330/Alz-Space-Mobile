import * as ExpoSecureStore from 'expo-secure-store';

class SecureStorageClass {
  /**
   * Store a value securely in the iOS Keychain
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await ExpoSecureStore.setItemAsync(key, value, {
        keychainAccessible: ExpoSecureStore.WHEN_UNLOCKED,
      });
      console.log(`[SecureStorage iOS] Stored key: ${key}`);
    } catch (error) {
      console.error(`[SecureStorage iOS] Error storing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a securely stored value from iOS Keychain
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await ExpoSecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`[SecureStorage iOS] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a securely stored value from iOS Keychain
   */
  async removeItem(key: string): Promise<void> {
    try {
      await ExpoSecureStore.deleteItemAsync(key);
      console.log(`[SecureStorage iOS] Removed key: ${key}`);
    } catch (error) {
      console.error(`[SecureStorage iOS] Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if secure storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to set and get a test value
      const testKey = '__secure_storage_test__';
      await ExpoSecureStore.setItemAsync(testKey, 'test');
      await ExpoSecureStore.deleteItemAsync(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const SecureStorage = new SecureStorageClass();
