import * as ExpoSecureStore from 'expo-secure-store';

class SecureStorageClass {
  /**
   * Store a value securely using Android Keystore
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Android uses Android Keystore for secure storage
      await ExpoSecureStore.setItemAsync(key, value);
      console.log(`[SecureStorage Android] Stored key: ${key}`);
    } catch (error) {
      console.error(`[SecureStorage Android] Error storing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a securely stored value from Android Keystore
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await ExpoSecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`[SecureStorage Android] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a securely stored value from Android Keystore
   */
  async removeItem(key: string): Promise<void> {
    try {
      await ExpoSecureStore.deleteItemAsync(key);
      console.log(`[SecureStorage Android] Removed key: ${key}`);
    } catch (error) {
      console.error(`[SecureStorage Android] Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if secure storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
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
