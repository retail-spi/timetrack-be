import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { tokenStorage } from '../src/auth/tokenStorage';
import OfficeDashboard from '../src/screens/OfficeDashboard';
import CommercialDashboard from '../src/screens/CommercialDashboard';
import WorkerDashboard from '../src/screens/WorkerDashboard';

type AuthUser = {
  id: string;
  role: string;
  scope: string;
  firstName: string;
  lastName: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    tokenStorage.getUser<AuthUser>().then(setUser);
  }, []);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user.scope === 'worker') return <WorkerDashboard user={user} />;
  if (user.scope === 'employee_commercial') return <CommercialDashboard user={user} />;
  return <OfficeDashboard user={user} />;
}
