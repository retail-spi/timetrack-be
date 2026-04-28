import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.setItem(key, value);
  },
  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      keys.forEach((k) => localStorage.removeItem(k));
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.multiRemove(keys);
  },
};

export const tokenStorage = {
  async setToken(token: string): Promise<void> {
    await storage.setItem(TOKEN_KEY, token);
  },
  async getToken(): Promise<string | null> {
    return storage.getItem(TOKEN_KEY);
  },
  async setUser(user: object): Promise<void> {
    await storage.setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser<T = object>(): Promise<T | null> {
    const raw = await storage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async clear(): Promise<void> {
    await storage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};