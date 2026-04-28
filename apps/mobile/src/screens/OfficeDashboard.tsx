import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api/client';
import { tokenStorage } from '../auth/tokenStorage';
import { TimeSummaryCard } from '../components/TimeSummaryCard';
import { getISOWeek } from 'date-fns';

interface Props {
  user: { id: string; firstName: string; lastName: string; scope: string; role: string };
}

export default function OfficeDashboard({ user }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.timeEntries.list();
      setEntries(data);
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible de charger les entrées');
    }
  }, []);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const logout = async () => {
    await tokenStorage.clear();
    router.replace('/login');
  };

  // Calculs semaine courante
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const weekEntries = entries.filter((e) => {
    const d = new Date(e.date);
    return getISOWeek(d) === currentWeek && d.getFullYear() === now.getFullYear();
  });

  const totalHours = weekEntries.reduce((sum, e) => {
    const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000;
    return sum + diff - e.breakMinutes / 60;
  }, 0);

  const pending = weekEntries.filter((e) => e.status === 'PENDING').length;
  const approved = weekEntries.filter((e) => e.status === 'APPROVED').length;

  const statusColor = (status: string) =>
    status === 'APPROVED' ? '#059669' : status === 'REJECTED' ? '#DC2626' : '#D97706';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {user.firstName} 👋</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={weekEntries}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <TimeSummaryCard
            weekLabel={`${currentWeek}`}
            totalHours={totalHours}
            contractHours={38}
            pending={pending}
            approved={approved}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryRow}>
              <Text style={styles.entryDate}>
                {new Date(item.date).toLocaleDateString('fr-BE')}
              </Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.entryActivity}>{item.activityType?.label}</Text>
            <Text style={styles.entryTime}>
              {new Date(item.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
              {' → '}
              {new Date(item.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
              {item.breakMinutes > 0 && ` (pause ${item.breakMinutes}min)`}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune entrée cette semaine</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-time-entry')}
      >
        <Text style={styles.fabText}>+ Ajouter</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1E3A5F' },
  greeting: { color: '#fff', fontSize: 18, fontWeight: '600' },
  logout: { color: '#93C5FD', fontSize: 14 },
  entryCard: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, borderRadius: 10, padding: 14 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  entryDate: { fontSize: 14, fontWeight: '600', color: '#374151' },
  entryActivity: { fontSize: 15, color: '#1E3A5F', marginBottom: 4 },
  entryTime: { fontSize: 13, color: '#6B7280' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#2563EB', borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
