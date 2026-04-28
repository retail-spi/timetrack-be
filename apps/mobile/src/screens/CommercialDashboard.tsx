import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api/client';
import { tokenStorage } from '../auth/tokenStorage';
import { TimeSummaryCard } from '../components/TimeSummaryCard';
import { getISOWeek } from 'date-fns';

interface Props {
  user: { firstName: string; [key: string]: any };
}

export default function CommercialDashboard({ user }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await api.timeEntries.list();
    setEntries(data);
  }, []);

  useEffect(() => { load(); }, []);

  const now = new Date();
  const currentWeek = getISOWeek(now);
  const weekEntries = entries.filter((e) => getISOWeek(new Date(e.date)) === currentWeek);

  // Commercial : focus sur déplacements et réunions client
  const travelEntries = weekEntries.filter((e) =>
    ['TRAVEL', 'CLIENT_MEETING'].includes(e.activityType?.code),
  );

  const totalHours = weekEntries.reduce((sum, e) => {
    const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000;
    return sum + diff - e.breakMinutes / 60;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commercial — {user.firstName}</Text>
        <TouchableOpacity onPress={async () => { await tokenStorage.clear(); router.replace('/login'); }}>
          <Text style={styles.logout}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={weekEntries}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListHeaderComponent={
          <>
            <TimeSummaryCard
              weekLabel={`${currentWeek}`}
              totalHours={totalHours}
              contractHours={38}
              pending={weekEntries.filter((e) => e.status === 'PENDING').length}
              approved={weekEntries.filter((e) => e.status === 'APPROVED').length}
            />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚗 Déplacements & Réunions cette semaine</Text>
              <Text style={styles.sectionCount}>{travelEntries.length} entrée(s)</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardActivity}>{item.activityType?.label}</Text>
            <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString('fr-BE')}</Text>
            {item.project && <Text style={styles.cardProject}>📁 {item.project.name}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune entrée cette semaine</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-time-entry')}>
        <Text style={styles.fabText}>+ Activité</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#064E3B' },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  logout: { color: '#6EE7B7', fontSize: 13 },
  section: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 14, color: '#374151', fontWeight: '500' },
  sectionCount: { fontSize: 14, color: '#059669', fontWeight: '700' },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, borderRadius: 10, padding: 14 },
  cardActivity: { fontSize: 15, fontWeight: '600', color: '#064E3B' },
  cardDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardProject: { fontSize: 13, color: '#2563EB', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#059669', borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
