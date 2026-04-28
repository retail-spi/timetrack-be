import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { tokenStorage } from '../src/auth/tokenStorage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await tokenStorage.getToken();
      if (token) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
