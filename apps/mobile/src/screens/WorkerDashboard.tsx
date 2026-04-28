import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api/client';
import { tokenStorage } from '../auth/tokenStorage';
import { TimeSummaryCard } from '../components/TimeSummaryCard';
import { getISOWeek } from 'date-fns';

interface Props {
  user: { firstName: string; [key: string]: any };
}

export default function WorkerDashboard({ user }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ hours: '', taskTypeId: '', note: '' });

  const load = useCallback(async () => {
    const [e, tt] = await Promise.all([api.workerEntries.list(), api.taskTypes.list()]);
    setEntries(e);
    setTaskTypes(tt);
  }, []);

  useEffect(() => { load(); }, []);

  const now = new Date();
  const currentWeek = getISOWeek(now);
  const weekEntries = entries.filter((e) => getISOWeek(new Date(e.date)) === currentWeek);
  const totalHours = weekEntries.reduce((sum, e) => sum + e.hours, 0);

  const submitEntry = async () => {
    const hours = parseFloat(form.hours);
    if (!form.hours || isNaN(hours)) {
      Alert.alert('Erreur', 'Saisissez un nombre d\'heures valide (ex: 7.5)');
      return;
    }
    const decimal = hours % 1;
    if (decimal !== 0 && decimal !== 0.5) {
      Alert.alert('Erreur', 'Les heures doivent être en .0 ou .5 (ex: 7.0, 7.5)');
      return;
    }
    if (!form.taskTypeId) {
      Alert.alert('Erreur', 'Sélectionnez un type de tâche');
      return;
    }

    try {
      await api.workerEntries.create({
        date: now.toISOString().split('T')[0],
        hours,
        taskTypeId: form.taskTypeId,
        note: form.note,
      });
      setModalVisible(false);
      setForm({ hours: '', taskTypeId: '', note: '' });
      await load();
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'enregistrer');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ouvrier — {user.firstName}</Text>
        <TouchableOpacity onPress={async () => { await tokenStorage.clear(); router.replace('/login'); }}>
          <Text style={styles.logout}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={weekEntries}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListHeaderComponent={
          <TimeSummaryCard
            weekLabel={`${currentWeek}`}
            totalHours={totalHours}
            contractHours={38}
            pending={weekEntries.filter((e) => e.status === 'PENDING').length}
            approved={weekEntries.filter((e) => e.status === 'APPROVED').length}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardHours}>{item.hours}h</Text>
              <Text style={styles.cardTask}>{item.taskType?.label}</Text>
            </View>
            <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString('fr-BE')}</Text>
            {item.note && <Text style={styles.cardNote}>{item.note}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune heure cette semaine</Text>}
      />

      {/* Modal saisie rapide */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Saisie heures</Text>

            <TextInput
              style={styles.input}
              placeholder="Heures (ex: 7.5)"
              keyboardType="decimal-pad"
              value={form.hours}
              onChangeText={(v) => setForm((f) => ({ ...f, hours: v }))}
            />

            <Text style={styles.label}>Type de tâche</Text>
            {taskTypes.map((tt) => (
              <TouchableOpacity
                key={tt.id}
                style={[styles.option, form.taskTypeId === tt.id && styles.optionSelected]}
                onPress={() => setForm((f) => ({ ...f, taskTypeId: tt.id }))}
              >
                <Text style={form.taskTypeId === tt.id ? styles.optionTextSelected : styles.optionText}>
                  {tt.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.input}
              placeholder="Note (facultatif)"
              value={form.note}
              onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={submitEntry}>
              <Text style={styles.submitText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Heures</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#7C3AED' },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  logout: { color: '#DDD6FE', fontSize: 13 },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, borderRadius: 10, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  cardHours: { fontSize: 24, fontWeight: '700', color: '#7C3AED' },
  cardTask: { fontSize: 15, color: '#374151' },
  cardDate: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  cardNote: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#7C3AED', borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  option: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 6 },
  optionSelected: { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  optionText: { color: '#374151' },
  optionTextSelected: { color: '#7C3AED', fontWeight: '600' },
  submitBtn: { backgroundColor: '#7C3AED', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#9CA3AF', marginTop: 12 },
});
